import { apiFetch, forwardQuery } from '~~/server/util/api'

/** POST /api/course-material/{id}/quiz/prepare → API POST /api/course-materials/:id/quiz/prepare. Warm the transcript and quiz in the background. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  const body = await readBody(event).catch(() => undefined)
  return apiFetch(event, `/api/course-materials/${id}/quiz/prepare`, { method: 'POST', body, query: forwardQuery(event) })
})
