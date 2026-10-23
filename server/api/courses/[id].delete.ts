import { apiFetch } from '~~/server/util/api'

/** DELETE /api/courses/:id → API DELETE /api/course/:id (owner only). */
export default defineEventHandler((event) =>
  apiFetch(event, `/api/course/${getRouterParam(event, 'id')}`, { method: 'DELETE' }))
