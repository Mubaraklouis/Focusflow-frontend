/**
 * Rewrites MinIO thumbnail URLs to the HTTPS /api/thumb proxy.
 *
 * The frontend is served over HTTPS but MinIO is plain HTTP, and browsers
 * block `http://` images on HTTPS pages (mixed content). Any thumbnail URL
 * pointing at the storage base is rewritten to `/api/thumb/<bucket>/<key>`,
 * which streams the object over HTTPS. Non-storage URLs (e.g. YouTube
 * thumbnails) pass through untouched.
 *
 * NOTE: this rewrite is opt-in — any composable/page that renders course
 * thumbnails must run its URLs through toProxiedThumb (or fetch via a
 * composable that already does), otherwise raw http:// MinIO URLs will be
 * rendered and blocked by the browser as mixed content.
 */
export const toProxiedThumb = (url?: string | null): string => {
    if (!url) return ''

    const config = useRuntimeConfig()
    const storageBase = (config.public.storageBaseUrl as string) || 'http://129.121.85.106:9000'
    const prefix = `${storageBase}/`

    if (url.startsWith(prefix)) {
        return `/api/thumb/${url.slice(prefix.length)}`
    }
    return url
}
