import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/course/[courseId].get
 * Returns all course materials (lessons) for a given course.
 *
 * Proxies to the Course Material Service:
 *   GET ${courseMaterialUrl}/../course-materials/course/:courseId
 *
 * (`courseMaterialUrl` points at `.../api/courses`, so we rewrite the
 * trailing segment to `/api/course-materials`.)
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const courseId = getRouterParam(event, 'courseId');

  if (!courseId) {
    throw createError({ statusCode: 400, message: 'courseId is required' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    return await $fetch<unknown>(`${base}/course/${courseId}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      message:
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to fetch course materials',
      data: error?.data,
    });
  }
});
