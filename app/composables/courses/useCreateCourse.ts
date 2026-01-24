import { useProfile } from '~/composables/Profile/useProfile';

export interface CreateCourseForm {
    course_title: string;
    course_thumb: string;
    course_category_id: number | null;
    user_id: number | null; // or string depending on backend, example showed 440
    course_visibility: 'public' | 'private';
    course_description: string; // Added based on UI
}

export const useCreateCourse = () => {
    const { profile } = useProfile();
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

    // Initialize user_id from profile if available
    if (profile.value?.id) {
        // Assuming profile.id is compatible. The requirement JSON showed user_id as number 440.
        // Profile ID is string in definition. I will parse it if possible or keep as string if flexible.
        // For now, I'll attempt to parse, or default.
        const parsedId = parseInt(profile.value.id);
        if (!isNaN(parsedId)) {
            form.value.user_id = parsedId;
        }
    }

    const { $csrfFetch } = useNuxtApp();

    const createCourse = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            // Ensure user_id is set before sending (if it wasn't available at init)
            if (!form.value.user_id && profile.value?.id) {
                const parsedId = parseInt(profile.value.id);
                if (!isNaN(parsedId)) {
                    form.value.user_id = parsedId;
                }
            }

            const response = await $fetch('/api/courses', {
                method: 'POST',
                body: form.value
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
