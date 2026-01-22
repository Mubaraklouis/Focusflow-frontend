import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"
import useConfig from "~~/server/util/useConfig"

/**
 * # ✅ Email Verification Proxy
 * 
 * Server-side handler that verifies a user's email using the id and hash from
 * the verification link. This is called when a user clicks the link in their email.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Description |
 * | :--- | :--- | :--- |
 * | **1** | **Parse Body** | Extracts id, hash, expires, and signature from request |
 * | **2** | **CSRF Handshake** | Gets fresh XSRF-TOKEN from Laravel |
 * | **3** | **Verify Request** | Forwards verification to Laravel |
 * | **4** | **Cookie Sync** | Forwards session cookies back to client |
 *
 * @param event - The H3 event object
 * @returns Verification success response
 */
export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()
  const body = await readBody(event)
  const { id, hash, expires, signature } = body

  if (!id || !hash) {
    throw createError({
      statusCode: 400,
      message: 'Missing verification parameters'
    })
  }

  try {
    // Get incoming cookies from the request
    const incomingCookies = getHeader(event, 'cookie') || ''
    
    // Get CSRF token
    const { xsrfToken, csrfCookies } = await useGetCRSFToken()
    
    // Merge incoming cookies with CSRF cookies
    const cookieString = incomingCookies ? `${incomingCookies}; ${csrfCookies.join('; ')}` : csrfCookies.join('; ')

    // Build the verification URL with query params
    let verifyUrl = `${baseUrl}/verify-email/${id}/${hash}`
    if (expires && signature) {
      verifyUrl += `?expires=${expires}&signature=${signature}`
    }

    // Send verification request
    const response = await $fetch.raw(verifyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString,
        'Referer': 'http://localhost:3000',
        'Origin': 'http://localhost:3000',
      },
      credentials: 'include',
      redirect: 'manual' // Don't follow redirects automatically
    })

    // Forward cookies to browser
    const allCookies = response.headers.getSetCookie?.() || []
    const combinedCookies = [...csrfCookies, ...allCookies]
    useForwardCookies(combinedCookies, event)

    return { 
      status: 'success',
      message: 'Email verified successfully'
    }

  } catch (error: any) {
    // Handle 302 redirect as success (Laravel redirects after verification)
    if (error.response?.status === 302) {
      return { 
        status: 'success',
        message: 'Email verified successfully'
      }
    }

    // Handle invalid signature
    if (error.response?.status === 403) {
      throw createError({
        statusCode: 403,
        message: 'Invalid or expired verification link'
      })
    }

    // Handle already verified
    if (error.response?.status === 409) {
      return {
        status: 'already-verified',
        message: 'Email is already verified'
      }
    }

    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || error.message || 'Email verification failed'
    })
  }
})
