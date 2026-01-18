/**
 * Composable for handling Google OAuth authentication
 * Redirects to the Nuxt server's Google auth endpoint which proxies to Laravel
 * and ensures cookies are set on the frontend domain
 */
export const useGoogleAuth = () => {
    /**
     * Initiates the Google OAuth flow
     * Redirects the user to the Google consent screen via our Nuxt server
     */
    const initiateGoogleAuth = () => {
        // Redirect to our Nuxt server endpoint which will handle the OAuth flow
        // This ensures cookies are set on the frontend domain
        window.location.href = '/api/auth/google/redirect'
    }

    return {
        initiateGoogleAuth
    }
}

export default useGoogleAuth
