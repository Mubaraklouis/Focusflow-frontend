import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"
import useConfig from "~~/server/util/useConfig"

/**
 * Register response from Laravel backend
 */
interface RegisterResponse {
  status: string;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  user_id: number;
}

/**
 * # 🛡️ Laravel Sanctum Register Proxy
 * 
 * Server-side handler that proxies registration requests to Laravel backend.
 * Handles CSRF token, cookie forwarding, and saves user_id for profile retrieval.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Description |
 * | :--- | :--- | :--- |
 * | **1** | **CSRF Handshake** | Gets XSRF-TOKEN from Laravel |
 * | **2** | **Register Request** | Sends registration data to Laravel |
 * | **3** | **Cookie Sync** | Forwards session cookies to browser |
 * | **4** | **User ID Cookie** | Saves user_id for profile retrieval |
 *
 * @param event - The H3 event object
 * @returns Registration response with user data
 */
export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()
  const { name, email, password, password_confirmation } = await readBody(event)

  try {
    // Get CSRF token
    const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

    // Send registration request
    const registerResponse = await $fetch.raw<RegisterResponse>(`${baseUrl}/register`, {
      method: 'POST',
      body: {
        name,
        email,
        password,
        password_confirmation
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString
      },
      credentials: 'include'
    })

    // Forward cookies to browser
    const allCookies = registerResponse.headers.getSetCookie?.() || []
    const combinedCookies = [...csrfCookies, ...allCookies]
    useForwardCookies(combinedCookies, event)

    // Save user_id in cookie for profile retrieval
    const responseData = registerResponse._data
    if (responseData?.user_id || responseData?.user?.id) {
      const userId = responseData.user_id || responseData.user.id
      
      setCookie(event, 'focusflow-user-id', String(userId), {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return responseData

  } catch (error: any) {
    
    if (error.response?.status === 422) {
      throw createError({
        statusCode: 422,
        message: error.data?.message || 'Validation failed',
        data: error.data?.errors
      })
    }

    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || error.message || 'Registration failed'
    })
  }
})