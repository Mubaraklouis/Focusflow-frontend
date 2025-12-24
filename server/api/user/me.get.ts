export default defineEventHandler(async (event) => {
    const baseUrl = 'http://localhost:8000'

    try {
        // Get cookies from the client request
        const cookies = getRequestHeader(event, 'cookie') || ''
        const xsrfToken = getRequestHeader(event, 'x-xsrf-token')

        console.log('me.get.ts: Full cookies from browser:', cookies)
        console.log('me.get.ts: Fetching authenticated user...')

        // Request the authenticated user from Laravel
        const userResponse = await $fetch.raw(`${baseUrl}/api/user`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // Forward cookies from the browser to Laravel
                'Cookie': cookies,
                // Required for Laravel Sanctum stateful authentication
                'Referer': 'http://localhost:3000',
                'Origin': 'http://localhost:3000',
                'X-Requested-With': 'XMLHttpRequest',
                ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {})
            },
            credentials: 'include'
        })

        // Forward any updated cookies back to the browser
        const setCookies = userResponse.headers.getSetCookie?.() || []
        setCookies.forEach((cookie: string) => {
            appendResponseHeader(event, 'Set-Cookie', cookie)
        })

        console.log('me.get.ts: User fetched successfully:', JSON.stringify(userResponse._data, null, 2))

        // Return the authenticated user data
        return userResponse._data

    } catch (error: any) {
        console.error('User not authenticated:', error)

        // User is not authenticated
        if (error.statusCode === 401 || error.response?.status === 401) {
            throw createError({
                statusCode: 401,
                message: 'Unauthenticated'
            })
        }

        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to fetch user'
        })
    }
})
