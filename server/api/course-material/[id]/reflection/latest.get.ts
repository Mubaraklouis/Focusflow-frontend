import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/reflection/latest.get
 * Proxies the latest Feynman reflection for a lesson/user pair.
 *
 * Query: `?user_id=<int>`
 * Backend: GET /api/course-materials/:id/reflection/latest?user_id=<int>
 *
 * Returns `{ data: Reflection | null }`.
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
    const result = await $fetch<{ data: unknown }>(
      `${base}/${id}/reflection/latest`,
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
        'Failed to fetch latest reflection',
      data: err?.data,
    });
  }
});
