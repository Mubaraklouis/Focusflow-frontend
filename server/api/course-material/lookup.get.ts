import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/lookup → API GET /api/courses/lookup. Look up one YouTube video. */
export default defineEventHandler(async (event) => {
  return apiFetch(event, `/api/courses/lookup`, { query: forwardQuery(event) })
})
