/**
 * # useAuth Composable
 *
 * A Vue composable that manages user authentication state for the FocusFlow application.
 * This composable provides reactive authentication status and methods to verify or
 * manually set the authentication state.
 *
 * ## 🎯 Purpose
 *
 * - Provides a centralized, reactive authentication state across the application
 * - Verifies authentication by checking Laravel Sanctum session cookies
 * - Works seamlessly on both server-side (SSR) and client-side (SPA)
 * - Integrates with Nuxt's `useState` for SSR hydration
 *
 * ## 🔐 Authentication Model
 *
 * Authentication is determined by the presence of **both** cookies:
 * - `focusflow-session` - Laravel session identifier
 * - `XSRF-TOKEN` - CSRF protection token
 *
 * Both cookies are set by the Laravel backend upon successful login/registration.
 *
 * ## 📦 Exports
 *
 * | Export | Type | Description |
 * | :----- | :--- | :---------- |
 * | `isAuthenticated` | `Ref<boolean>` | Reactive auth state, hydrated across SSR/client |
 * | `checkAuth` | `() => boolean` | Verifies cookies and updates state |
 * | `setAuthenticated` | `(value: boolean) => void` | Manually sets auth state |
 *
 * ## 🔧 Usage Examples
 *
 * ### Basic Usage in a Component
 * ```typescript
 * const { isAuthenticated } = useAuth()
 *
 * // Reactive - updates UI automatically
 * watchEffect(() => {
 *     console.log('Auth status:', isAuthenticated.value)
 * })
 * ```
 *
 * ### After Successful Login
 * ```typescript
 * const { setAuthenticated } = useAuth()
 *
 * // After login API call succeeds
 * setAuthenticated(true)
 * await navigateTo('/dashboard', { external: true })
 * ```
 *
 * ### In Middleware
 * ```typescript
 * const { checkAuth, isAuthenticated } = useAuth()
 *
 * // Server-side: verify cookies directly
 * if (import.meta.server) {
 *     checkAuth() // Updates isAuthenticated based on cookies
 * }
 *
 * // Client-side: trust hydrated state
 * if (!isAuthenticated.value) {
 *     return navigateTo('/login')
 * }
 * ```
 *
 * ## ⚠️ Important Notes
 *
 * 1. **httpOnly Cookies**: On client-side, httpOnly cookies cannot be read.
 *    The `checkAuth()` function should primarily be called server-side.
 *
 * 2. **State Hydration**: The `isAuthenticated` state uses Nuxt's `useState`,
 *    which automatically hydrates from server to client during SSR.
 *
 * 3. **Post-Auth Navigation**: After login/register, always use
 *    `navigateTo('/dashboard', { external: true })` to ensure cookies
 *    are sent with the next request.
 *
 * @module useAuth
 * @see {@link checkAuth} for cookie verification logic
 * @see {@link setAuthenticated} for manual state management
 */
export const useAuth = () => {
    /**
     * Reactive authentication state.
     *
     * This state is shared across the application using Nuxt's `useState`.
     * It is automatically hydrated from server to client during SSR.
     *
     * @type {Ref<boolean>}
     * @default false
     *
     * @example
     * ```typescript
     * const { isAuthenticated } = useAuth()
     *
     * // Use in template
     * // <div v-if="isAuthenticated">Welcome!</div>
     *
     * // Use in script
     * if (isAuthenticated.value) {
     *     console.log('User is logged in')
     * }
     * ```
     */
    const isAuthenticated = useState<boolean>('is-authenticated', () => false)

    /**
     * Verifies user authentication by checking for required session cookies.
     *
     * This function reads the `focusflow-session` and `XSRF-TOKEN` cookies
     * using Nuxt's `useCookie` API. Both cookies must be present for the
     * user to be considered authenticated.
     *
     * ## 🔍 Cookie Requirements
     *
     * | Cookie | Purpose | Set By |
     * | :----- | :------ | :----- |
     * | `focusflow-session` | Laravel session identifier | Backend on login |
     * | `XSRF-TOKEN` | CSRF protection token | Backend on CSRF handshake |
     *
     * ## ⚙️ Environment Behavior
     *
     * | Environment | Cookie Access | Recommended Usage |
     * | :---------- | :------------ | :---------------- |
     * | **Server**  | Full (including httpOnly) | ✅ Primary verification |
     * | **Client**  | Limited (no httpOnly) | ⚠️ May have stale data |
     *
     * ## 📋 Side Effects
     *
     * - Updates `isAuthenticated` state to `true` if both cookies exist
     * - Updates `isAuthenticated` state to `false` if any cookie is missing
     * - Logs verification results to console for debugging
     *
     * @returns {boolean} `true` if both session cookies are present, `false` otherwise
     *
     * @example
     * ```typescript
     * // In server-side middleware
     * const { checkAuth } = useAuth()
     *
     * if (import.meta.server) {
     *     const isAuth = checkAuth()
     *     if (!isAuth) {
     *         return navigateTo('/login')
     *     }
     * }
     * ```
     *
     * @example
     * ```typescript
     * // Manual verification (e.g., on page mount)
     * const { checkAuth, isAuthenticated } = useAuth()
     *
     * onMounted(() => {
     *     checkAuth()
     *     console.log('Authenticated:', isAuthenticated.value)
     * })
     * ```
     */
    const checkAuth = (): boolean => {
        // Use Nuxt's useCookie which works on both server and client
        const focusflowSession = useCookie('focusflow-session')
        const xsrfToken = useCookie('XSRF-TOKEN')

        const hasFocusflowSession = !!focusflowSession.value
        const hasXsrfToken = !!xsrfToken.value

        console.log('useAuth: Checking cookies - focusflow-session:', hasFocusflowSession, 'XSRF-TOKEN:', hasXsrfToken)

        // User is authenticated if BOTH tokens exist
        if (hasFocusflowSession && hasXsrfToken) {
            console.log('useAuth: Both session tokens found, user is authenticated')
            isAuthenticated.value = true
            return true
        }

        console.log('useAuth: Missing tokens, user is not authenticated')
        isAuthenticated.value = false
        return false
    }

    /**
     * Manually sets the authentication state.
     *
     * Use this function to update the authentication state after successful
     * login or logout operations, before navigating to protected/public routes.
     *
     * ## 🔧 Common Use Cases
     *
     * | Scenario | Value | Followed By |
     * | :------- | :---- | :---------- |
     * | After login success | `true` | `navigateTo('/dashboard', { external: true })` |
     * | After logout | `false` | `navigateTo('/login')` |
     * | Session expired | `false` | `navigateTo('/login')` |
     *
     * ## ⚠️ Important
     *
     * After calling `setAuthenticated(true)`, always use `external: true`
     * when navigating to protected routes:
     *
     * ```typescript
     * setAuthenticated(true)
     * await navigateTo('/dashboard', { external: true })
     * ```
     *
     * This ensures a full browser redirect, so newly-set cookies are
     * included in the HTTP request to the protected route.
     *
     * @param {boolean} value - The new authentication state
     *
     * @example
     * ```typescript
     * // After successful login API call
     * const { setAuthenticated } = useAuth()
     *
     * try {
     *     await $fetch('/api/user/login', { method: 'POST', body: credentials })
     *     setAuthenticated(true)
     *     await navigateTo('/dashboard', { external: true })
     * } catch (error) {
     *     console.error('Login failed', error)
     * }
     * ```
     *
     * @example
     * ```typescript
     * // After logout
     * const { setAuthenticated } = useAuth()
     *
     * await $fetch('/api/user/logout', { method: 'POST' })
     * setAuthenticated(false)
     * await navigateTo('/login')
     * ```
     */
    const setAuthenticated = (value: boolean) => {
        isAuthenticated.value = value
    }

    return {
        isAuthenticated,
        checkAuth,
        setAuthenticated
    }
}

