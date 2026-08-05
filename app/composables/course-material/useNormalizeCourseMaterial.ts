import type {
  CourseMaterialCourse,
  CourseMaterialLesson,
  CourseMaterialModule,
  CourseMaterialResource,
} from '~/interfaces/course-material';
import { toProxiedThumb } from '~/utils/thumbUrl';

/**
 * @module composables/course-material/useNormalizeCourseMaterial
 * Provides a safe normalizer for backend course detail payloads.
 */

/**
 * Gets the first existing value for a list of keys.
 */
const pick = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return undefined;
};

/**
 * Converts an unknown payload into a normalized course model.
 *
 * @param rawCourse Raw API payload for a single course.
 * @returns Normalized course model used by UI.
 */
export const normalizeCourseMaterial = (rawCourse: Record<string, any>): CourseMaterialCourse => {
  const rawModules: Record<string, any>[] = Array.isArray(rawCourse.modules)
    ? rawCourse.modules
    : [];

  const modules: CourseMaterialModule[] = rawModules.map((rawModule, moduleIndex) => {
    const rawLessons: Record<string, any>[] = Array.isArray(rawModule.lessons)
      ? rawModule.lessons
      : [];

    const lessons: CourseMaterialLesson[] = rawLessons.map((rawLesson, lessonIndex) => {
      const rawResources: Record<string, any>[] = Array.isArray(rawLesson.resources)
        ? rawLesson.resources
        : [];

      const resources: CourseMaterialResource[] = rawResources.map((resource, resourceIndex) => ({
        id: pick(resource, ['id', 'resource_id']) ?? `${moduleIndex}-${lessonIndex}-${resourceIndex}`,
        title: String(pick(resource, ['title', 'name']) ?? 'Resource'),
        url: pick(resource, ['url', 'link']),
        type: pick(resource, ['type', 'resource_type']),
      }));

      // The Go Course Material Service uses `video_id` (int) as the DB primary key
      // and `youtube_id` (string) as the embeddable YouTube identifier. Older
      // payloads conflated the two on `videoId`, so we keep both fields:
      //   - videoId   : YouTube ID used for the embed iframe and thumbnail
      //   - dbVideoId : integer DB primary key used for takeaway endpoints (US-001)
      const rawDbVideoId = pick(rawLesson, ['video_id']);
      const dbVideoId = typeof rawDbVideoId === 'number'
        ? rawDbVideoId
        : rawDbVideoId !== undefined && rawDbVideoId !== null && !isNaN(Number(rawDbVideoId))
          ? Number(rawDbVideoId)
          : null;

      return {
        id: pick(rawLesson, ['id', 'lesson_id']) ?? `${moduleIndex}-${lessonIndex}`,
        dbVideoId,
        title: String(pick(rawLesson, ['title', 'lesson_title']) ?? 'Untitled Lesson'),
        videoId: String(pick(rawLesson, ['youtube_id', 'videoId']) ?? ''),
        duration: String(pick(rawLesson, ['duration']) ?? '0:00'),
        completed: Boolean(pick(rawLesson, ['completed', 'is_completed']) ?? false),
        description: pick(rawLesson, ['description', 'lesson_description']),
        resources,
      };
    });

    return {
      id: pick(rawModule, ['id', 'module_id']) ?? moduleIndex,
      title: String(pick(rawModule, ['title', 'module_title']) ?? `Module ${moduleIndex + 1}`),
      completed: Boolean(pick(rawModule, ['completed', 'is_completed']) ?? false),
      lessons,
    };
  });

  return {
    id: pick(rawCourse, ['id', 'course_id', 'uuid']) ?? '',
    title: String(pick(rawCourse, ['title', 'course_title']) ?? 'Untitled Course'),
    description: String(pick(rawCourse, ['description', 'course_description']) ?? ''),
    thumbnail: toProxiedThumb(pick(rawCourse, ['course_thumb', 'thumbnail', 'image'])),
    progress: Number(pick(rawCourse, ['progress', 'course_progress']) ?? 0),
    modules,
  };
};
