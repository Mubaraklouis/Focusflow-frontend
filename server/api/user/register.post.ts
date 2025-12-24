export default defineEventHandler(async (event) => {

  const baseUrl = 'http://localhost:8000'

  const { name, email, password, password_confirmation } = await readBody(event)

  try {
    // Step 1: Get CSRF cookie from Laravel Sanctum
    console.log('Step 1: Fetching CSRF cookie...')
    const csrfResponse = await $fetch.raw(`${baseUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include'
    })

    console.log('CSRF Response Status:', csrfResponse.status)

    // Get all Set-Cookie headers properly
    const csrfCookies = csrfResponse.headers.getSetCookie?.() || []
    console.log(`Received ${csrfCookies.length} cookie(s) from Laravel`)

    // Extract XSRF-TOKEN value for the registration request
    let xsrfToken = ''
    const cookieString = csrfCookies.join('; ')

    // Parse the XSRF-TOKEN from cookies
    const xsrfMatch = cookieString.match(/XSRF-TOKEN=([^;]+)/)
    if (xsrfMatch) {
      xsrfToken = decodeURIComponent(xsrfMatch[1])
      console.log('Extracted XSRF-TOKEN for registration request')
    }

    // Step 2: Register the user with CSRF token
    console.log('Step 2: Sending registration request...')
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
        // Include the CSRF token in the header (required by Laravel Sanctum)
        'X-XSRF-TOKEN': xsrfToken,
        // Forward all cookies to Laravel
        'Cookie': cookieString
      },
      credentials: 'include'
    })

    console.log('Registration Response Status:', registerResponse.status)

    // Step 3: Forward all cookies to the browser (both CSRF and session cookies)
    const allCookies = registerResponse.headers.getSetCookie?.() || []
    const combinedCookies = [...csrfCookies, ...allCookies]

    // Remove duplicates (keep the latest)
    const uniqueCookies = new Map()
    combinedCookies.forEach((cookie: string) => {
      const cookieName = cookie.split('=')[0]
      uniqueCookies.set(cookieName, cookie)
    })

    // Forward all unique cookies to the browser
    uniqueCookies.forEach((cookie: string) => {
      appendResponseHeader(event, 'Set-Cookie', cookie)
    })

    console.log(`Successfully forwarded ${uniqueCookies.size} cookie(s) to browser`)
    console.log('Registration successful!')

    // Return the response data from Laravel
    return registerResponse._data

  } catch (error: any) {
    console.error('Registration error:', error)
    console.error('Error status:', error.statusCode || error.response?.status)
    console.error('Error data:', error.data)
    console.error('Error message:', error.message)

    // Handle validation errors
    if (error.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2))
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