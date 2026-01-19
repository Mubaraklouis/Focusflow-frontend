import useConfig from "~~/server/util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
    const { baseUrl } = useConfig()

    // Get query parameters from the OAuth callback (code, state, etc.)
    const query = getQuery(event)

    // Get cookies from the browser request to forward to Laravel
    // This is CRITICAL - Laravel needs the same session to validate OAuth state
    const browserCookies = getHeader(event, 'cookie') || ''

    try {
        // Forward the callback to Laravel's Google callback endpoint with all query params
        const callbackResponse = await $fetch.raw(`http://ec2-16-171-250-147.eu-north-1.compute.amazonaws.com/api/v1/auth/google/callback`, {
            method: 'GET',
            query: query,
            credentials: 'include',
            redirect: 'manual',
            headers: {
                'Cookie': browserCookies
            }
        })

        // Extract authentication cookies from Laravel
        const cookies = callbackResponse.headers.getSetCookie?.() || []

        // Forward all cookies to the browser on the frontend domain
        useForwardCookies(cookies, event)

        // Check if the response contains user data (successful authentication)
        const userData = callbackResponse._data as any

        if (userData && (userData.user || userData.success)) {
            // Successful authentication - redirect to dashboard
            return sendRedirect(event, '/dashboard')
        }

        // If there's a redirect in the response, follow it
        const locationHeader = callbackResponse.headers.get('location')
        if (locationHeader) {
            // If it's a relative URL, make it absolute
            if (locationHeader.startsWith('/')) {
                return sendRedirect(event, locationHeader)
            }
            return sendRedirect(event, locationHeader)
        }

        // Default success redirect
        return sendRedirect(event, '/dashboard')

    } catch (error: any) {
        console.error('Google callback error:', error)

        // Redirect to login page with error message
        const errorMessage = encodeURIComponent(
            error.data?.message || error.message || 'Google authentication failed'
        )

        return sendRedirect(event, `/login?error=${errorMessage}`)
    }
})
