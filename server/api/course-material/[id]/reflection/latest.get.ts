import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/{id}/reflection/latest → API GET /api/course-materials/:id/reflection/latest. The signed-in user's latest reflection. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  return apiFetch(event, `/api/course-materials/${id}/reflection/latest`, { query: forwardQuery(event) })
})
