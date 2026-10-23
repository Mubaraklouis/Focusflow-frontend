import { apiFetch } from '~~/server/util/api'

/** POST /api/courses (multipart, optional thumbnail) → API POST /api/course. */
export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  return apiFetch(event, '/api/course', { method: 'POST', body: form })
})
