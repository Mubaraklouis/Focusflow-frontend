/**
 * Image URL helpers for course thumbnails and avatars.
 *
 * The FocusFlow API stores uploads in its media bucket and returns absolute
 * HTTPS URLs (https://api.focusflow.sswoco.org/media/...), and Google avatars
 * are HTTPS too, so these pass URLs through. They remain the single place to
 * adjust image URLs; plain http:// URLs are dropped, because browsers block
 * them on the HTTPS site (mixed content).
 */
const safeImageUrl = (url?: string | null): string => {
  if (!url) return ''
  return url.startsWith('http://') ? '' : url
}

export const toProxiedThumb = safeImageUrl

export const toProxiedAvatar = safeImageUrl
