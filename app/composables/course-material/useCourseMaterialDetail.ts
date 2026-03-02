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
    };
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
  };
};
