import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { baseUrl, frontendUrl } = useConfig()
    const path = event.context.params?.slug || ''
    const url = `${baseUrl}/api/admin/${path}`
    
    // Create fetch options
    const options: any = {
        method: event.method,
        headers: {
            'Accept': 'application/json',
            'Referer': frontendUrl,
            'Origin': frontendUrl
        }
    }
    
    // Forward query params
    const query = getQuery(event)
    if (Object.keys(query).length > 0) {
        options.query = query
    }
    
    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
        options.body = await readBody(event)
    }
    
    // Forward auth headers/cookies if present
    const authHeader = getHeader(event, 'Authorization')
    if (authHeader) options.headers['Authorization'] = authHeader
    
    const cookieHeader = getHeader(event, 'cookie')
    if (cookieHeader) options.headers['cookie'] = cookieHeader
    
    // Extract XSRF-TOKEN from cookies to send as a header, as required by Laravel Sanctum
    const xsrfToken = getCookie(event, 'XSRF-TOKEN')
    if (xsrfToken) {
        options.headers['X-XSRF-TOKEN'] = xsrfToken
    }

    // Proxy request
    try {
        const response = await $fetch(url, options)
        return response
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Admin API Error',
            data: error.data
        })
    }
})
