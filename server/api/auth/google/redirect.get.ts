import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { baseUrl } = useConfig()

    try {
        const backendUrl = `${baseUrl}/api/v1/auth/google/redirect`

        // Forward the request to Laravel's Google redirect endpoint
        const response = await $fetch.raw(backendUrl, {
            method: 'GET',
            credentials: 'include',
            redirect: 'manual'
        })

        // Extract any cookies from the response
        const cookies = response.headers.getSetCookie?.() || []

        // Forward cookies to the browser
        cookies.forEach((cookie: string) => {
            appendResponseHeader(event, 'Set-Cookie', cookie)
        })

        // The Laravel endpoint should return a redirect URL to Google (302)
        const locationHeader = response.headers.get('location')

        if (locationHeader) {
            return sendRedirect(event, locationHeader)
        }

        // Fallback for cases where it returns 200 with URL in body (unlikely with redirect: manual but good to keep)
        const redirectUrl = (response._data as any)?.url || response._data

        if (typeof redirectUrl === 'string' && redirectUrl.startsWith('http')) {
            return sendRedirect(event, redirectUrl)
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to get Google OAuth redirect URL'
        })

    } catch (error: any) {
        console.error('Google redirect error:', error)

        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to initiate Google authentication',
            data: error.data
        })
    }
})
