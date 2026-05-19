import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/quiz-attempts/[id].get
 *
 * Returns one quiz attempt with all answer line items eager-loaded. The
 * results page polls this until `status` flips from `evaluating` to
 * `completed` (or `failed`).
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'attempt id is required and must be numeric' });
  }

  // courseMaterialUrl points at `.../api/courses` — swap to `.../api/quiz-attempts`.
  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/quiz-attempts');

  try {
    return await $fetch<unknown>(`${base}/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message: error?.data?.error || error?.message || 'Failed to fetch attempt',
      data: error?.data,
    });
  }
});
