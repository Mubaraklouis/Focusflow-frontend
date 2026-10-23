import { apiFetch, forwardQuery } from '~~/server/util/api'

/** POST /api/course-material/{id}/quiz/attempts → API POST /api/course-materials/:id/quiz/attempts. Submit quiz answers (graded async; poll the attempt). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  const body = await readBody(event).catch(() => undefined)
  return apiFetch(event, `/api/course-materials/${id}/quiz/attempts`, { method: 'POST', body, query: forwardQuery(event) })
})
