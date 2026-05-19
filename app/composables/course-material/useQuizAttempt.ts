import { onUnmounted, ref } from 'vue';
import type { QuizAttempt } from '~/interfaces/lesson-quiz';

/**
 * @module composables/course-material/useQuizAttempt
 *
 * Polling composable for the results page. Calls
 * `GET /api/quiz-attempts/<id>` every 2s while the backend is still
 * grading; stops as soon as `status` is `completed` or `failed`.
 *
 * The poll backs off after 60 seconds (jumps to every 5s) — Gemini
 * occasionally hits its own service issues that take longer to surface.
 */

const POLL_INTERVAL_FAST_MS = 2_000;
const POLL_INTERVAL_SLOW_MS = 5_000;
const SLOW_AFTER_MS = 60_000;

export const useQuizAttempt = (attemptId: number) => {
  const attempt = ref<QuizAttempt | null>(null);
  const error = ref<string | null>(null);
  const isPolling = ref<boolean>(false);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let startedAt = 0;

  const stop = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    isPolling.value = false;
  };

  const fetchOnce = async () => {
    try {
      const response = await $fetch<{ data: QuizAttempt }>(`/api/quiz-attempts/${attemptId}`);
      attempt.value = response?.data ?? null;
      if (!attempt.value) {
        error.value = 'Attempt not found.';
        stop();
        return;
      }
      if (attempt.value.status === 'completed' || attempt.value.status === 'failed') {
        stop();
        return;
      }
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Failed to load attempt.';
      stop();
      return;
    }
    schedule();
  };

  const schedule = () => {
    const elapsed = Date.now() - startedAt;
    const delay = elapsed > SLOW_AFTER_MS ? POLL_INTERVAL_SLOW_MS : POLL_INTERVAL_FAST_MS;
    timer = setTimeout(fetchOnce, delay);
  };

  const start = () => {
    if (isPolling.value || !attemptId) return;
    isPolling.value = true;
    startedAt = Date.now();
    fetchOnce();
  };

  onUnmounted(stop);

  return { attempt, error, isPolling, start, stop };
};
