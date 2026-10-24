import { apiFetch } from '~~/server/util/api'

/**
 * /api/learn/** → API /api/learn/** (course builder and learner flow).
 * JSON only: files go straight from the browser to the API with a signed
 * token (see useLearn().uploadFile), because Vercel caps request bodies.
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  if (path.startsWith('upload')) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }
  const method = event.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(event).catch(() => undefined) : undefined
  return apiFetch(event, `/api/learn/${path}`, { method, body, query: getQuery(event) })
})
