/**
 * # Email Verified Route Middleware
 *
 * A Nuxt route middleware that ensures the user's email is verified
 * before accessing protected pages. Should be used after the 'auth' middleware.
 *
 * ## 🔐 Verification Strategy
 *
 * 1. Fetches the current user's profile from the API
 * 2. Checks if `email_verified_at` is set
 * 3. Redirects to `/verify-email` if not verified
 *
 * ## 🔧 Usage
 *
 * Apply to pages that require verified email:
 * ```typescript
 * definePageMeta({
 *     middleware: ['auth', 'verified']
 * })
 * ```
 */
export default defineNuxtRouteMiddleware(async (to) => {
    try {
        // Fetch current user to check verification status
        const response = await $fetch<{ data: { email_verified_at: string | null } }>('/api/user')
        
        // If email is not verified, redirect to verify-email page
        if (!response?.data?.email_verified_at) {
            console.log('Email not verified, redirecting to /verify-email')
            return navigateTo('/verify-email')
        }
    } catch (error: any) {
        // If we can't fetch user (401), redirect to login
        console.error('Error checking verification status:', error)
        
        if (error.statusCode === 401) {
            return navigateTo('/login')
        }
    }
})
