import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/course-material/index.post
 * Bulk-create course materials. Expects a JSON array body matching the
 * Course Material Service contract for POST /api/course-materials.
 *
 * Example body:
 * [
 *   { "course_id": "42", "youtube_id": "abc123", "title": "Intro to X",
 *     "thumbnail_url": "https://i.ytimg.com/...",
 *     "duration": "0:00", "lesson_id": "lesson-1" }
 * ]
 */
export default defineEventHandler(async (event) => {
  const { courseMaterialUrl } = useConfig();
  // courseMaterialUrl points at `.../api/courses`. The CRUD endpoint lives
  // under `.../api/course-materials`, so we swap the trailing segment.
  const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');

  const body = await readBody<unknown[]>(event);
  if (!Array.isArray(body) || body.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'request body must be a non-empty array of course materials',
    });
  }

  try {
    const response = await $fetch<unknown>(base, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body,
    });
    return response;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      message: error?.data?.error || error?.message || 'Failed to create course materials',
      data: error?.data,
    });
  }
});
