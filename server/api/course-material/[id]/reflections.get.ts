import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/reflections.get
 * Proxies the full reflection history for a lesson/user pair.
 *
 * Query: `?user_id=<int>`
 * Backend: GET /api/course-materials/:id/reflections?user_id=<int>
 *
 * Returns `{ count: number, data: Reflection[] }` ordered by created_at ASC.
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
    throw createError({ statusCode: 400, message: 'user_id is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const result = await $fetch<{ count: number; data: unknown[] }>(
      `${base}/${id}/reflections`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        params: { user_id: Number(userId) },
      },
    );
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err?.response?.status || err?.statusCode || 500,
      message:
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Failed to fetch reflections',
      data: err?.data,
    });
  }
});
