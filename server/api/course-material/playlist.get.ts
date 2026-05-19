import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/playlist.get
 * Proxies a YouTube playlist expansion request to the Course Material Service.
 * Returns up to `max_results` videos from the playlist (clamped to 50 server-side).
 *
 * Query params:
 *   - playlist_id: YouTube playlist ID (the value of `list=` in a playlist URL)
 *   - max_results: optional, default 25
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const { playlist_id: playlistId, max_results: maxResults } = getQuery(event);

  if (!playlistId || typeof playlistId !== 'string' || !playlistId.trim()) {
    throw createError({ statusCode: 400, message: 'playlist_id is required' });
  }

  try {
    const response = await $fetch<unknown>(`${courseMaterialUrl}/playlist`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      params: {
        playlist_id: playlistId.trim(),
        max_results: maxResults ? Number(maxResults) : 25,
      },
    });
    return response;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      message: error?.data?.error || error?.message || 'Failed to expand playlist',
      data: error?.data,
    });
  }
});
