/**
 * Course data structure from the backend API
 */
export interface Course {
    course_id: number;
    course_title: string;
    course_thumb: string;
    course_category_id: number;
    user_id: number;
    course_visibility: 'public' | 'private';
}

/**
 * # 📚 useGetCourses Composable
 * 
 * Fetches and manages course data for the logged-in user.
 * Filters courses by user_id from the `focusflow-user-id` cookie.
 * 
 * ## 🚀 Usage Example
 * ```typescript
 * const { courses, loading, error, fetchCourses } = useGetCourses()
 * ```
 * 
 * @returns {Object} Reactive course data, loading state, error state, and fetch function.
 */
export default function useGetCourses() {
    /** All courses for the logged-in user */
    const courses = ref<Course[]>([]);

    /** Loading state while fetching courses */
    const loading = ref<boolean>(true);

    /** Error message if fetch fails */
    const error = ref<string | null>(null);

    /** Get user_id from cookie to filter courses */
    const userIdCookie = useCookie<string>('focusflow-user-id');

    /**
     * Fetches courses from the API and filters by logged-in user's ID.
     */
    const fetchCourses = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await $fetch<Course[]>('/api/courses', {
                method: 'GET'
            });

            // Get the logged-in user's ID
            const loggedInUserId = userIdCookie.value
                ? parseInt(userIdCookie.value)
                : null;

            // Filter courses to only show those belonging to the logged-in user
            if (loggedInUserId) {
                courses.value = response.filter(
                    (course) => course.user_id === loggedInUserId
                );
            } else {
                // If no user ID found, show empty (user not properly logged in)
                console.warn('[useGetCourses] No user ID found in cookie');
                courses.value = [];
            }

        } catch (e: any) {
            console.error('[useGetCourses] Failed to fetch courses:', e);
            error.value = e.data?.message || e.message || 'Failed to fetch courses';
            courses.value = [];
        } finally {
            loading.value = false;
        }
    };

    // Fetch courses on composable initialization
    fetchCourses();

    return {
        courses,
        loading,
        error,
        fetchCourses
    };
}
