import useConfig from "~~/server/util/useConfig"

/**
 * Course data structure returned from the backend API
 */
interface Course {
    course_id: number;
    course_title: string;
    course_thumb: string;
    course_category_id: number;
    user_id: number;
    course_visibility: 'public' | 'private';
    course_description: string;
    course_progress: number;
}

/**
 * # 📚 Get Courses API Handler
 * 
 * Fetches all courses from the backend courses service.
 * The composable layer filters by the logged-in user's ID.
 * 
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Code Logic |
 * | :--- | :--- | :--- |
 * | **1** | **Fetch Courses** | GET request to `${courseUrl}` to retrieve all courses. |
 * | **2** | **Return Data** | Returns the course array directly to the client. |
 * 
 * ## 🚀 Frontend Usage Example
 * ```typescript
 * const { data, error } = await useFetch('/api/courses')
 * ```
 * 
 * @param event - The H3 event object (Nuxt Server Context).
 * @returns {Promise<Course[]>} Array of courses from the backend.
 * @throws {H3Error} **500** - Triggered if the backend is unreachable or returns an error.
 */
export default defineEventHandler(async (event): Promise<Course[]> => {
    const { courseUrl } = useConfig()

    try {
        // Fetch courses from backend - no CSRF required for this service
        const response = await $fetch<Course[]>(courseUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        })

        return response

    } catch (error: any) {
        console.error('[courses/index.get.ts] Failed to fetch courses:', error)

        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to fetch courses',
            data: error.data
        })
    }
})
