import { apiFetch } from '~~/server/util/api'

/** POST /api/courses/course/:id/invite {email} → API POST /api/course/:id/invite-email. */
export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)
  return apiFetch(event, `/api/course/${getRouterParam(event, 'id')}/invite-email`, { method: 'POST', body: { email } })
})
