import { ref } from 'vue';
import type { Course } from './useGetCourses';
import { toProxiedThumb } from '~/utils/thumbUrl';

export function useDiscoverCourses() {
    const courses = ref<Course[]>([]);
    const loading = ref<boolean>(true);
    const error = ref<string | null>(null);

    const fetchCourses = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await $fetch<Course[]>('/api/courses', {
                method: 'GET'
            });

            // Serve MinIO thumbnails over HTTPS (browsers block http:// images)
            response.forEach((course) => {
                course.course_thumb = toProxiedThumb(course.course_thumb)
            })

            // Filter courses to only show public ones
            courses.value = response.filter(
                (course) => course.course_visibility === 'public'
            );

        } catch (e: any) {
            console.error('[useDiscoverCourses] Failed to fetch courses:', e);
            error.value = e.data?.message || e.message || 'Failed to fetch courses';
            courses.value = [];
        } finally {
            loading.value = false;
        }
    };

    fetchCourses();

    return {
        courses,
        loading,
        error,
        fetchCourses
    };
}
