import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/quiz/latest.get
 *
 * Returns the learner's most recent attempt for a lesson, with the six
 * answer line items eager-loaded. Used by the "view results" screen on
 * lessons the learner has already completed.
 *
 * Query: ?user_id=<int>
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');
  const { user_id: userId } = getQuery(event);

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'lesson id is required and must be numeric' });
  }
  if (!userId || isNaN(Number(userId))) {
    throw createError({ statusCode: 400, message: 'user_id query param is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const result = await $fetch<unknown>(`${base}/${id}/quiz/latest`, {
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
        'Failed to fetch latest attempt',
      data: error?.data,
    });
  }
});
