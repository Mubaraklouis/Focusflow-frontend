/**
 * Category interface for course categories
 */
export interface Category {
    category_id: number;
    category_name: string;
    description: string;
}

/**
 * Hardcoded course categories to avoid server fetching
 */
export const COURSE_CATEGORIES: Category[] = [
    { category_id: 1, category_name: "Development", description: "Web, Mobile, and Software dev" },
    { category_id: 2, category_name: "Business", description: "Marketing, Finance, and Sales" },
    { category_id: 3, category_name: "Design", description: "UI/UX and Graphic Design" },
    { category_id: 4, category_name: "Personal Development", description: "Soft skills and productivity" },
];

/**
 * Course data structure from the backend API
 */
export interface Course {
    course_id: number;
    course_title: string;
    course_thumb: string;
    course_category_id: number;
    user_id: number;
    category: Category;
    course_visibility: 'public' | 'private';
    course_description: string;
    course_progress: number;
    /**
     * Client-derived fallback thumbnail used when `course_thumb` is empty.
     * Sourced from the first course-material lesson's YouTube thumbnail.
     * Undefined when the course has no lessons (UI then shows a book icon).
     */
    derived_thumb?: string;
}

/**
 * Builds a YouTube thumbnail URL from a course-material lesson, preferring the
 * stored `thumbnail_url` and falling back to the standard image URL derived
 * from `youtube_id`. Returns undefined when neither is available.
 */
const lessonThumb = (lesson?: { youtube_id?: string; thumbnail_url?: string }): string | undefined => {
    if (!lesson) return undefined;
    if (lesson.thumbnail_url) return lesson.thumbnail_url;
    if (lesson.youtube_id) return `https://img.youtube.com/vi/${lesson.youtube_id}/mqdefault.jpg`;
    return undefined;
};

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

            // The Course service's `course_progress` column is static (set at
            // creation, never recomputed). Real lesson-completion state lives
            // in the Course Material service, so derive progress from there —
            // same source the course detail page uses. Done in parallel; a
            // per-course failure leaves that course at 0 rather than blocking.
            await Promise.all(
                courses.value.map(async (course) => {
                    try {
                        const res = await $fetch<{
                            count: number;
                            data: Array<{
                                completed: boolean;
                                youtube_id?: string;
                                thumbnail_url?: string;
                            }>;
                        }>(`/api/course-material/course/${course.course_id}`, {
                            method: 'GET',
                        });
                        const lessons = Array.isArray(res?.data) ? res.data : [];
                        if (lessons.length === 0) {
                            course.course_progress = 0;
                            return;
                        }
                        // Fall back to the first lesson's YouTube thumbnail when
                        // the course itself has no uploaded cover image.
                        if (!course.course_thumb) {
                            course.derived_thumb = lessonThumb(lessons[0]);
                        }
                        const done = lessons.filter((l) => l.completed).length;
                        course.course_progress = Math.round(
                            (done / lessons.length) * 100
                        );
                    } catch {
                        course.course_progress = course.course_progress || 0;
                    }
                })
            );

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
