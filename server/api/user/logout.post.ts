import { apiFetch, clearAuthCookies } from '~~/server/util/api'

/** POST /api/user/logout → API POST /logout, then clears the cookies here too. */
export default defineEventHandler(async (event) => {
  try {
    await apiFetch(event, '/logout', { method: 'POST' })
  } catch {
    // Already signed out on the API side: still clear the browser cookies
  }
  clearAuthCookies(event)
  return { success: true, message: 'Logged out successfully' }
})
