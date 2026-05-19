import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/quiz/status.get
 *
 * Cheap poll: returns `{ ready, generating, error }`. Never calls Gemini.
 * Used by the frontend to gate the Mark-as-complete button while
 * background generation is in flight.
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'lesson id is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    return await $fetch<unknown>(`${base}/${id}/quiz/status`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message: error?.data?.error || error?.message || 'Failed to fetch quiz status',
      data: error?.data,
    });
  }
});
