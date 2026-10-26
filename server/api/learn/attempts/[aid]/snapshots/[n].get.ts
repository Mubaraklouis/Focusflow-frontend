import { SESSION_COOKIE } from '~~/server/util/api'

/** One camera picture for the course creator (binary, so streamed as is). */
export default defineEventHandler(async (event) => {
  const { apiUrl } = useRuntimeConfig(event)
  const aid = Number(getRouterParam(event, 'aid'))
  const n = Number(getRouterParam(event, 'n'))
  const session = getCookie(event, SESSION_COOKIE)
  const res = await fetch(`${apiUrl}/api/learn/attempts/${aid}/snapshots/${n}`, {
    headers: session ? { Cookie: `${SESSION_COOKIE}=${session}` } : {},
  })
  if (!res.ok) throw createError({ statusCode: res.status, message: 'Picture not found' })
  setHeader(event, 'Content-Type', res.headers.get('content-type') || 'image/jpeg')
  setHeader(event, 'Cache-Control', 'private, max-age=300')
  return new Uint8Array(await res.arrayBuffer())
})
