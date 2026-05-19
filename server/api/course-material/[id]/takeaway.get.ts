import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/takeaway.get
 * Proxies a takeaway read to the Course Material Service.
 *
 * Query: `?user_id=<int>`
 * Backend path: `GET /api/course-materials/:id/takeaway?user_id=<int>`
 *
 * Returns `{ data: Takeaway | null }`.
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');
  const { user_id: userId } = getQuery(event);

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'lesson id (video_id) is required and must be numeric',
    });
  }
  if (!userId || isNaN(Number(userId))) {
    throw createError({
      statusCode: 400,
      message: 'user_id is required and must be numeric',
    });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const result = await $fetch<{ data: unknown }>(`${base}/${id}/takeaway`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      params: { user_id: Number(userId) },
    });
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message:
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to fetch takeaway',
      data: error?.data,
    });
  }
});
