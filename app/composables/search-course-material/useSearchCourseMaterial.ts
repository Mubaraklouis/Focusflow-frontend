import { ref, reactive } from 'vue';
import type {
  SearchCourseMaterialState,
  YouTubeSearchResponse,
} from '~/interfaces/search-course-material';
import { normalizeSearchResults } from '~/composables/search-course-material/useNormalizeSearchResult';

/**
 * @module composables/search-course-material/useSearchCourseMaterial
 * State management and API integration for the YouTube course material search dialog.
 * Calls the `/api/course-material/search` server proxy which forwards to the course-material backend.
 */

/** Default number of results to request per search. */
const DEFAULT_MAX_RESULTS = 10;

/**
 * Manages open/close state, search form state, and API calls for the search dialog.
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
   * Searches YouTube videos via the server proxy.
   * Normalizes the raw backend response into UI-friendly objects.
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
      const response = await $fetch<YouTubeSearchResponse>('/api/course-material/search', {
        params: {
          query: trimmed,
          max_results: DEFAULT_MAX_RESULTS,
        },
      });

      state.results = normalizeSearchResults(response.results ?? []);
    } catch (err: any) {
      console.error('[useSearchCourseMaterial] Search failed:', err);
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
