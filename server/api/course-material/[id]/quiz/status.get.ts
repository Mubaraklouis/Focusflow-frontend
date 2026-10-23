import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/{id}/quiz/status → API GET /api/course-materials/:id/quiz/status. Quiz preparation status for this lesson. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  return apiFetch(event, `/api/course-materials/${id}/quiz/status`, { query: forwardQuery(event) })
})
