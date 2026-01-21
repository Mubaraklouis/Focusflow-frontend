import useConfig from "~~/server/util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
    const { baseUrl } = useConfig()
    
    // Get the frontend URL from the request (handles both development and production)
    const requestUrl = getRequestURL(event)
    const frontendUrl = `${requestUrl.protocol}//${requestUrl.host}`

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

        // Save user_id in cookie for profile retrieval (same as regular login)
        if (userData?.user_id || userData?.user?.id) {
            const userId = userData.user_id || userData.user.id
            
            setCookie(event, 'focusflow-user-id', String(userId), {
                path: '/',
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            })
        }

        if (userData && (userData.user || userData.success)) {
            // Successful authentication - redirect to dashboard
            return sendRedirect(event, '/dashboard')
        }

        // If there's a redirect in the response, follow it
        const locationHeader = callbackResponse.headers.get('location')
        if (locationHeader) {
            // Replace any localhost URLs with the actual frontend URL
            let redirectUrl = locationHeader
            if (locationHeader.includes('localhost:3000')) {
                redirectUrl = locationHeader.replace(/http:\/\/localhost:3000/g, frontendUrl)
            }
            
            // If it's a relative URL, make it absolute
            if (redirectUrl.startsWith('/')) {
                return sendRedirect(event, redirectUrl)
            }
            return sendRedirect(event, redirectUrl)
        }

        // Default success redirect
        return sendRedirect(event, '/dashboard')

    } catch (error: any) {
        console.error('Google callback error:', error)

        // Redirect to login page with error message
        const errorMessage = encodeURIComponent(
            error.data?.message || error.message || 'Google authentication failed'
        )

        // Use relative URL to stay on the correct domain
        return sendRedirect(event, `/login?error=${errorMessage}`)
    }
})
