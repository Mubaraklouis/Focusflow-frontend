import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/quiz-attempts/{id} → API GET /api/quiz-attempts/:id. One quiz attempt (poll until status is completed). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  return apiFetch(event, `/api/quiz-attempts/${id}`, { query: forwardQuery(event) })
})
