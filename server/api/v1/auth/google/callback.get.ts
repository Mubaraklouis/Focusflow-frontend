import { apiFetch, rememberUserId } from '~~/server/util/api'

/**
 * GET /api/v1/auth/google/callback (Google redirects here: this URL is the
 * GOOGLE_REDIRECT_URI). Passes code+state to the API, which signs the user in
 * and sets ff_session; then the browser goes to the dashboard.
 */
export default defineEventHandler(async (event) => {
  const { code, state, error } = getQuery(event)
  if (error) {
    return sendRedirect(event, `/login?error=${encodeURIComponent('Google sign-in was cancelled')}`)
  }
  try {
    const data = await apiFetch(event, '/api/v1/auth/google/callback', { query: { code, state } })
    rememberUserId(event, data)
    return sendRedirect(event, '/dashboard')
  } catch (err: any) {
    const message = err?.data?.message || err?.message || 'Google authentication failed'
    return sendRedirect(event, `/login?error=${encodeURIComponent(message)}`)
  }
})
