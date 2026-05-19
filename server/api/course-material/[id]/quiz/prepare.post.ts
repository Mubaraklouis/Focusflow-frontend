import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/quiz/prepare.post
 *
 * Fire-and-forget: tell the Course Material Service to start generating
 * questions in a background goroutine if it hasn't already. Returns
 * `{ ready, generating }` so the caller knows whether a poll is needed.
 *
 * The frontend calls this when the learner selects a lesson in the player.
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'lesson id is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    return await $fetch<unknown>(`${base}/${id}/quiz/prepare`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message: error?.data?.error || error?.message || 'Failed to prepare quiz',
      data: error?.data,
    });
  }
});
