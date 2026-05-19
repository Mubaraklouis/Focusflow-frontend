import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/takeaway.post
 * Proxies the US-001 active-recall submission to the Course Material Service.
 *
 * Request body: `{ user_id: number, body: string }`
 * Backend path: `POST /api/course-materials/:id/takeaway`
 *
 * Returns the backend response verbatim. Validation errors (422) are
 * propagated so the dialog can keep the modal open and show the message.
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
    throw createError({
      statusCode: 400,
      message: 'user_id and body are required',
    });
  }

  // courseMaterialUrl points at `.../api/courses` for the YouTube search base.
  // The takeaway endpoints live under `.../api/course-materials`, so swap the suffix.
  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const response = await $fetch(`${base}/${id}/takeaway`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: { user_id: body.user_id, body: body.body },
    });
    return response;
  } catch (error: any) {
    const status = error?.response?.status || error?.statusCode || 500;
    throw createError({
      statusCode: status,
      message:
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to submit takeaway',
      data: error?.data,
    });
  }
});
