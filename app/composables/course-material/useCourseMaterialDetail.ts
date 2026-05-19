import { computed, ref } from 'vue';
import { useRoute } from '#imports';
import type {
  CourseMaterialCourse,
  CourseMaterialModule,
  CourseMaterialTab,
  CurrentVideoState,
} from '~/interfaces/course-material';
import { normalizeCourseMaterial } from '~/composables/course-material/useNormalizeCourseMaterial';

/**
 * @module composables/course-material/useCourseMaterialDetail
 * Handles all state and read-only logic for the course material detail page.
 */

/**
 * Read-only course material detail state.
 */
export const useCourseMaterialDetail = () => {
  const route = useRoute();

  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);
  const course = ref<CourseMaterialCourse | null>(null);
  const activeTab = ref<CourseMaterialTab>('playlist');
  const expandedModules = ref<Array<number | string>>([]);
  const currentVideo = ref<CurrentVideoState>({
    id: '',
    title: '',
    duration: '0:00',
    completed: false,
    module: '',
    description: '',
  });

  const courseId = computed(() => String(route.query.id ?? ''));

  const totalLessons = computed(() => {
    if (!course.value) {
      return 0;
    }

    return course.value.modules.reduce((accumulator, moduleItem) => {
      return accumulator + moduleItem.lessons.length;
    }, 0);
  });

  const computedProgress = computed(() => {
    if (!course.value) {
      return 0;
    }

    const completedLessons = course.value.modules.reduce((accumulator, moduleItem) => {
      return accumulator + moduleItem.lessons.filter((lesson) => lesson.completed).length;
    }, 0);

    if (!totalLessons.value) {
      return course.value.progress || 0;
    }

    return Math.round((completedLessons / totalLessons.value) * 100);
  });

  /**
   * Flat list of all lessons in sequential order. We sort by the DB
   * primary key (`dbVideoId`) ascending — same ordering the backend uses
   * for its sequential-progression lock — so the UI and the server agree
   * on what "lesson 1, 2, 3…" means.
   */
  const orderedLessons = computed(() => {
    if (!course.value) return [];
    const flat = course.value.modules.flatMap((m) => m.lessons);
    return [...flat].sort((a, b) => {
      const av = typeof a.dbVideoId === 'number' ? a.dbVideoId : Number.MAX_SAFE_INTEGER;
      const bv = typeof b.dbVideoId === 'number' ? b.dbVideoId : Number.MAX_SAFE_INTEGER;
      return av - bv;
    });
  });

  /**
   * Map from lesson `id` → boolean indicating whether the lesson is
   * locked. A lesson is locked when any earlier-ordered lesson in the
   * same course is still incomplete. The very first lesson is never
   * locked; the first incomplete lesson is "current"; everything after
   * the first incomplete lesson is locked.
   */
  const lockedById = computed(() => {
    const map: Record<string | number, boolean> = {};
    let seenIncomplete = false;
    for (const lesson of orderedLessons.value) {
      if (seenIncomplete && !lesson.completed) {
        map[lesson.id] = true;
      } else {
        map[lesson.id] = false;
      }
      if (!lesson.completed) {
        seenIncomplete = true;
      }
    }
    return map;
  });

  /** True when the currently-selected lesson is gated behind earlier ones. */
  const isCurrentLessonLocked = computed(() => {
    if (!course.value || !currentVideo.value.id) return false;
    for (const m of course.value.modules) {
      for (const lesson of m.lessons) {
        if (lesson.videoId === currentVideo.value.id) {
          return !!lockedById.value[lesson.id];
        }
      }
    }
    return false;
  });

  const youtubeEmbedUrl = computed(() => {
    if (!currentVideo.value.id) {
      return '';
    }

    return `https://www.youtube.com/embed/${currentVideo.value.id}?autoplay=0&rel=0&modestbranding=1`;
  });

  const setCurrentVideo = (moduleItem: CourseMaterialModule) => {
    const firstLesson = moduleItem.lessons[0];

    if (!firstLesson) {
      return;
    }

    currentVideo.value = {
      id: firstLesson.videoId,
      title: firstLesson.title,
      duration: firstLesson.duration,
      completed: firstLesson.completed,
      module: moduleItem.title,
      description: firstLesson.description ?? '',
    };
  };

  const initializePlayerState = () => {
    const firstModule = course.value?.modules[0];

    if (!firstModule) {
      return;
    }

    expandedModules.value = [firstModule.id];
    setCurrentVideo(firstModule);
  };

  const loadCourse = async () => {
    loading.value = true;
    error.value = null;

    try {
      const courseResponse = await $fetch<Record<string, any>>(`/api/courses/${courseId.value}`, {
        method: 'GET',
      });

      course.value = normalizeCourseMaterial(courseResponse);
      initializePlayerState();
    } catch (fetchError: any) {
      error.value = fetchError?.data?.message || fetchError?.message || 'Failed to fetch course details';
      course.value = null;
    } finally {
      loading.value = false;
    }
  };

  const toggleModule = (moduleId: number | string) => {
    const currentIndex = expandedModules.value.indexOf(moduleId);

    if (currentIndex === -1) {
      expandedModules.value.push(moduleId);
      return;
    }

    expandedModules.value.splice(currentIndex, 1);
  };

  const isModuleExpanded = (moduleId: number | string) => {
    return expandedModules.value.includes(moduleId);
  };

  const playLesson = (moduleId: number | string, lessonId: number | string) => {
    const moduleItem = course.value?.modules.find((item) => item.id === moduleId);

    if (!moduleItem) {
      return;
    }

    const lessonItem = moduleItem.lessons.find((item) => item.id === lessonId);

    if (!lessonItem) {
      return;
    }

    currentVideo.value = {
      id: lessonItem.videoId,
      title: lessonItem.title,
      duration: lessonItem.duration,
      completed: lessonItem.completed,
      module: moduleItem.title,
      description: lessonItem.description ?? '',
    };
  };

  /**
   * Find the lesson currently shown in the player. Returns null if no lesson
   * is selected or the lookup fails — callers must handle the null case.
   */
  const findCurrentLesson = () => {
    if (!course.value) return null;
    for (const moduleItem of course.value.modules) {
      const match = moduleItem.lessons.find(
        (lesson) =>
          lesson.videoId === currentVideo.value.id && moduleItem.title === currentVideo.value.module,
      );
      if (match) return { moduleItem, lesson: match };
    }
    return null;
  };

  /**
   * Apply the result of a successful US-001 takeaway submission to the local
   * state. Marks the lesson completed without a network round-trip; the
   * authoritative state stays in the backend.
   */
  const markCurrentLessonCompleted = () => {
    const result = findCurrentLesson();
    if (!result) return;
    result.lesson.completed = true;
    currentVideo.value.completed = true;

    const allCompleted = result.moduleItem.lessons.every((l) => l.completed);
    result.moduleItem.completed = allCompleted;
  };

  const currentResources = computed(() => {
    if (!course.value) {
      return [];
    }

    const moduleItem = course.value.modules.find((item) => item.title === currentVideo.value.module);
    const lessonItem = moduleItem?.lessons.find((item) => item.videoId === currentVideo.value.id);

    return lessonItem?.resources ?? [];
  });

  loadCourse();

  return {
    loading,
    error,
    course,
    activeTab,
    currentVideo,
    youtubeEmbedUrl,
    totalLessons,
    computedProgress,
    currentResources,
    toggleModule,
    isModuleExpanded,
    playLesson,
    loadCourse,
    findCurrentLesson,
    markCurrentLessonCompleted,
    lockedById,
    isCurrentLessonLocked,
    orderedLessons,
  };
};
