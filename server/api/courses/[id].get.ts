import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/courses/[id].get
 * Retrieves a single course by id from the course service.
 */

interface CourseResponse {
  course_id?: number;
  id?: number;
  [key: string]: any;
}

export default defineEventHandler(async (event) => {
  const { courseUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Course id is required',
    });
  }

  try {
    const courses = await $fetch<CourseResponse[]>(courseUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const parsedId = Number(id);
    const course = courses.find((item) => item.course_id === parsedId || item.id === parsedId);

    if (!course) {
      throw createError({
        statusCode: 404,
        message: 'Course not found',
      });
    }

    return course;
  } catch (error: any) {
    if (error?.statusCode === 404) {
      throw error;
    }

    console.error('[courses/[id].get.ts] Failed to fetch course detail:', error);

    throw createError({
      statusCode: error.response?.status || 500,
      message: error.data?.message || error.message || 'Failed to fetch course detail',
      data: error.data,
    });
  }
});
