/**
 * @module composables/search-course-material/useYouTubeUrl
 * Pure helpers that extract YouTube IDs from arbitrary user-pasted URLs.
 *
 * Supports the formats:
 *   - https://www.youtube.com/watch?v=<id>
 *   - https://www.youtube.com/watch?v=<id>&list=<playlistId>
 *   - https://youtu.be/<id>
 *   - https://www.youtube.com/embed/<id>
 *   - https://www.youtube.com/playlist?list=<playlistId>
 *
 * No external dependencies. No reactive state.
 */

/**
 * Extract a YouTube video ID from a URL string, or return null if none
 * is present / the URL is malformed.
 */
export const extractVideoId = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();

  // youtu.be short links
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1] ?? null;

  // Embed links
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (embedMatch) return embedMatch[1] ?? null;

  // Standard watch?v=... — accept query params in any order
  try {
    const url = new URL(trimmed);
    const v = url.searchParams.get('v');
    if (v) return v;
  } catch {
    // Not a URL at all — treat as a bare ID below.
  }

  // Bare 11-character ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
};

/**
 * Extract a YouTube playlist ID from a URL string, or return null.
 */
export const extractPlaylistId = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();

  try {
    const url = new URL(trimmed);
    const list = url.searchParams.get('list');
    if (list) return list;
  } catch {
    // ignore — falls through to bare-ID detection
  }

  // Playlist IDs typically start with PL, UU, OL, LL, FL, RD, etc.
  if (/^(PL|UU|OL|LL|FL|RD)[A-Za-z0-9_-]{8,}$/.test(trimmed)) return trimmed;

  return null;
};
