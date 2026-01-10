import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()

  try {
    // 1. Get the current CSRF token from the browser/existing session
    const { xsrfToken, cookieString } = await useGetCRSFToken()

    // 2. Tell Laravel to invalidate the session
    const logoutResponse = await $fetch.raw(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString
      },
      credentials: 'include'
    })

    // 3. Extract the expired/cleared cookies from Laravel
    const allCookies = logoutResponse.headers.getSetCookie?.() || []

    // 4. Forward the "expired" cookies to the browser to clear them locally
    useForwardCookies(allCookies, event)

    // 5. Explicitly clear all Nuxt/app session cookies (HttpOnly cookies can only be cleared server-side)
    const cookiesToClear = [
      'focusflow-session',
      'focusflow_session',
      'focus-session',
      'laravel_session',
      'XSRF-TOKEN'
    ]

    cookiesToClear.forEach(cookieName => {
      // Set cookie with expired date to clear it
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