import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/lookup.get
 * Single-video lookup via the YouTube Data API `videos` endpoint
 * (1 quota unit vs 100 for search). Used by the single-URL-paste flow.
 *
 * Query param:
 *   - youtube_id: YouTube video ID (the value of `v=` in a watch URL)
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const { youtube_id: youtubeId } = getQuery(event);

  if (!youtubeId || typeof youtubeId !== 'string' || !youtubeId.trim()) {
    throw createError({ statusCode: 400, message: 'youtube_id is required' });
  }

  try {
    const response = await $fetch<unknown>(`${courseMaterialUrl}/lookup`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      params: { youtube_id: youtubeId.trim() },
    });
    return response;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      message: error?.data?.error || error?.message || 'Failed to look up video',
      data: error?.data,
    });
  }
});
