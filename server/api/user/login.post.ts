import { apiFetch, rememberUserId } from '~~/server/util/api'

/** POST /api/user/login → API POST /login (sets the ff_session cookie). */
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  const data = await apiFetch(event, '/login', { method: 'POST', body: { email, password } })
  rememberUserId(event, data)
  return data
})
