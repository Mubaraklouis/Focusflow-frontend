import { SESSION_COOKIE } from '~~/server/util/api'

/** The CSV quiz template as a download (text, so not the JSON catch-all). */
export default defineEventHandler(async (event) => {
  const { apiUrl } = useRuntimeConfig(event)
  const session = getCookie(event, SESSION_COOKIE)
  const res = await fetch(`${apiUrl}/api/learn/quiz-template.csv`, { headers: session ? { Cookie: `${SESSION_COOKIE}=${session}` } : {} })
  if (!res.ok) throw createError({ statusCode: res.status, message: 'Template not available' })
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="focusflow-quiz-template.csv"')
  return await res.text()
})
