import { apiFetch } from '~~/server/util/api'

/** DELETE /api/courses/course/:id/enroll → API DELETE /api/course/:id/enroll. */
export default defineEventHandler((event) =>
  apiFetch(event, `/api/course/${getRouterParam(event, 'id')}/enroll`, { method: 'DELETE' }))
