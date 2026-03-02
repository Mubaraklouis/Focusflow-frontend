/**
 * @module interfaces/search-course-material
 * Shared types for the YouTube course material search feature.
 */

/**
 * A single YouTube search result returned by the API.
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
 * State shape for the search course material composable.
 */
export interface SearchCourseMaterialState {
  query: string;
  results: YouTubeSearchResult[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}
