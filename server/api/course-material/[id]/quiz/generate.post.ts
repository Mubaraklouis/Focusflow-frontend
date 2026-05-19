import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/quiz/generate.post
 *
 * Idempotent question-generation. First call on a lesson costs ~6-15s of
 * Gemini latency. Subsequent calls return cached questions instantly.
 *
 * Backend: POST /api/course-materials/:id/quiz/generate
 * Response shape: { message, count, data: LessonQuestion[] } with
 * `correct_index` and `rubric` stripped.
 *
 * A 503 response means Gemini is unavailable on the backend; the caller
 * should fall back to the US-001 takeaway-only dialog.
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'lesson id is required and must be numeric' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const result = await $fetch<unknown>(`${base}/${id}/quiz/generate`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      // Generation timeout on Gemini's side is 90s; allow Nitro one more.
      timeout: 100_000,
    });
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message:
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to generate quiz',
      data: error?.data,
    });
  }
});
