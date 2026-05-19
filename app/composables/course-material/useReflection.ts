import { ref } from 'vue';
import type {
  Reflection,
  ReflectionServiceUnavailableError,
} from '~/interfaces/reflection';

/**
 * @module composables/course-material/useReflection
 *
 * Feynman-technique reflection composable. Mirrors the shape and style of
 * useLessonCompletion: thin reactive wrappers around $fetch calls to the
 * Nitro proxy routes.
 *
 * Reactive state:
 *   - `isSubmitting`   — true while a POST /reflection is in flight
 *   - `history`        — full Reflection[] for the current lesson, ASC order
 *   - `latest`         — most recent Reflection | null
 *   - `error`          — last error message, or null
 *
 * Actions:
 *   - `submitReflection`       — POST then refresh history + latest
 *   - `getReflectionHistory`   — GET ordered history (writes history.value)
 *   - `getLatestReflection`    — GET latest (writes latest.value)
 */
export const useReflection = () => {
  const isSubmitting = ref<boolean>(false);
  const history = ref<Reflection[]>([]);
  const latest = ref<Reflection | null>(null);
  const error = ref<string | null>(null);

  /**
   * Submit a new Feynman reflection. On success writes the returned
   * Reflection to `latest` and appends it to `history`.
   *
   * On 503 throws a typed error with `code: 'service_unavailable'` so the
   * page can surface a calm fallback message without crashing.
   */
  const submitReflection = async (
    videoId: number,
    userId: number,
    body: string,
  ): Promise<Reflection> => {
    isSubmitting.value = true;
    error.value = null;

    try {
      // Backend now returns 202 with the placeholder row (status='evaluating').
      // Field is `data`, not `reflection` — earlier code read the wrong key.
      const response = await $fetch<{ message: string; data: Reflection }>(
        `/api/course-material/${videoId}/reflection`,
        {
          method: 'POST',
          body: { user_id: userId, body: body.trim() },
        },
      );

      const reflection = response.data;
      latest.value = reflection;
      history.value = [...history.value, reflection];
      return reflection;
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status || 500;

      if (status === 503) {
        const serviceError = new Error(
          'AI analysis is temporarily unavailable. Your reflection was not saved — try again in a minute.',
        ) as ReflectionServiceUnavailableError;
        serviceError.code = 'service_unavailable';
        error.value = serviceError.message;
        throw serviceError;
      }

      const message =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Failed to submit reflection.';
      error.value = message;
      throw new Error(message);
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Fetch full reflection history for a lesson+user pair.
   * Writes the result into `history` and returns it.
   */
  const getReflectionHistory = async (
    videoId: number,
    userId: number,
  ): Promise<Reflection[]> => {
    error.value = null;
    try {
      const response = await $fetch<{ count: number; data: Reflection[] }>(
        `/api/course-material/${videoId}/reflections`,
        { method: 'GET', query: { user_id: userId } },
      );
      const list = Array.isArray(response?.data) ? response.data : [];
      history.value = list;
      return list;
    } catch (err: any) {
      const message =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Failed to fetch reflection history.';
      error.value = message;
      return [];
    }
  };

  /**
   * Fetch the most-recent reflection for a lesson+user pair.
   * Writes the result into `latest` and returns it (or null).
   */
  const getLatestReflection = async (
    videoId: number,
    userId: number,
  ): Promise<Reflection | null> => {
    error.value = null;
    try {
      const response = await $fetch<{ data: Reflection | null }>(
        `/api/course-material/${videoId}/reflection/latest`,
        { method: 'GET', query: { user_id: userId } },
      );
      latest.value = response?.data ?? null;
      return latest.value;
    } catch (err: any) {
      const message =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Failed to fetch latest reflection.';
      error.value = message;
      return null;
    }
  };

  return {
    // state
    isSubmitting,
    history,
    latest,
    error,
    // actions
    submitReflection,
    getReflectionHistory,
    getLatestReflection,
  };
};
