import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/[id]/quiz/attempts.post
 *
 * Submit a full quiz attempt. The backend grades the 3 MCQs deterministically,
 * passes each writing answer to Gemini for rubric-based scoring, upserts the
 * US-001 takeaway, persists the QuizAttempt + 6 QuizAnswer rows, and flips
 * the lesson's completed flag — all atomically.
 *
 * Body shape:
 *   { user_id: number, answers: [{question_id, answer}] × 6, takeaway: string }
 *
 * Response shape:
 *   { message, data: QuizAttempt with .answers populated }
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'lesson id is required and must be numeric' });
  }

  const body = await readBody<unknown>(event);
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'request body is required' });
  }

  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  try {
    const result = await $fetch<unknown>(`${base}/${id}/quiz/attempts`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body,
      // Grading three writing answers serially against Gemini can take a
      // few seconds each; give Nitro headroom.
      timeout: 120_000,
    });
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message:
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to submit quiz attempt',
      data: error?.data,
    });
  }
});
