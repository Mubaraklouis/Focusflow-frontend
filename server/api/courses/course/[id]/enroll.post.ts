import { apiFetch } from '~~/server/util/api'

/** POST /api/courses/course/:id/enroll → API POST /api/course/:id/enroll. */
export default defineEventHandler((event) =>
  apiFetch(event, `/api/course/${getRouterParam(event, 'id')}/enroll`, { method: 'POST' }))
