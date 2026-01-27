export interface CreateCourseForm {
    course_title: string;
    course_thumb: string;
    course_category_id: number | null;
    user_id: number | null;
    course_visibility: 'public' | 'private';
}

export interface ValidationErrors {
    course_title?: string;
}

export const useCreateCourse = () => {
    const isLoading = useState<boolean>('create-course-loading', () => false);
    const error = useState<string | null>('create-course-error', () => null);
    const validationErrors = useState<ValidationErrors>('create-course-validation', () => ({}));

    const getDefaultForm = (): CreateCourseForm => ({
        course_title: '',
        course_thumb: '',
        course_category_id: null,
        user_id: null,
        course_visibility: 'private'
    });

    const form = useState<CreateCourseForm>('create-course-form', getDefaultForm);

    // Get user_id from cookie
    const userIdCookie = useCookie<string>('focusflow-user-id');

    // Initialize user_id from cookie if available
    if (userIdCookie.value) {
        const parsedId = parseInt(userIdCookie.value);
        if (!isNaN(parsedId)) {
            form.value.user_id = parsedId;
        }
    }

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        // Validate course title
        if (!form.value.course_title.trim()) {
            errors.course_title = 'Course title is required';
        } else if (form.value.course_title.trim().length < 3) {
            errors.course_title = 'Course title must be at least 3 characters';
        } else if (form.value.course_title.trim().length > 100) {
            errors.course_title = 'Course title must be less than 100 characters';
        }

        validationErrors.value = errors;
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        // Keep the user_id when resetting
        const userId = form.value.user_id;
        form.value = getDefaultForm();
        form.value.user_id = userId;
        validationErrors.value = {};
        error.value = null;
    };


    const createCourse = async () => {
        isLoading.value = true;
        error.value = null;

        // Validate form first
        if (!validateForm()) {
            isLoading.value = false;
            throw new Error('Please fix the validation errors');
        }

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

            // Send only the fields expected by the backend
            const payload = {
                course_title: form.value.course_title.trim(),
                course_thumb: form.value.course_thumb,
                course_category_id: form.value.course_category_id,
                user_id: form.value.user_id,
                course_visibility: form.value.course_visibility
            };

            const response = await $fetch('/api/courses', {
                method: 'POST',
                body: payload
            });

            // Reset form after successful creation
            resetForm();

            return response;

        } catch (e: any) {
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
        error,
        validationErrors,
        validateForm,
        resetForm
    };
}

