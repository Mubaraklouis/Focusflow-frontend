import { useAuth } from '~/composables/Auth/useAuth'

/**
 * # Guest Route Middleware
 *
 * A Nuxt route middleware that protects guest-only pages (login, register).
 * Redirects authenticated users to the dashboard.
 *
 * ## 🔐 Purpose
 *
 * Prevents already logged-in users from accessing authentication pages like:
 * - `/login`
 * - `/register`
 * - `/forgot-password`
 *
 * ## 📋 Execution Flow
 *
 * ### Server-Side Rendering (SSR)
 * 1. Middleware intercepts navigation to guest route
 * 2. Calls `checkAuth()` which reads `focusflow-session` and `XSRF-TOKEN` cookies
 * 3. If authenticated, redirects to `/dashboard`
 * 4. If not authenticated, allows access to the guest page
 *
 * ### Client-Side Navigation (SPA)
 * 1. Middleware intercepts navigation to guest route
 * 2. Trusts the already-hydrated `isAuthenticated` state from SSR
 * 3. If authenticated, redirects to `/dashboard`
 * 4. If not authenticated, allows access to the guest page
 *
 * ## 🔧 Usage
 *
 * Apply to guest-only pages using `definePageMeta`:
 * ```typescript
 * // pages/login.vue
 * definePageMeta({
 *     middleware: 'guest'
 * })
 * ```
 *
 * @param to - The target route being navigated to
 * @param from - The current route being navigated away from
 * @returns `undefined` to allow navigation, or `navigateTo('/dashboard')` to redirect
 */
export default defineNuxtRouteMiddleware((to, from) => {
    const { isAuthenticated, checkAuth } = useAuth()

    // On client-side, trust the already-set state from server-side check
    if (import.meta.client) {
        console.log(`[guest middleware] [CLIENT] Route: ${to.path}, isAuthenticated: ${isAuthenticated.value}`)
        if (isAuthenticated.value) {
            console.log(`[guest middleware] [CLIENT] User already authenticated, redirecting to /dashboard`)
            return navigateTo('/dashboard')
        }
        return
    }

    // On server-side, check cookies
    console.log(`[guest middleware] [SERVER] Checking auth for guest route: ${to.path}`)
    const isAuth = checkAuth()

    if (isAuth) {
        console.log(`[guest middleware] [SERVER] User already authenticated, redirecting to /dashboard`)
        return navigateTo('/dashboard')
    }

    console.log(`[guest middleware] [SERVER] User not authenticated, allowing access to ${to.path}`)
    return
})
