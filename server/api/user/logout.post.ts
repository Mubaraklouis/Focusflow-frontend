import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

/**
 * POST /api/user/logout
 * 
 * Handles user logout by invalidating the session on Laravel backend
 * and clearing all authentication cookies.
 * 
 * Flow:
 * 1. Extract cookies from the incoming browser request (contains user's session)
 * 2. Extract the XSRF token from the cookies for CSRF protection
 * 3. Send logout request to Laravel with the user's session cookies
 * 4. Forward Laravel's response cookies (which invalidate the session) to browser
 * 5. Explicitly clear any remaining session cookies
 * 
 * @returns {Object} { success: boolean, message: string }
 * @throws {Error} 401 if session invalid, 500 for server errors
 */
export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()

  try {
    // Get the cookies from the incoming request (the user's actual session cookies)
    // This is crucial - we must forward the user's existing authenticated session
    const incomingCookies = getHeader(event, 'cookie') || ''

    // Extract the XSRF token from the incoming cookies for CSRF protection
    const xsrfMatch = incomingCookies.match(/XSRF-TOKEN=([^;]+)/)
    let xsrfToken = ''
    if (xsrfMatch) {
      xsrfToken = decodeURIComponent(xsrfMatch[1])
    }

    // Send logout request to Laravel with the user's session cookies
    const logoutResponse = await $fetch.raw(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': incomingCookies
      },
      credentials: 'include'
    })

    // Extract cookies from Laravel's response (these invalidate/replace the session)
    const allCookies = logoutResponse.headers.getSetCookie?.() || []

    // Forward Laravel's response cookies to the browser
    useForwardCookies(allCookies, event)

    // Explicitly clear all Nuxt/app session cookies as a fallback
    // HttpOnly cookies can only be cleared server-side
    const cookiesToClear = [
      'focusflow-session',
      'focusflow_session',
      'focus-session',
      'laravel_session',
      'XSRF-TOKEN'
    ]

    cookiesToClear.forEach(cookieName => {
      setCookie(event, cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return { success: true, message: 'Logged out successfully' }

  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || 'Logout failed',
    })
  }
})