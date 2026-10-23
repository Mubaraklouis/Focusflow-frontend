import { apiFetch, USER_ID_COOKIE } from '~~/server/util/api'

/**
 * PUT /api/user/password → API PUT /api/user/:id/password.
 * The API always changes the signed-in user's password; :id is informational.
 */
export default defineEventHandler(async (event) => {
  const { current_password, password, password_confirmation } = await readBody(event)
  const userId = getCookie(event, USER_ID_COOKIE) || 'me'
  return apiFetch(event, `/api/user/${userId}/password`, {
    method: 'PUT',
    body: { current_password, password, password_confirmation },
  })
})
