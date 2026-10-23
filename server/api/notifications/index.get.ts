import { apiFetch } from '~~/server/util/api'

/** GET /api/notifications → API GET /api/notifications (pending invitations). */
export default defineEventHandler((event) => apiFetch(event, '/api/notifications'))
