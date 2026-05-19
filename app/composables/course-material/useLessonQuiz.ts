import { computed, ref } from 'vue';
import { useRouter } from '#imports';
import {
  type LessonQuestion,
  type QuizAttempt,
  type QuizStep,
  TAKEAWAY_MAX_CHARS,
  TAKEAWAY_MIN_CHARS,
  WRITING_MIN_CHARS,
} from '~/interfaces/lesson-quiz';

/**
 * @module composables/course-material/useLessonQuiz
 *
 * Single source of truth for the US-026 stepper.
 *
 * Flow:
 *   1. The detail page calls `prepare(dbVideoId)` when the learner picks
 *      a lesson — this is fire-and-forget background generation on the
 *      backend (goroutine), so by the time the learner clicks
 *      Mark-as-complete the quiz is already cached.
 *   2. `open()` fetches the questions (instant cache-hit in 99% of cases).
 *   3. The learner walks steps 1..7 in the modal (3 MCQ + 3 writing +
 *      1 takeaway). Each step is irreversible — no Back button.
 *   4. `submit()` POSTs to /quiz/attempts which returns 202 with an
 *      attempt_id while grading runs in a background goroutine.
 *   5. The dialog closes and the parent navigates to
 *      /courses/quiz/<attemptId> where the results page polls until
 *      grading completes.
 */

interface OpenOptions {
  dbVideoId: number;
  userId: number;
  lessonTitle: string;
}

export const useLessonQuiz = () => {
  const router = useRouter();

  // ── Lifecycle state ───────────────────────────────────────────────────────
  const isOpen = ref<boolean>(false);
  const lessonTitle = ref<string>('');
  const dbVideoId = ref<number | null>(null);
  const userId = ref<number | null>(null);

  // ── Stepper state ─────────────────────────────────────────────────────────
  const currentStep = ref<QuizStep>(1);
  const questions = ref<LessonQuestion[]>([]);
  const answers = ref<Record<number, string>>({});
  const takeaway = ref<string>('');

  // ── Async state ───────────────────────────────────────────────────────────
  const isLoadingQuestions = ref<boolean>(false);
  const isSubmitting = ref<boolean>(false);
  const error = ref<string | null>(null);
  const unavailable = ref<boolean>(false);
  const unavailableReason = ref<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalSteps = 7 as const;

  const progressPercent = computed(() =>
    Math.round((currentStep.value / 7) * 100),
  );

  const currentQuestion = computed<LessonQuestion | null>(() => {
    if (currentStep.value < 1 || currentStep.value > 6) return null;
    return questions.value[currentStep.value - 1] ?? null;
  });

  const isMcqStep = computed(() => currentStep.value >= 1 && currentStep.value <= 3);
  const isWritingStep = computed(() => currentStep.value >= 4 && currentStep.value <= 6);
  const isTakeawayStep = computed(() => currentStep.value === 7);

  const canAdvance = computed<boolean>(() => {
    if (isMcqStep.value) {
      const raw = answers.value[currentStep.value];
      return typeof raw === 'string' && raw.length > 0;
    }
    if (isWritingStep.value) {
      const raw = (answers.value[currentStep.value] ?? '').trim();
      return raw.length >= WRITING_MIN_CHARS;
    }
    if (isTakeawayStep.value) {
      const t = takeaway.value.trim();
      return t.length >= TAKEAWAY_MIN_CHARS && t.length <= TAKEAWAY_MAX_CHARS;
    }
    return false;
  });

  const primaryLabel = computed<string>(() =>
    isTakeawayStep.value ? 'Submit attempt' : 'Next',
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const reset = () => {
    questions.value = [];
    answers.value = {};
    takeaway.value = '';
    currentStep.value = 1;
    isLoadingQuestions.value = false;
    isSubmitting.value = false;
    error.value = null;
    unavailable.value = false;
    unavailableReason.value = null;
  };

  /**
   * Background pre-generation. The detail page calls this when the learner
   * selects a lesson in the player so the quiz is warm before they click
   * Mark-as-complete. Errors are swallowed silently — the eventual open()
   * call will report them properly.
   */
  const prepare = async (videoId: number) => {
    if (!videoId) return;
    try {
      await $fetch(`/api/course-material/${videoId}/quiz/prepare`, { method: 'POST' });
    } catch {
      // Background hint — don't surface failures here.
    }
  };

  /**
   * Trigger generation of a NEW quiz set for a lesson (covers the next
   * ~25-minute window of the source video). Returns true on success.
   * On failure, error.value is populated so the caller can surface it.
   */
  const isRegenerating = ref<boolean>(false);
  const regenerate = async (videoId: number): Promise<boolean> => {
    if (!videoId) return false;
    isRegenerating.value = true;
    error.value = null;
    try {
      await $fetch(`/api/course-material/${videoId}/quiz/regenerate`, {
        method: 'POST',
        timeout: 130_000,
      });
      return true;
    } catch (err: any) {
      error.value =
        err?.data?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Could not generate another quiz.';
      return false;
    } finally {
      isRegenerating.value = false;
    }
  };

  /**
   * Open the modal. Calls /quiz/generate (which is idempotent + reads
   * the cache) so we get the questions in one round-trip whether or not
   * Prepare has finished.
   */
  const open = async (opts: OpenOptions) => {
    reset();
    lessonTitle.value = opts.lessonTitle;
    dbVideoId.value = opts.dbVideoId;
    userId.value = opts.userId;
    isOpen.value = true;
    isLoadingQuestions.value = true;

    try {
      const response = await $fetch<{ data: LessonQuestion[] }>(
        `/api/course-material/${opts.dbVideoId}/quiz/generate`,
        { method: 'POST', timeout: 100_000 },
      );
      const list = Array.isArray(response?.data) ? response.data : [];
      if (list.length !== 6) {
        throw new Error(`Expected 6 questions, got ${list.length}`);
      }
      questions.value = [...list].sort((a, b) => a.position - b.position);
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status || 500;
      if (status === 503) {
        unavailable.value = true;
        unavailableReason.value = err?.data?.data?.reason || err?.data?.reason || null;
        error.value =
          err?.data?.data?.message ||
          err?.data?.message ||
          'We could not generate a quiz for this lesson.';
      } else {
        error.value =
          err?.data?.message || err?.message || 'Could not load the quiz.';
      }
    } finally {
      isLoadingQuestions.value = false;
    }
  };

  const retry = async () => {
    if (!dbVideoId.value || !userId.value) return;
    await open({
      dbVideoId: dbVideoId.value,
      userId: userId.value,
      lessonTitle: lessonTitle.value,
    });
  };

  const close = () => {
    isOpen.value = false;
    setTimeout(reset, 300);
  };

  const setAnswer = (step: number, value: string) => {
    answers.value = { ...answers.value, [step]: value };
  };

  /** Lock the current step and advance. Irreversible — no back(). */
  const next = () => {
    if (!canAdvance.value) return;
    if (currentStep.value < 7) {
      currentStep.value = (currentStep.value + 1) as QuizStep;
    }
  };

  /**
   * Submit the full attempt. Backend returns 202 with the attempt_id while
   * grading runs in a background goroutine. We close the modal and
   * navigate to the results page, which polls until grading completes.
   */
  const submit = async () => {
    if (!canAdvance.value || !dbVideoId.value || !userId.value) return;

    isSubmitting.value = true;
    error.value = null;

    const payload = {
      user_id: userId.value,
      takeaway: takeaway.value.trim(),
      answers: questions.value.map((q, idx) => ({
        question_id: q.id,
        answer: (answers.value[idx + 1] ?? '').trim(),
      })),
    };

    try {
      const response = await $fetch<{ data: QuizAttempt }>(
        `/api/course-material/${dbVideoId.value}/quiz/attempts`,
        { method: 'POST', body: payload, timeout: 30_000 },
      );
      const attemptId = response?.data?.id;
      if (!attemptId) throw new Error('Backend did not return an attempt id.');
      close();
      // Navigate to the dedicated results page. The page polls until the
      // backend goroutine flips status to completed/failed.
      router.push(`/courses/quiz/${attemptId}`);
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status;
      if (status === 409 && err?.data?.error === 'sequential_lock') {
        // v2 sequential lock: surface the backend's named blocking lesson
        // so the user knows which earlier lesson to finish first.
        const blocking = err?.data?.blocking_title || 'an earlier lesson';
        error.value = `Complete “${blocking}” first — lessons must be done in order.`;
      } else {
        error.value =
          err?.data?.message ||
          err?.message ||
          'Failed to submit your attempt. Please try again.';
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    // identity
    isOpen,
    lessonTitle,
    dbVideoId,
    // state
    currentStep,
    totalSteps,
    progressPercent,
    questions,
    answers,
    takeaway,
    error,
    unavailable,
    unavailableReason,
    isLoadingQuestions,
    isSubmitting,
    // step flags
    currentQuestion,
    isMcqStep,
    isWritingStep,
    isTakeawayStep,
    canAdvance,
    primaryLabel,
    // actions
    prepare,
    regenerate,
    isRegenerating,
    open,
    close,
    next,
    submit,
    setAnswer,
    retry,
    // constants
    WRITING_MIN_CHARS,
    TAKEAWAY_MIN_CHARS,
    TAKEAWAY_MAX_CHARS,
  };
};
