import { ref, reactive } from 'vue';
import type {
  YouTubeSearchResultRaw,
  YouTubeSearchResult,
  YouTubeSearchResponse,
} from '~/interfaces/search-course-material';
import { normalizeSearchResults } from '~/composables/search-course-material/useNormalizeSearchResult';
import { extractPlaylistId, extractVideoId } from '~/composables/search-course-material/useYouTubeUrl';

/**
 * @module composables/search-course-material/usePlaylistImport
 * Drives the "paste a playlist URL" flow:
 *
 *   1. user pastes a URL containing `?list=...`
 *   2. we extract the playlist id client-side
 *   3. we call `/api/course-material/playlist` to expand it into videos
 *   4. results render the same way as search results so the same multi-select
 *      Add flow can be reused.
 */

export interface PlaylistImportState {
  url: string;
  loading: boolean;
  error: string | null;
  results: YouTubeSearchResult[];
  hasFetched: boolean;
}

export const usePlaylistImport = () => {
  const state = reactive<PlaylistImportState>({
    url: '',
    loading: false,
    error: null,
    results: [],
    hasFetched: false,
  });

  const reset = () => {
    state.url = '';
    state.loading = false;
    state.error = null;
    state.results = [];
    state.hasFetched = false;
  };

  const fetchPlaylist = async () => {
    state.error = null;

    const playlistId = extractPlaylistId(state.url);
    if (!playlistId) {
      // Friendly hint if the user pasted a single-video URL instead.
      const videoOnly = extractVideoId(state.url);
      state.error = videoOnly
        ? 'That looks like a single video URL — use the "Paste URL" tab instead.'
        : 'Could not detect a playlist id. Paste a full YouTube playlist URL.';
      return;
    }

    state.loading = true;
    state.hasFetched = true;

    try {
      const response = await $fetch<YouTubeSearchResponse>('/api/course-material/playlist', {
        params: { playlist_id: playlistId, max_results: 50 },
      });
      state.results = normalizeSearchResults(
        (response?.results ?? []) as YouTubeSearchResultRaw[],
      );
      if (state.results.length === 0) {
        state.error = 'Playlist was reachable but contained no videos.';
      }
    } catch (err: any) {
      state.results = [];
      state.error = err?.data?.message || err?.message || 'Failed to expand playlist.';
    } finally {
      state.loading = false;
    }
  };

  return { state, reset, fetchPlaylist };
};
