import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/quiz/regenerate.post
 *
 * Triggers generation of a new quiz set covering the next ~25-minute
 * window of the source video. Each call produces set_number = N+1. The
 * learner uses this when the first quiz only covered the opening segment
 * of a long lesson, or when they want fresh questions on the same
 * content for varied practice.
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'lesson id is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    return await $fetch<unknown>(`${base}/${id}/quiz/regenerate`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      timeout: 130_000,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message: error?.data?.error || error?.message || 'Failed to regenerate quiz',
      data: error?.data,
    });
  }
});
