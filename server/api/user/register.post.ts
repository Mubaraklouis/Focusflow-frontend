import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

/**
 * # User Registration Endpoint
 *
 * Handles new user registration by proxying the request to the Laravel backend.
 * This endpoint manages the entire registration flow, including CSRF protection,
 * session initialization, and stateful authentication cookie handling.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Code Logic |
 * | :--- | :--- | :--- |
 * | **1** | **Config Loading** | Retrieves `baseUrl` via `useConfig()`. |
 * | **2** | **Request Parsing** | Extracts registration data (`name`, `email`, etc.) using `readBody(event)`. |
 * | **3** | **CSRF Handshake** | Initiates session and retrieves `XSRF-TOKEN` via `useGetCRSFToken()`. |
 * | **4** | **Proxy Request** | Forwards payload to Laravel `/register` endpoint including CSRF headers. |
 * | **5** | **Cookie Sync** | Captures new session/XSRF cookies and forwards them using `useForwardCookies()`. |
 *
 * ## Usage Example
 * ```typescript
 * const { data, error } = await useFetch('/api/user/register', {
 *   method: 'POST',
 *   body: {
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     password: 'secret-password',
 *     password_confirmation: 'secret-password'
 *   }
 * })
 * ```
 *
 * @param event - The H3 event context.
 * @param body.name - The unique username for the new account.
 * @param body.email - The unique email address for the new account.
 * @param body.password - The password for the new account (min 8 chars).
 * @param body.password_confirmation - Must match the password field logic.
 *
 * @returns {Promise<User>} The registered user object returned by the backend.
 *
 * @throws {H3Error<422>} **Validation Failed** - If the input data is invalid (e.g., email already taken, passwords do not match).
 * @throws {H3Error<500>} **Server Error** - If the registration fails due to backend connectivity or internal errors.
 */
export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()
  const { name, email, password, password_confirmation } = await readBody(event)

  try {
    // --- STEP 1: Handshake ---
    const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

    // --- STEP 2: Proxy Request ---
    const registerResponse = await $fetch.raw(`${baseUrl}/register`, {
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

    // --- STEP 3: Cookie Sync ---
    const allCookies = registerResponse.headers.getSetCookie?.() || []
    const combinedCookies = [...csrfCookies, ...allCookies]
    useForwardCookies(combinedCookies, event)

    return registerResponse._data

  } catch (error: any) {
    if (error.data?.errors) {
      throw createError({
        statusCode: 422,
        message: 'Validation failed',
        data: { errors: error.data.errors }
      })
    }
    throw createError({
      statusCode: error.response?.status || error.statusCode || 500,
      message: error.data?.message || error.message || 'Registration failed',
      data: error.data
    })
  }
})