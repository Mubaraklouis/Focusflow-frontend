export interface CreateCourseForm {
    course_title: string;
    course_thumb: string;
    course_thumb_file: File | null; // For file upload
    course_category_id: number | null;
    user_id: number | null;
    course_visibility: 'public' | 'private';
    course_description: string; // UI field, not sent to backend
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

            // If user uploaded a file, upload to S3 first
            let thumbnailUrl = form.value.course_thumb;

            if (form.value.course_thumb_file) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', form.value.course_thumb_file);

                try {
                    const uploadResponse = await $fetch<{ url: string }>('/api/upload', {
                        method: 'POST',
                        body: uploadFormData
                    });
                    thumbnailUrl = uploadResponse.url;
                } catch (uploadError: any) {
                    throw new Error('Failed to upload thumbnail: ' + (uploadError.message || 'Unknown error'));
                }
            }

            // Send only the fields expected by the backend
            const payload = {
                course_title: form.value.course_title.trim(),
                course_thumb: thumbnailUrl,
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
        resetForm,
        handleThumbnailUpload,
        thumbnailPreviewUrl
    };
}

