import { ref } from 'vue';
import type { DashboardSummary } from '~/interfaces/dashboard';

/**
 * @module composables/dashboard/useDashboardSummary
 *
 * Single-purpose composable that fetches the aggregated dashboard payload
 * from the Nitro proxy `/api/dashboard/summary?user_id=X`. Returns refs
 * for the data + loading/error state and a `load(userId)` action the
 * page calls on mount and again on refresh.
 */
export const useDashboardSummary = () => {
  const summary = ref<DashboardSummary | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const load = async (userId: number) => {
    if (!userId) return;
    isLoading.value = true;
    error.value = null;
    try {
      const response = await $fetch<{ data: DashboardSummary }>('/api/dashboard/summary', {
        params: { user_id: userId },
      });
      summary.value = response?.data ?? null;
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Failed to load dashboard.';
    } finally {
      isLoading.value = false;
    }
  };

  return { summary, isLoading, error, load };
};
