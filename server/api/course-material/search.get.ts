import useConfig from '~~/server/util/useConfig';

/**
 * YouTube search result returned by the course-material search API.
 */
interface YouTubeVideoResult {
  channel_name: string;
  description: string;
  published_at: string;
  thumbnail_url: string;
  title: string;
  youtube_id: string;
}

/**
 * Response shape from the backend search endpoint.
 */
interface SearchResponse {
  message: string;
  query: string;
  results: YouTubeVideoResult[];
  total_count: number;
}

/**
 * # 🔍 Search YouTube Videos API Handler
 *
 * Proxies YouTube video search requests to the backend course-material service.
 * Accepts a `query` keyword and an optional `max_results` limit.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Code Logic |
 * | :--- | :--- | :--- |
 * | **1** | **Validate Query** | Reads `query` from query-string; returns 400 if missing. |
 * | **2** | **Proxy Search** | GET request to `${courseMaterialUrl}/search` with `query` and `max_results` params. |
 * | **3** | **Return Data** | Returns the search response directly to the client. |
 *
 * ## 🚀 Frontend Usage Example
 * ```typescript
 * const data = await $fetch('/api/course-material/search', {
 *   params: { query: 'system design', max_results: 10 },
 * })
 * ```
 *
 * @param event - The H3 event object (Nuxt Server Context).
 * @returns {Promise<SearchResponse>} YouTube search results from the backend.
 * @throws {H3Error} **400** - Triggered if the `query` parameter is missing.
 * @throws {H3Error} **500** - Triggered if the backend is unreachable or returns an error.
 */
export default defineEventHandler(async (event): Promise<SearchResponse> => {
  const { courseMaterialUrl } = useConfig();
  const queryParams = getQuery(event);

  const query = queryParams.query as string | undefined;
  const maxResults = queryParams.max_results as string | undefined;

  if (!query?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Search query is required',
    });
  }

  try {
    const response = await $fetch<SearchResponse>(`${courseMaterialUrl}/search`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      params: {
        query: query.trim(),
        max_results: maxResults ? Number(maxResults) : 10,
      },
    });

    return response;
  } catch (error: any) {
    console.error('[course-material/search.get.ts] YouTube search failed:', error);

    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || error.message || 'Failed to search YouTube videos',
      data: error.data,
    });
  }
});
