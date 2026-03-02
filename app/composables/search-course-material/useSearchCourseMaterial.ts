import { ref, reactive } from 'vue';
import type {
  SearchCourseMaterialState,
  YouTubeSearchResult,
} from '~/interfaces/search-course-material';

/**
 * @module composables/search-course-material/useSearchCourseMaterial
 * UI-only state management for the YouTube course material search dialog.
 * API integration will be wired later — the composable exposes a `search()`
 * method that is currently a placeholder.
 */

/**
 * Manages open/close state and search form state for the search dialog.
 */
export const useSearchCourseMaterial = () => {
  const isOpen = ref<boolean>(false);

  const state = reactive<SearchCourseMaterialState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    hasSearched: false,
  });

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  const reset = () => {
    state.query = '';
    state.results = [];
    state.loading = false;
    state.error = null;
    state.hasSearched = false;
  };

  /**
   * Placeholder search function.
   * Will be replaced with actual API call during integration.
   */
  const search = async () => {
    const trimmed = state.query.trim();

    if (!trimmed) {
      return;
    }

    state.loading = true;
    state.error = null;
    state.hasSearched = true;

    try {
      // TODO: Replace with actual API call — e.g. $fetch('/api/courses/search-youtube', { params: { q: trimmed } })
      state.results = [];
    } catch (err: any) {
      state.error = err?.data?.message || err?.message || 'Search failed. Please try again.';
      state.results = [];
    } finally {
      state.loading = false;
    }
  };

  return {
    isOpen,
    state,
    open,
    close,
    reset,
    search,
  };
};
