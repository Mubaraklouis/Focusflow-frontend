import { ref, computed } from 'vue';

/**
 * @module composables/course-material/useLessonCompletion
 * Active-recall completion gate (US-001). Manages the modal state for the
 * mandatory takeaway prompt, posts the takeaway to the Nitro proxy, and
 * exposes a callback the parent can use to flip the local lesson state
 * after a successful 2xx response.
 */

const MIN_CHARS = 30;
const MAX_CHARS = 1000;

export interface OpenForLessonOptions {
  /** Internal DB primary key of the lesson (CourseMaterial.video_id). */
  dbVideoId: number;
  /** Display title shown in the modal header. */
  lessonTitle: string;
  /** If the lesson is already completed, we fetch the prior takeaway so the
   *  user can review (read-only) rather than be forced to retype. */
  alreadyCompleted: boolean;
}

interface SubmitResult {
  ok: boolean;
  takeaway?: string;
}

/**
 * Lesson completion gate.
 *
 * The composable owns three pieces of state:
 *  - `isOpen`, `currentLesson` — modal visibility and which lesson is targeted
 *  - `body`, `isSubmitting`, `error` — form state
 *  - `priorTakeaway` — read-only history for already-complete lessons
 *
 * Acceptance criteria from US-001:
 *  - body must be MIN_CHARS..MAX_CHARS (trimmed) before Submit enables
 *  - on success, the parent's `onCompleted(dbVideoId)` callback fires so the
 *    UI can mark the lesson as completed locally without a full reload.
 */
export const useLessonCompletion = () => {
  const isOpen = ref<boolean>(false);
  const isSubmitting = ref<boolean>(false);
  const error = ref<string | null>(null);
  const body = ref<string>('');
  const currentLesson = ref<OpenForLessonOptions | null>(null);
  const priorTakeaway = ref<string | null>(null);
  const isReadOnly = ref<boolean>(false);

  const trimmedLength = computed(() => body.value.trim().length);

  const isValid = computed(
    () => trimmedLength.value >= MIN_CHARS && trimmedLength.value <= MAX_CHARS,
  );

  const hint = computed(() => {
    if (trimmedLength.value < MIN_CHARS) {
      return `${MIN_CHARS - trimmedLength.value} more characters required`;
    }
    if (trimmedLength.value > MAX_CHARS) {
      return `${trimmedLength.value - MAX_CHARS} characters over the limit`;
    }
    return `${trimmedLength.value} / ${MAX_CHARS}`;
  });

  /**
   * Open the modal for a given lesson. If the lesson is already completed,
   * we fetch the existing takeaway and put the modal in read-only mode.
   */
  const open = async (options: OpenForLessonOptions, userId: number) => {
    error.value = null;
    body.value = '';
    priorTakeaway.value = null;
    isReadOnly.value = false;
    currentLesson.value = options;
    isOpen.value = true;

    if (options.alreadyCompleted) {
      isReadOnly.value = true;
      try {
        const response = await $fetch<{ data: { body: string } | null }>(
          `/api/course-material/${options.dbVideoId}/takeaway`,
          { method: 'GET', query: { user_id: userId } },
        );
        priorTakeaway.value = response?.data?.body ?? null;
        body.value = priorTakeaway.value ?? '';
      } catch (fetchError: any) {
        error.value = fetchError?.data?.error || 'Could not load your prior takeaway.';
      }
    }
  };

  /** Close the modal. The lesson stays incomplete if no submission happened. */
  const close = () => {
    isOpen.value = false;
    currentLesson.value = null;
    body.value = '';
    error.value = null;
    isReadOnly.value = false;
    priorTakeaway.value = null;
  };

  /**
   * Submit the takeaway. Returns the new takeaway body on success so the
   * caller (e.g. the detail view) can update local state.
   */
  const submit = async (userId: number): Promise<SubmitResult> => {
    if (!currentLesson.value) {
      return { ok: false };
    }
    if (!isValid.value) {
      error.value = `Takeaway must be ${MIN_CHARS}-${MAX_CHARS} characters.`;
      return { ok: false };
    }

    isSubmitting.value = true;
    error.value = null;

    try {
      await $fetch(`/api/course-material/${currentLesson.value.dbVideoId}/takeaway`, {
        method: 'POST',
        body: { user_id: userId, body: body.value.trim() },
      });
      const finalBody = body.value.trim();
      close();
      return { ok: true, takeaway: finalBody };
    } catch (submitError: any) {
      error.value =
        submitError?.data?.error ||
        submitError?.data?.message ||
        submitError?.message ||
        'Failed to submit takeaway.';
      return { ok: false };
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    // state
    isOpen,
    isSubmitting,
    error,
    body,
    currentLesson,
    priorTakeaway,
    isReadOnly,
    // derived
    isValid,
    hint,
    trimmedLength,
    // actions
    open,
    close,
    submit,
    // constants surfaced for UI labels
    MIN_CHARS,
    MAX_CHARS,
  };
};
