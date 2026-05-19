import { ref } from 'vue';
import type { YouTubeSearchResult } from '~/interfaces/search-course-material';

/**
 * @module composables/search-course-material/useAddCourseMaterials
 * Persists a selection of YouTube videos as CourseMaterial rows for a given
 * course by POSTing to the Nitro proxy `/api/course-material`.
 *
 * Returns isSaving + error + a single async `save(courseId, selections)`
 * action. The dialog stays the orchestrator of which videos are selected —
 * this composable is only concerned with the network call and its state.
 */

interface SaveResult {
  ok: boolean;
  saved: number;
}

/**
 * Build the CourseMaterial payload for one selected YouTube video. The shape
 * matches the Course Material Service `CourseMaterial` model verbatim so the
 * backend can `ShouldBindJSON` directly into `[]CourseMaterial`.
 */
const toMaterial = (selection: YouTubeSearchResult, courseId: string, index: number) => ({
  course_id: String(courseId),
  youtube_id: selection.videoId,
  title: selection.title,
  description: selection.description,
  thumbnail_url: selection.thumbnail,
  duration: '0:00', // unknown until we hit the YouTube videos endpoint per item; future US.
  lesson_id: `lesson-${Date.now()}-${index}`,
  upload_date: selection.publishedAt || new Date().toISOString(),
});

export const useAddCourseMaterials = () => {
  const isSaving = ref<boolean>(false);
  const error = ref<string | null>(null);

  const save = async (
    courseId: string | number,
    selections: YouTubeSearchResult[],
  ): Promise<SaveResult> => {
    if (!courseId) {
      error.value = 'Course id is required.';
      return { ok: false, saved: 0 };
    }
    if (selections.length === 0) {
      error.value = 'Select at least one video first.';
      return { ok: false, saved: 0 };
    }

    isSaving.value = true;
    error.value = null;

    const payload = selections.map((sel, idx) => toMaterial(sel, String(courseId), idx));

    try {
      await $fetch('/api/course-material', {
        method: 'POST',
        body: payload,
      });
      return { ok: true, saved: payload.length };
    } catch (err: any) {
      error.value =
        err?.data?.message || err?.data?.error || err?.message || 'Failed to add materials.';
      return { ok: false, saved: 0 };
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isSaving,
    error,
    save,
  };
};
