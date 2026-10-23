import { apiFetch, forwardQuery } from '~~/server/util/api'

/** GET /api/course-material/course/{courseId} → API GET /api/course-materials/course/:courseId. Lessons of a course. */
export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'courseId')
  if (!courseId || isNaN(Number(courseId))) throw createError({ statusCode: 400, message: 'courseId must be numeric' })
  return apiFetch(event, `/api/course-materials/course/${courseId}`, { query: forwardQuery(event) })
})
