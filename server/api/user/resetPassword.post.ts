import { apiFetch } from '~~/server/util/api'

/** POST /api/user/resetPassword → API POST /reset-password. */
export default defineEventHandler(async (event) => {
  const { token, email, password, password_confirmation } = await readBody(event)
  return apiFetch(event, '/reset-password', {
    method: 'POST',
    body: { token, email, password, password_confirmation },
  })
})
