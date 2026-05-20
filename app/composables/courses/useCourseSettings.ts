import type { Course } from './useGetCourses';

/**
 * Editable course fields surfaced on the settings screen.
 */
export interface CourseSettingsForm {
    course_title: string;
    course_description: string;
    course_category_id: number | null;
    course_visibility: 'public' | 'private';
    /** Existing remote thumbnail URL (read-only reference). */
    course_thumb: string;
    /** Newly selected file to replace the thumbnail, if any. */
    course_thumb_file: File | null;
}

/**
 * # ⚙️ useCourseSettings Composable
 *
 * Loads a single course and exposes update (including the public/private
 * visibility toggle) and delete operations against the Course Service.
 *
 * ```ts
 * const { form, loadCourse, saveCourse, removeCourse } = useCourseSettings();
 * await loadCourse(courseId);
 * ```
 */
export const useCourseSettings = () => {
    const loading = ref(true);
    const saving = ref(false);
    const deleting = ref(false);
    const error = ref<string | null>(null);

    const getDefaultForm = (): CourseSettingsForm => ({
        course_title: '',
        course_description: '',
        course_category_id: null,
        course_visibility: 'private',
        course_thumb: '',
        course_thumb_file: null,
    });

    const form = ref<CourseSettingsForm>(getDefaultForm());
    const thumbnailPreviewUrl = ref<string | null>(null);

    /**
     * Fetches the course and populates the form.
     */
    const loadCourse = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            const course = await $fetch<Course>(`/api/courses/${id}`, { method: 'GET' });
            form.value = {
                course_title: course.course_title ?? '',
                course_description: course.course_description ?? '',
                course_category_id: course.course_category_id ?? null,
                course_visibility: course.course_visibility === 'public' ? 'public' : 'private',
                course_thumb: course.course_thumb ?? '',
                course_thumb_file: null,
            };
        } catch (e: any) {
            error.value = e.data?.message || e.message || 'Failed to load course';
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Selects a new thumbnail file and builds a local preview.
     */
    const handleThumbnailUpload = (file: File | null) => {
        form.value.course_thumb_file = file;
        if (thumbnailPreviewUrl.value) {
            URL.revokeObjectURL(thumbnailPreviewUrl.value);
            thumbnailPreviewUrl.value = null;
        }
        if (file) {
            thumbnailPreviewUrl.value = URL.createObjectURL(file);
        }
    };

    /**
     * Persists the current form via PUT. Sends only the fields the backend
     * needs; a new thumbnail file is included only when one was picked.
     */
    const saveCourse = async (id: number | string) => {
        saving.value = true;
        error.value = null;
        try {
            const formData = new FormData();
            formData.append('course_title', form.value.course_title.trim());
            formData.append('course_description', form.value.course_description.trim());
            formData.append('course_visibility', form.value.course_visibility);
            if (form.value.course_category_id != null) {
                formData.append('course_category_id', String(form.value.course_category_id));
            }
            if (form.value.course_thumb_file) {
                formData.append('course_thumb', form.value.course_thumb_file);
            }

            const response = await $fetch<Course>(`/api/courses/${id}`, {
                method: 'PUT',
                body: formData,
            });
            return response;
        } catch (e: any) {
            error.value = e.data?.message || e.message || 'Failed to update course';
            throw e;
        } finally {
            saving.value = false;
        }
    };

    /**
     * Deletes the course.
     */
    const removeCourse = async (id: number | string) => {
        deleting.value = true;
        error.value = null;
        try {
            await $fetch(`/api/courses/${id}`, { method: 'DELETE' });
        } catch (e: any) {
            error.value = e.data?.message || e.message || 'Failed to delete course';
            throw e;
        } finally {
            deleting.value = false;
        }
    };

    return {
        form,
        loading,
        saving,
        deleting,
        error,
        thumbnailPreviewUrl,
        loadCourse,
        saveCourse,
        removeCourse,
        handleThumbnailUpload,
    };
};

export default useCourseSettings;
