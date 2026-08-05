import useConfig from '~~/server/util/useConfig'

/**
 * # 🖼️ Avatar HTTPS proxy
 *
 * Streams user avatar images (stored by the auth service under /storage/...)
 * over HTTPS through the frontend origin. Browsers block `http://` images on
 * an HTTPS page (mixed content), so avatar URLs are rewritten client-side to
 * `/api/avatar/<path>` and served from here with HTTPS + cache headers.
 *
 * The auth service's /storage/... files are already publicly served; this
 * proxy only changes the transport scheme.
 */
export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug') || ''

    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Missing object path' })
    }

    const { baseUrl } = useConfig()
    if (!baseUrl) {
        throw createError({ statusCode: 500, statusMessage: 'Auth service URL not configured' })
    }

    // The catch-all slug arrives still percent-encoded (h3 does not decode it),
    // so appending it to the fixed auth-service base preserves the path as-is
    // and keeps the proxy host-bound (no SSRF to other hosts).
    let upstream: string
    try {
        upstream = new URL(slug, `${baseUrl}/`).toString()
    } catch {
        throw createError({ statusCode: 400, statusMessage: 'Invalid object path' })
    }

    let resp: Response
    try {
        resp = await fetch(upstream)
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'Storage upstream unreachable' })
    }

    if (!resp.ok) {
        throw createError({ statusCode: resp.status, statusMessage: resp.statusText || 'Not found' })
    }

    const headers: Record<string, string> = {
        'Content-Type': resp.headers.get('content-type') || 'application/octet-stream',
        // 1-day cache with background revalidation: fast repeat loads, but a
        // new avatar under the same path won't stay stale forever.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    }
    const contentLength = resp.headers.get('content-length')
    if (contentLength) {
        headers['Content-Length'] = contentLength
    }

    setResponseHeaders(event, headers)

    return resp.body
})
