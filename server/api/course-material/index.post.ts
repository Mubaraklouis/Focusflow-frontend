import { apiFetch, forwardQuery } from '~~/server/util/api'

/** POST /api/course-material → API POST /api/course-materials. Create lessons (array). Course owner or admin only. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => undefined)
  return apiFetch(event, `/api/course-materials`, { method: 'POST', body, query: forwardQuery(event) })
})
