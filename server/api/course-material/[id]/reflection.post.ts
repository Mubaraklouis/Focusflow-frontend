import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/reflection.post
 * Proxies a Feynman reflection submission to the Course Material Service.
 *
 * Body: `{ user_id: number, body: string }`
 * Backend: POST /api/course-materials/:id/reflection
 *
 * Returns 201 with the full Reflection object on success.
 * Propagates 422, 404, and 503 verbatim so the composable can handle them.
 *
 * NOTE: The AI ingests the lesson video — this can take up to 120 seconds.
 * No timeout is set on purpose; the fetch runs as long as needed.
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'lesson id (video_id) is required and must be numeric',
    });
  }

  const body = await readBody<{ user_id?: number; body?: string }>(event);
  if (!body?.user_id || !body?.body) {
    throw createError({ statusCode: 400, message: 'user_id and body are required' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const response = await $fetch(`${base}/${id}/reflection`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: { user_id: body.user_id, body: body.body },
      // No timeout — let it run. The AI analysis can take 2 minutes.
    });
    return response;
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500;
    throw createError({
      statusCode: status,
      message:
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Failed to submit reflection',
      data: err?.data,
    });
  }
});
