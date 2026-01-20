import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig" 
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

/**
 * # 🛡️ Laravel Sanctum Login Proxy
 * * This server-side handler manages the complex "stateful" authentication flow 
 * required by Laravel Sanctum. It prevents CORS issues and manages security 
 * tokens that are difficult to handle on the client side.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Code Logic |
 * | :--- | :--- | :--- |
 * | **1** | **CSRF Handshake** | Calls `useGetCRSFToken()` to retrieve `XSRF-TOKEN` and initial cookies. |
 * | **2** | **Credential Proxy** | Forwards `email` and `password` to `${baseUrl}/login` using `$fetch.raw`. |
 * | **3** | **Header Injection** | Attaches `X-XSRF-TOKEN` and the initial `Cookie` string to the request. |
 * | **4** | **Session Capture** | Uses `response.headers.getSetCookie()` to grab the new `laravel_session` cookie. |
 * | **5** | **Cookie Sync** | Combines all cookies and calls `useForwardCookies()` to update the user's browser. |
 *
 * ## 🚀 Frontend Usage Example
 * ```typescript
 * // Use this in your login.vue component
 * const { data, error } = await useFetch('/api/auth/login', {
 * method: 'POST',
 * body: { email: 'admin@test.com', password: 'password' }
 * })
 * ```
 *
 * @param event - The H3 event object (Nuxt Server Context).
 * @returns {Promise<any>} The authenticated user data from Laravel.
 * * @throws {H3Error} **422/401** - Returns Laravel's validation or auth error messages.
 * @throws {H3Error} **500** - Triggered if the backend is unreachable or crashes.
 */
export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()
  const { email, password } = await readBody(event)

  try {
    // --- STEP 1: Handshake ---
    const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

    // --- STEP 2 & 3: Proxy Request ---
    const loginResponse = await $fetch.raw(`${baseUrl}/login`, {
      method: 'POST',
      body: { email, password },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString
      },
      credentials: 'include'
    })

    // --- STEP 4: Extract Session ---
    const allCookies = loginResponse.headers.getSetCookie?.() || []
    
    // --- STEP 5: Merge & Forward ---
    const combinedCookies = [...csrfCookies, ...allCookies]
    useForwardCookies(combinedCookies, event)

    return loginResponse._data

  } catch (error: any) {
    if (error.response?.status === 422 || error.response?.status === 401) {
      throw createError({
        statusCode: error.response.status,
        message: error.data?.message || 'Invalid credentials',
        data: error.data?.errors
      })
    }
     
    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || error.message || 'Login failed',
      data: error.data
    })
  }
})