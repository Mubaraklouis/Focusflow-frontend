import { useAuth } from '~/composables/Auth/useAuth'

/**
 * # Authentication Route Middleware
 *
 * A Nuxt route middleware that protects pages requiring authentication.
 * This middleware runs on both server-side (SSR) and client-side (SPA navigation)
 * with environment-specific authentication verification strategies.
 *
 * ## 🔐 Authentication Strategy
 *
 * | Environment | Strategy | Cookie Access | State Source |
 * | :---------- | :------- | :------------ | :----------- |
 * | **Server**  | Direct cookie verification | Full access (including httpOnly) | `useCookie()` API |
 * | **Client**  | Trust hydrated state | No httpOnly access | `useState()` reactive state |
 *
 * ## 📋 Execution Flow
 *
 * ### Server-Side Rendering (SSR)
 * 1. Middleware intercepts navigation to protected route
 * 2. Calls `checkAuth()` which reads `focusflow-session` and `XSRF-TOKEN` cookies
 * 3. Sets `isAuthenticated` state based on cookie presence
 * 4. Allows access if both tokens exist, otherwise redirects to `/login`
 * 5. State is hydrated to client for subsequent navigations
 *
 * ### Client-Side Navigation (SPA)
 * 1. Middleware intercepts navigation to protected route
 * 2. Trusts the already-hydrated `isAuthenticated` state from SSR
 * 3. Allows access if state is `true`, otherwise redirects to `/login`
 * 4. Does NOT re-check cookies (httpOnly cookies are inaccessible client-side)
 *
 * ## 🚨 Important: Post-Login Navigation
 *
 * After successful login/registration, you MUST use `external: true` option:
 * ```typescript
 * await navigateTo('/dashboard', { external: true })
 * ```
 *
 * This forces a full browser redirect, ensuring newly-set cookies are included
 * in the HTTP request. Without this, client-side navigation may occur before
 * cookies are available to the server middleware.
 *
 * ## 🔧 Usage
 *
 * Apply to individual pages using `definePageMeta`:
 * ```typescript
 * // pages/dashboard.vue
 * definePageMeta({
 *     middleware: 'auth'
 * })
 * ```
 *
 * ## 🔗 Dependencies
 *
 * - {@link useAuth} - Composable providing authentication state and verification
 * - `focusflow-session` cookie - Laravel Sanctum session identifier
 * - `XSRF-TOKEN` cookie - CSRF protection token
 *
 * @see {@link useAuth} for the authentication state management composable
 * @see {@link checkAuth} for the cookie verification implementation
 *
 * @param to - The target route being navigated to
 * @param from - The current route being navigated away from
 * @returns `undefined` to allow navigation, or `navigateTo('/login')` to redirect
 */
export default defineNuxtRouteMiddleware((to, from) => {
    const { isAuthenticated, checkAuth } = useAuth()

    // On client-side, trust the already-set state from server-side check
    // httpOnly cookies cannot be read on client-side
    if (import.meta.client) {
        console.log(`[auth middleware] [CLIENT] Route: ${to.path}, trusting isAuthenticated: ${isAuthenticated.value}`)
        if (isAuthenticated.value) {
            return
        }
        return navigateTo('/login')
    }

    // On server-side, check cookies (useCookie can read httpOnly cookies on server)
    console.log(`[auth middleware] [SERVER] Checking auth for route: ${to.path}`)
    const isAuth = checkAuth()

    if (isAuth) {
        console.log(`[auth middleware] [SERVER] Tokens found, allowing access to ${to.path}`)
        return
    }

    console.log(`[auth middleware] [SERVER] User not authenticated, redirecting to /login`)
    return navigateTo('/login')
})
