import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/{id}/takeaway → API GET /api/course-materials/:id/takeaway. The signed-in user's takeaway for this lesson. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  return apiFetch(event, `/api/course-materials/${id}/takeaway`, { query: forwardQuery(event) })
})
