export const useAuth = () => {
    const user = useState<any>('auth-user', () => null)
    const isAuthenticated = computed(() => !!user.value)

    // Fetch the authenticated user
    const fetchUser = async () => {
        try {
            console.log('useAuth: Fetching user from /api/user/me...')

            // Get XSRF token from cookies (client-side only)
            const xsrfToken = typeof document !== 'undefined'
                ? document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1]
                : undefined

            const response = await $fetch('/api/user/me', {
                credentials: 'include', // IMPORTANT: Send cookies with the request
                headers: {
                    'Accept': 'application/json',
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {})
                }
            })
            console.log('useAuth: User fetched successfully:', response)
            user.value = response
            return response
        } catch (error: any) {
            console.error('useAuth: Failed to fetch user:', error)
            if (error.statusCode === 401) {
                user.value = null
            }
            throw error
        }
    }

    // Check if user is authenticated
    const checkAuth = async () => {
        try {
            await fetchUser()
            return true
        } catch {
            return false
        }
    }

    // Logout
    const logout = async () => {
        try {
            await $fetch('/api/user/logout', {
                method: 'POST',
                credentials: 'include'
            })
            user.value = null
            await navigateTo('/login')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    return {
        user,
        isAuthenticated,
        fetchUser,
        checkAuth,
        logout
    }
}
