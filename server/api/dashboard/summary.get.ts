import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/dashboard/summary → API GET /api/dashboard/summary. Dashboard summary for the signed-in user. */
export default defineEventHandler(async (event) => {
  return apiFetch(event, `/api/dashboard/summary`, { query: forwardQuery(event) })
})
