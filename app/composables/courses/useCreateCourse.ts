export interface CreateCourseForm {
    course_title: string;
    course_thumb: string;
    course_category_id: number | null;
    user_id: number | null; // or string depending on backend, example showed 440
    course_visibility: 'public' | 'private';
    course_description: string; // Added based on UI
}

export const useCreateCourse = () => {
    const isLoading = useState<boolean>('create-course-loading', () => false);
    const error = useState<string | null>('create-course-error', () => null);

    const form = useState<CreateCourseForm>('create-course-form', () => ({
        course_title: '',
        course_thumb: '', // Placeholder or handle upload separately
        course_category_id: null,
        user_id: null,
        course_visibility: 'public',
        course_description: ''
    }));

    // Get user_id from cookie
    const userIdCookie = useCookie<string>('focusflow-user-id');

    // Initialize user_id from cookie if available
    if (userIdCookie.value) {
        const parsedId = parseInt(userIdCookie.value);
        if (!isNaN(parsedId)) {
            form.value.user_id = parsedId;
        }
    }

    const createCourse = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            // Ensure user_id is set before sending (retrieve from cookie if not set)
            if (!form.value.user_id && userIdCookie.value) {
                const parsedId = parseInt(userIdCookie.value);
                if (!isNaN(parsedId)) {
                    form.value.user_id = parsedId;
                }
            }

            if (!form.value.user_id) {
                throw new Error('User ID not found. Please ensure you are logged in.');
            }

            // Prepare payload with only the fields expected by the backend
            const payload = {
                course_title: form.value.course_title,
                course_thumb: form.value.course_thumb,
                course_category_id: form.value.course_category_id,
                user_id: form.value.user_id,
                course_visibility: form.value.course_visibility
            };

            const response = await $fetch('/api/courses', {
                method: 'POST',
                body: payload
            });

            console.log('Course created successfully', response);
            // Reset form or redirect
            return response;

        } catch (e: any) {
            console.error('Failed to create course', e);
            error.value = e.message || 'Failed to create course';
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        form,
        createCourse,
        isLoading,
        error
    };
}
