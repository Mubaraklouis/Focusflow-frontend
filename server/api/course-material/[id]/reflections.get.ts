import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/{id}/reflections → API GET /api/course-materials/:id/reflections. The signed-in user's reflection history. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  return apiFetch(event, `/api/course-materials/${id}/reflections`, { query: forwardQuery(event) })
})
