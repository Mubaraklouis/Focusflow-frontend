import { apiFetch, clearAuthCookies } from '~~/server/util/api'

/** GET /api/user → API GET /api/user: the signed-in user, or 401. */
export default defineEventHandler(async (event) => {
  try {
    return await apiFetch(event, '/api/user')
  } catch (error: any) {
    if (error?.statusCode === 401) clearAuthCookies(event)
    throw error
  }
})
