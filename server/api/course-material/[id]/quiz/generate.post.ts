import { apiFetch, forwardQuery } from '~~/server/util/api'

/** POST /api/course-material/{id}/quiz/generate → API POST /api/course-materials/:id/quiz/generate. Generate the lesson quiz (Gemini). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  const body = await readBody(event).catch(() => undefined)
  return apiFetch(event, `/api/course-materials/${id}/quiz/generate`, { method: 'POST', body, query: forwardQuery(event) })
})
