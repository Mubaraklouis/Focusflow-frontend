import { apiFetch } from '~~/server/util/api'

/** Camera picture during a test (F2.7): multipart, so not the JSON catch-all. */
export default defineEventHandler(async (event) => {
  const aid = Number(getRouterParam(event, 'aid'))
  const form = await readFormData(event)
  return apiFetch(event, `/api/learn/attempts/${aid}/snapshots`, { method: 'POST', body: form })
})
