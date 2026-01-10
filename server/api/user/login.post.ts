import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig" // Ensure this path matches your structure
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
  const { baseUrl } = useConfig()
  const { email, password } = await readBody(event)

  try {
    // 1. Get the CSRF token and initial cookies from Laravel Sanctum
    const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

    // 2. Perform the Login request
    const loginResponse = await $fetch.raw(`${baseUrl}/login`, {
      method: 'POST',
      body: {
        email,
        password,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString
      },
      credentials: 'include'
    })

    // 3. Extract the new session cookies (laravel_session, etc.)
    const allCookies = loginResponse.headers.getSetCookie?.() || []
    
    // 4. Combine the initial CSRF cookies with the new session cookies
    const combinedCookies = [...csrfCookies, ...allCookies]
    
    // 5. Forward everything to the browser so the user stays logged in
    useForwardCookies(combinedCookies, event)

    return loginResponse._data

  } catch (error: any) {
    // Handle Unauthorized or Validation errors
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