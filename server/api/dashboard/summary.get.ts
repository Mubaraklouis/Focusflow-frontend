import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/dashboard/summary.get
 *
 * Proxies the dashboard aggregation endpoint. Returns the full payload
 * the /dashboard page consumes in one round-trip:
 *   - stats (courses_count, lessons_completed_count, average_quiz_score, current_streak_days)
 *   - continue_learning rail
 *   - lessons_to_review widget
 *   - recent_attempts rail
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  const { user_id: userId } = getQuery(event);

  if (!userId || isNaN(Number(userId))) {
    throw createError({ statusCode: 400, message: 'user_id is required and must be numeric' });
  }

  // courseMaterialUrl points at `.../api/courses` — swap to `.../api/dashboard`.
  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/dashboard');

  try {
    return await $fetch<unknown>(`${base}/summary`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      params: { user_id: Number(userId) },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 500,
      message: error?.data?.error || error?.message || 'Failed to load dashboard',
      data: error?.data,
    });
  }
});
