import { apiFetch } from '~~/server/util/api'

/** GET /api/courses → API GET /api/course (all courses; pages filter by owner). */
export default defineEventHandler((event) => apiFetch(event, '/api/course'))
