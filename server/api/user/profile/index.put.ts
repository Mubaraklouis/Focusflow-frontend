import { apiFetch } from '~~/server/util/api'

/** PUT /api/user/profile → API PUT /api/user/:id for the signed-in user. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const me = await apiFetch<{ data: { id: number } }>(event, '/api/user')
  const { name, username, bio, location, website } = body || {}
  return apiFetch(event, `/api/user/${me.data.id}`, {
    method: 'PUT',
    body: { name, username, bio, location, website },
  })
})
