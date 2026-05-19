import useConfig from '~~/server/util/useConfig';

/**
 * @module server/api/courses/[id].get
 * Composes the course detail payload the frontend needs.
 *
 * The Course Service exposes `GET /api/course` returning a flat list of
 * Course rows and the Course Material Service exposes
 * `GET /api/course-materials/course/:id` returning the lessons for a given
 * course. This proxy joins them and emits a single object the
 * `normalizeCourseMaterial` composable can consume directly:
 *
 *   {
 *     course_id, course_title, course_description, ...,
 *     modules: [
 *       {
 *         id, title, lessons: [{ id, video_id, youtube_id, title, duration,
 *                                thumbnail_url, completed, lesson_id }]
 *       }
 *     ]
 *   }
 *
 * For now we group every lesson under a single default module "Lessons".
 * Once US-014 lands (first-class module grouping on CourseMaterial), this
 * proxy will group by `module_title` instead.
 */

interface CourseRow {
  course_id?: number;
  id?: number;
  [key: string]: any;
}

interface CourseMaterialRow {
  video_id: number;
  course_id: string;
  youtube_id: string;
  title: string;
  description: string;
  duration: string;
  upload_date: string;
  lesson_id: string;
  thumbnail_url: string;
  completed: boolean;
  module_title?: string;
}

interface CourseMaterialList {
  count: number;
  data: CourseMaterialRow[];
  message?: string;
}

export default defineEventHandler(async (event) => {
  const { courseUrl, courseMaterialUrl } = useConfig();
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'Course id is required' });
  }

  // 1. Fetch the course row from the Course Service. The service currently
  //    exposes a list endpoint only (US-004 will add a single-fetch endpoint),
  //    so we filter the list by id.
  let course: CourseRow | undefined;
  try {
    const courses = await $fetch<CourseRow[]>(courseUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const parsedId = Number(id);
    course = courses.find(
      (item) => item.course_id === parsedId || item.id === parsedId,
    );
  } catch (error: any) {
    console.error('[courses/[id].get.ts] Course fetch failed:', error);
    throw createError({
      statusCode: error?.response?.status || 500,
      message: error?.data?.message || error?.message || 'Failed to fetch course',
      data: error?.data,
    });
  }

  if (!course) {
    throw createError({ statusCode: 404, message: 'Course not found' });
  }

  // 2. Fetch the materials. Failure here is non-fatal — an empty playlist
  //    is a legitimate state for a brand-new course.
  let materials: CourseMaterialRow[] = [];
  try {
    const base = courseMaterialUrl.replace(/\/api\/courses\/?$/, '/api/course-materials');
    const response = await $fetch<CourseMaterialList>(`${base}/course/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    materials = Array.isArray(response?.data) ? response.data : [];
  } catch (error: any) {
    console.warn('[courses/[id].get.ts] Materials fetch failed:', error?.message);
  }

  // 3. Group materials into modules. Until US-014 ships, every lesson lives
  //    in a single default module. We still expose the data using the
  //    module-aware shape the normaliser expects.
  const modules = buildModules(materials);

  return {
    ...course,
    modules,
  };
});

/**
 * Group an ordered list of materials into module objects. Uses each row's
 * `module_title` if present (forward-compatible with US-014), otherwise puts
 * everything in a default "Lessons" module.
 */
function buildModules(materials: CourseMaterialRow[]) {
  if (materials.length === 0) return [];

  const buckets = new Map<string, CourseMaterialRow[]>();
  for (const m of materials) {
    const key = (m.module_title && m.module_title.trim()) || 'Lessons';
    const list = buckets.get(key) ?? [];
    list.push(m);
    buckets.set(key, list);
  }

  let moduleIndex = 0;
  return Array.from(buckets.entries()).map(([title, lessons]) => ({
    id: `module-${moduleIndex++}`,
    module_id: `module-${moduleIndex}`,
    title,
    completed: lessons.length > 0 && lessons.every((l) => l.completed),
    lessons: lessons.map((l) => ({
      // The normaliser reads `id` and `lesson_id`. We surface both so the
      // identifier is stable even if `lesson_id` is empty.
      id: l.video_id,
      lesson_id: l.lesson_id || `lesson-${l.video_id}`,
      video_id: l.video_id,
      youtube_id: l.youtube_id,
      title: l.title,
      description: l.description,
      duration: l.duration || '0:00',
      thumbnail_url: l.thumbnail_url,
      completed: !!l.completed,
    })),
  }));
}
