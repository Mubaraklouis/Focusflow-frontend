import type { H3Event } from 'h3'

/** Cookie set by the FocusFlow API on login/register (httpOnly, 30 days). */
export const SESSION_COOKIE = 'ff_session'

/** Non-httpOnly cookie the pages read to know the current user's id. */
export const USER_ID_COOKIE = 'focusflow-user-id'

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  query?: Record<string, any>
  headers?: Record<string, string>
}

/**
 * Calls the FocusFlow API (runtimeConfig.apiUrl) on behalf of the browser.
 *
 * - Sends only the browser's `ff_session` cookie (never other site cookies).
 * - Copies any Set-Cookie from the API back to the browser, so login and
 *   logout update the session cookie on the Vercel domain.
 * - On an API error, throws an H3 error with the same status, the API's
 *   message, and the API body as `data` (Laravel-style `errors` included).
 */
export async function apiFetch<T = any>(event: H3Event, path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { apiUrl } = useRuntimeConfig(event)
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers }
  const session = getCookie(event, SESSION_COOKIE)
  if (session) headers.Cookie = `${SESSION_COOKIE}=${session}`

  try {
    const res = await $fetch.raw<T>(path, {
      baseURL: apiUrl as string,
      method: opts.method ?? 'GET',
      body: opts.body,
      query: opts.query,
      headers,
      redirect: 'manual',
    })
    forwardSetCookies(event, res.headers)
    return res._data as T
  } catch (error: any) {
    if (error?.response?.headers) forwardSetCookies(event, error.response.headers)
    const status: number = error?.response?.status || 502
    const data = error?.data
    throw createError({
      statusCode: status,
      message: data?.message || data?.error || (status === 502 ? 'FocusFlow API is unreachable' : error?.message) || 'Request failed',
      data,
    })
  }
}

/** Query params from the browser, minus user_id (the API uses the session). */
export function forwardQuery(event: H3Event): Record<string, any> {
  const { user_id: _ignored, ...rest } = getQuery(event)
  return rest
}

/** Remembers the user id for the pages after login/register/Google. */
export function rememberUserId(event: H3Event, data: any) {
  const id = data?.user_id ?? data?.user?.id
  if (!id) return
  setCookie(event, USER_ID_COOKIE, String(id), {
    path: '/',
    httpOnly: false,
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
}

/** Clears the session and helper cookies (logout, or a dead session). */
export function clearAuthCookies(event: H3Event) {
  for (const name of [SESSION_COOKIE, USER_ID_COOKIE]) {
    deleteCookie(event, name, { path: '/' })
  }
}

function forwardSetCookies(event: H3Event, headers: Headers) {
  for (const cookie of headers.getSetCookie?.() ?? []) {
    appendResponseHeader(event, 'Set-Cookie', cookie)
  }
}
