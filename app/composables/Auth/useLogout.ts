/**
 * Composable for handling user logout functionality.
 * Makes a POST request to the Nuxt server logout endpoint which 
 * communicates with Laravel to invalidate the session.
 */

import { useAuth } from '~/composables/Auth/useAuth'

export const useLogout = () => {
    const isLoggingOut = ref(false)
    const error = ref<string | null>(null)

    /**
     * Clears all cookies from the browser to ensure complete logout.
     */
    const clearAuthCookies = () => {
        if (typeof document === 'undefined') return

        // Get all cookies and clear each one
        const cookies = document.cookie.split(';')

        cookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0]?.trim()
            if (!cookieName) return

            // Clear cookie with various path/domain combinations
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
        })
    }

    /**
     * Performs the logout operation.
     * Clears the user session and redirects to the login page.
     */
    const logout = async () => {
        isLoggingOut.value = true
        error.value = null

        try {
            await $fetch('/api/user/logout', {
                method: 'POST',
                credentials: 'include'
            })

            // Clear any client-side auth state
            const user = useState<any>('auth-user')
            user.value = null

            // Update authentication state
            const { setAuthenticated } = useAuth()
            setAuthenticated(false)

            // Clear auth cookies from browser
            clearAuthCookies()

            // Use external: true to force a full browser redirect
            // This ensures the server-side state is properly cleared
            await navigateTo('/login', { external: true })
        } catch (err: any) {
            console.error('Logout failed:', err)
            error.value = err.data?.message || 'Failed to logout. Please try again.'

            // Even if server logout fails, clear local state and cookies
            const user = useState<any>('auth-user')
            user.value = null

            // Update authentication state
            const { setAuthenticated } = useAuth()
            setAuthenticated(false)

            clearAuthCookies()

            // Still redirect to login with full page reload
            await navigateTo('/login', { external: true })
        } finally {
            isLoggingOut.value = false
        }
    }

    return {
        logout,
        isLoggingOut,
        error
    }
}

