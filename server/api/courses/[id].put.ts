import { apiFetch } from '~~/server/util/api'

/** PUT /api/courses/:id (multipart) → API PUT /api/course/:id (owner only). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const form = await readFormData(event)
  return apiFetch(event, `/api/course/${id}`, { method: 'PUT', body: form })
})
