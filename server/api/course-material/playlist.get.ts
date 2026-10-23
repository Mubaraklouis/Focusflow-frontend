import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/playlist → API GET /api/courses/playlist. List a YouTube playlist. */
export default defineEventHandler(async (event) => {
  return apiFetch(event, `/api/courses/playlist`, { query: forwardQuery(event) })
})
