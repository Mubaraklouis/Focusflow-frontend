import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"
import useConfig from "~~/server/util/useConfig"

/**
 * # 🔄 Resend Email Verification Proxy
 * 
 * Server-side handler that proxies the resend verification email request to Laravel.
 * This endpoint allows authenticated users to request a new verification email.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Description |
 * | :--- | :--- | :--- |
 * | **1** | **Get Cookies** | Retrieves cookies from the incoming request |
 * | **2** | **CSRF Handshake** | Gets fresh XSRF-TOKEN from Laravel |
 * | **3** | **Proxy Request** | Forwards request to Laravel's verification endpoint |
 * | **4** | **Cookie Sync** | Forwards any new cookies back to the client |
 *
 * @param event - The H3 event object
 * @returns Response with verification status
 */
export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()

  try {
    // Get incoming cookies from the request
    const incomingCookies = getHeader(event, 'cookie') || ''
    
    // Get CSRF token
    const { xsrfToken, csrfCookies } = await useGetCRSFToken()
    
    // Merge incoming cookies with CSRF cookies
    const cookieString = incomingCookies ? `${incomingCookies}; ${csrfCookies.join('; ')}` : csrfCookies.join('; ')

    // Send resend verification request
    const response = await $fetch.raw(`${baseUrl}/email/verification-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString,
        'Referer': 'http://localhost:3000',
        'Origin': 'http://localhost:3000',
      },
      credentials: 'include'
    })

    // Forward cookies to browser
    const allCookies = response.headers.getSetCookie?.() || []
    const combinedCookies = [...csrfCookies, ...allCookies]
    useForwardCookies(combinedCookies, event)

    return response._data || { status: 'verification-link-sent' }

  } catch (error: any) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      throw createError({
        statusCode: 429,
        message: 'Too many requests. Please wait before trying again.'
      })
    }

    // Handle already verified (redirect response)
    if (error.response?.status === 302 || error.response?.status === 200) {
      return { status: 'already-verified' }
    }

    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || error.message || 'Failed to send verification email'
    })
  }
})
