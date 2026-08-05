import useConfig from '~~/server/util/useConfig'

/**
 * # 🖼️ Thumbnail HTTPS proxy
 *
 * Streams MinIO objects over HTTPS through the frontend origin. Browsers block
 * `http://` images on an HTTPS page (mixed content), so course thumbnails
 * stored in MinIO are rewritten client-side to `/api/thumb/<bucket>/<key>`
 * and served from here with HTTPS + cache headers.
 *
 * The MinIO bucket is already publicly readable (anonymous download), so this
 * proxy adds no new exposure — it only changes the transport scheme.
 */
export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug') || ''

    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Missing object path' })
    }

    const { storageUrl } = useConfig()
    if (!storageUrl) {
        throw createError({ statusCode: 500, statusMessage: 'Storage URL not configured' })
    }

    // The catch-all slug arrives still percent-encoded (h3 does not decode it),
    // so appending it to the fixed storage base preserves the object key as-is:
    // spaces, parens, and even `#` / `?` inside filenames stay encoded and are
    // never mistaken for a fragment/query. Because the base is fixed and the
    // slug can only resolve within it, path traversal just yields a 404 and no
    // other host can be reached (no SSRF).
    let upstream: string
    try {
        upstream = new URL(slug, `${storageUrl}/`).toString()
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
        // thumbnail re-uploaded under the same key won't stay stale forever.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    }
    const contentLength = resp.headers.get('content-length')
    if (contentLength) {
        headers['Content-Length'] = contentLength
    }

    setResponseHeaders(event, headers)

    return resp.body
})
