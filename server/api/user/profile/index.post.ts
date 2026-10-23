import { apiFetch } from '~~/server/util/api'

/** POST /api/user/profile (multipart "avatar") → API POST /api/user/:id/avatar. */
export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'avatar' && p.filename)
  if (!file) {
    throw createError({ statusCode: 422, message: 'The avatar field is required.', data: { errors: { avatar: ['The avatar field is required.'] } } })
  }
  const form = new FormData()
  form.append('avatar', new Blob([file.data], { type: file.type || 'application/octet-stream' }), file.filename)
  const me = await apiFetch<{ data: { id: number } }>(event, '/api/user')
  return apiFetch(event, `/api/user/${me.data.id}/avatar`, { method: 'POST', body: form })
})
