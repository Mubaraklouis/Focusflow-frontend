import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/quiz-attempts/index.get
 *
 * Paginated history feed. Returns the learner's quiz attempts, newest
 * first, with lesson title + course id eager-resolved.
 *
 * Query: ?user_id=<int>&limit=<int=25>&offset=<int=0>
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const { user_id: userId, limit, offset } = getQuery(event);

  if (!userId || isNaN(Number(userId))) {
    throw createError({ statusCode: 400, message: 'user_id is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/quiz-attempts');

  try {
    return await $fetch<unknown>(base, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      params: {
        user_id: Number(userId),
        limit: limit ? Number(limit) : 25,
        offset: offset ? Number(offset) : 0,
      },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message: error?.data?.error || error?.message || 'Failed to list attempts',
      data: error?.data,
    });
  }
});
