import { apiFetch, rememberUserId } from '~~/server/util/api'

/** Where the session must end up: the domain the app is published on. */
const CANONICAL_CALLBACK = 'https://www.focus-flow.studio/api/v1/auth/google/callback'

/** Hosts that must not finish the OAuth flow (the API still points its
 *  GOOGLE_REDIRECT_URI here). State is signed, so handing code+state to the
 *  canonical host is safe and sets ff_session on the right domain. */
const LEGACY_HOSTS = new Set(['focusfllow.vercel.app', 'focus-flow.vercel.app'])

/**
 * GET /api/v1/auth/google/callback (Google redirects here: this URL is the
 * GOOGLE_REDIRECT_URI). Passes code+state to the API, which signs the user in
 * and sets ff_session; then the browser goes to the dashboard.
 */
export default defineEventHandler(async (event) => {
  const host = (getRequestHeader(event, 'host') || '').split(':')[0].toLowerCase()
  if (LEGACY_HOSTS.has(host)) {
    const query = getQuery(event)
    const target = new URL(CANONICAL_CALLBACK)
    for (const key of ['code', 'state', 'error']) {
      if (typeof query[key] === 'string') target.searchParams.set(key, query[key] as string)
    }
    return sendRedirect(event, target.toString(), 302)
  }

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
