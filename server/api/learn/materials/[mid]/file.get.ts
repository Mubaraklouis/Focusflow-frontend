import { SESSION_COOKIE } from '~~/server/util/api'

/** A course PDF for pdf.js (F3.2): binary, so not the JSON catch-all. */
export default defineEventHandler(async (event) => {
  const { apiUrl } = useRuntimeConfig(event)
  const mid = Number(getRouterParam(event, 'mid'))
  const session = getCookie(event, SESSION_COOKIE)
  const res = await fetch(`${apiUrl}/api/learn/materials/${mid}/file`, {
    headers: session ? { Cookie: `${SESSION_COOKIE}=${session}` } : {},
  })
  if (!res.ok) throw createError({ statusCode: res.status, message: 'File not found' })
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  return new Uint8Array(await res.arrayBuffer())
})
