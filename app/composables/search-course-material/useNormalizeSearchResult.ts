import type {
  YouTubeSearchResultRaw,
  YouTubeSearchResult,
} from '~/interfaces/search-course-material';

/**
 * @module composables/search-course-material/useNormalizeSearchResult
 * Converts raw backend YouTube search results into the UI-friendly shape.
 */

/**
 * Normalizes a single raw YouTube search result from the backend into
 * the camelCase shape consumed by components.
 *
 * @param raw - A single raw result from the API.
 * @returns Normalized result for the UI.
 */
export const normalizeSearchResult = (raw: YouTubeSearchResultRaw): YouTubeSearchResult => ({
  videoId: raw.youtube_id ?? '',
  title: raw.title ?? 'Untitled Video',
  description: raw.description ?? '',
  thumbnail: raw.thumbnail_url ?? '',
  channelTitle: raw.channel_name ?? 'Unknown Channel',
  publishedAt: raw.published_at ?? '',
});

/**
 * Normalizes an array of raw search results.
 *
 * @param rawResults - Array of raw results from the backend.
 * @returns Array of normalized results for the UI.
 */
export const normalizeSearchResults = (rawResults: YouTubeSearchResultRaw[]): YouTubeSearchResult[] =>
  rawResults.map(normalizeSearchResult);
