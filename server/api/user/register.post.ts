import { apiFetch, rememberUserId } from '~~/server/util/api'

/** POST /api/user/register → API POST /register (signs the new user in). */
export default defineEventHandler(async (event) => {
  const { name, email, password, password_confirmation } = await readBody(event)
  const data = await apiFetch(event, '/register', {
    method: 'POST',
    body: { name, email, password, password_confirmation },
  })
  rememberUserId(event, data)
  return data
})
