/** Where to go after login/register: ?next= when it is a path on this site. */
export function nextPath(fallback = '/dashboard'): string {
  if (!import.meta.client) return fallback
  const next = new URLSearchParams(window.location.search).get('next') || ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback
}
