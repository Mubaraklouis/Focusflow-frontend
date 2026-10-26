import { apiFetch } from '~~/server/util/api'

/** GET /api/certificates/:code → API (public check of a certificate, F2.6). */
export default defineEventHandler((event) =>
  apiFetch(event, `/api/certificates/${encodeURIComponent(getRouterParam(event, 'code') || '')}`))
