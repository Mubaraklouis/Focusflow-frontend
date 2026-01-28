import { COURSE_CATEGORIES, type Category } from './useGetCourses';

// Re-export for use in create course form
export { COURSE_CATEGORIES, type Category };

export interface CreateCourseForm {
    course_title: string;
    course_thumb: string;
    course_thumb_file: File | null; // For file upload
    course_category_id: number | null;
    user_id: number | null;
    course_visibility: 'public' | 'private';
    course_description: string;
}

export interface ValidationErrors {
    course_title?: string;
    course_description?: string;
    course_thumb?: string;
}

export const useCreateCourse = () => {
    const isLoading = useState<boolean>('create-course-loading', () => false);
    const error = useState<string | null>('create-course-error', () => null);
    const validationErrors = useState<ValidationErrors>('create-course-validation', () => ({}));

    const getDefaultForm = (): CreateCourseForm => ({
        course_title: '',
        course_thumb: '',
        course_thumb_file: null,
        course_category_id: null,
        user_id: null,
        course_visibility: 'private',
        course_description: ''
    });

    const form = useState<CreateCourseForm>('create-course-form', getDefaultForm);
    const thumbnailPreviewUrl = useState<string | null>('course-thumb-preview', () => null);

    // Get user_id from cookie
    const userIdCookie = useCookie<string>('focusflow-user-id');

    // Initialize user_id from cookie if available
    if (userIdCookie.value) {
        const parsedId = parseInt(userIdCookie.value);
        if (!isNaN(parsedId)) {
            form.value.user_id = parsedId;
        }
    }

    // Handle thumbnail file selection
    const handleThumbnailUpload = (file: File | null) => {
        form.value.course_thumb_file = file;

        // Generate preview URL
        if (file) {
            // Revoke previous preview URL to avoid memory leaks
            if (thumbnailPreviewUrl.value) {
                URL.revokeObjectURL(thumbnailPreviewUrl.value);
            }
            thumbnailPreviewUrl.value = URL.createObjectURL(file);
        } else {
            if (thumbnailPreviewUrl.value) {
                URL.revokeObjectURL(thumbnailPreviewUrl.value);
            }
            thumbnailPreviewUrl.value = null;
        }
    };

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

        // Validate description (optional but min length if provided)
        if (form.value.course_description.trim() && form.value.course_description.trim().length < 10) {
            errors.course_description = 'Description must be at least 10 characters if provided';
        }

        // Validate thumbnail
        if (!form.value.course_thumb && !form.value.course_thumb_file) {
            errors.course_thumb = 'Please upload a course thumbnail';
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

        // Clear preview URL
        if (thumbnailPreviewUrl.value) {
            URL.revokeObjectURL(thumbnailPreviewUrl.value);
            thumbnailPreviewUrl.value = null;
        }
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

            // Build FormData with file and course data - backend handles S3 upload
            const formData = new FormData();
            formData.append('course_title', form.value.course_title.trim());
            formData.append('course_description', form.value.course_description.trim());
            formData.append('course_category_id', String(form.value.course_category_id ?? ''));
            formData.append('user_id', String(form.value.user_id));
            formData.append('course_visibility', form.value.course_visibility);

            // Append file if selected, otherwise use existing URL
            if (form.value.course_thumb_file) {
                formData.append('course_thumb', form.value.course_thumb_file);
            } else if (form.value.course_thumb) {
                formData.append('course_thumb', form.value.course_thumb);
            }

            const response = await $fetch('/api/courses', {
                method: 'POST',
                body: formData
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
        resetForm,
        handleThumbnailUpload,
        thumbnailPreviewUrl
    };
}

