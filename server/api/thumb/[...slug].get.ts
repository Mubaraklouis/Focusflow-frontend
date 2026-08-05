import useConfig from '~~/server/util/useConfig'

/**
 * # 🖼️ Thumbnail HTTPS proxy
 *
 * Streams MinIO objects over HTTPS through the frontend origin. Browsers block
 * `http://` images on an HTTPS page (mixed content), so course thumbnails
 * stored in MinIO are rewritten client-side to `/api/thumb/<bucket>/<key>`
 * and served from here with HTTPS + long-lived cache headers.
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

    setResponseHeaders(event, {
        'Content-Type': resp.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
    })

    return resp.body
})
