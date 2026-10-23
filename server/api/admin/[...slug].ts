import { apiFetch } from '~~/server/util/api'

/** /api/admin/** → API /api/admin/** (admin role checked by the API). */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'slug') || ''
  const method = event.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(event) : undefined
  return apiFetch(event, `/api/admin/${path}`, { method, body, query: getQuery(event) })
})
