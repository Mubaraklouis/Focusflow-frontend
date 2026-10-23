import { apiFetch } from '~~/server/util/api'

/** GET /api/courses/enrollments → API GET /api/enrollments (signed-in user). */
export default defineEventHandler((event) => apiFetch(event, '/api/enrollments'))
