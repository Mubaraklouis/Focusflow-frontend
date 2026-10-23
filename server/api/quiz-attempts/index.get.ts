import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/quiz-attempts → API GET /api/quiz-attempts. The signed-in user's quiz history (limit, offset). */
export default defineEventHandler(async (event) => {
  return apiFetch(event, `/api/quiz-attempts`, { query: forwardQuery(event) })
})
