import { apiFetch } from '~~/server/util/api'

/** POST /api/contact → API POST /contact (emails the home-page contact form to the team). */
export default defineEventHandler(async (event) => {
  const { name, email, company, phone, country, message, website } = await readBody(event)
  return apiFetch(event, '/contact', { method: 'POST', body: { name, email, company, phone, country, message, website } })
})
