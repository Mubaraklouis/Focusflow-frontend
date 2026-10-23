import { apiFetch } from '~~/server/util/api'

/** POST /api/invitations/:id/respond {action} → API POST /api/invitations/:id/respond. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return apiFetch(event, `/api/invitations/${getRouterParam(event, 'id')}/respond`, { method: 'POST', body })
})
