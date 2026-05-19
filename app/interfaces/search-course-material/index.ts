/**
 * @module interfaces/search-course-material
 * Shared types for the YouTube course material search feature.
 */

/**
 * Raw YouTube search result as returned by the backend API.
 */
export interface YouTubeSearchResultRaw {
  channel_name: string;
  description: string;
  published_at: string;
  thumbnail_url: string;
  title: string;
  youtube_id: string;
}

/**
 * Normalized YouTube search result used by the UI.
 */
export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

/**
 * Response shape from the search API proxy.
 */
export interface YouTubeSearchResponse {
  message: string;
  query: string;
  results: YouTubeSearchResultRaw[];
  total_count: number;
}

/**
 * State shape for the search course material composable.
 */
export interface SearchCourseMaterialState {
  query: string;
  results: YouTubeSearchResult[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

/**
 * Which import method is currently active in the dialog.
 *   - `search`   : keyword search against the YouTube Data API
 *   - `playlist` : paste a YouTube playlist URL and expand it
 *   - `single`   : paste a single video URL
 */
export type CourseMaterialImportMode = 'search' | 'playlist' | 'single';
