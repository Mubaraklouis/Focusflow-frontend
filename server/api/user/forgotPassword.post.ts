import { apiFetch } from '~~/server/util/api'

/** POST /api/user/forgotPassword → API POST /forgot-password (emails a reset link). */
export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)
  return apiFetch(event, '/forgot-password', { method: 'POST', body: { email } })
})
