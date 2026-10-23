import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/search → API GET /api/courses/search. Search YouTube. */
export default defineEventHandler(async (event) => {
  return apiFetch(event, `/api/courses/search`, { query: forwardQuery(event) })
})
