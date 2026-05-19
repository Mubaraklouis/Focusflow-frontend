import { reactive } from 'vue';
import type {
  YouTubeSearchResult,
  YouTubeSearchResultRaw,
} from '~/interfaces/search-course-material';
import { normalizeSearchResult } from '~/composables/search-course-material/useNormalizeSearchResult';
import { extractVideoId, extractPlaylistId } from '~/composables/search-course-material/useYouTubeUrl';

/**
 * @module composables/search-course-material/useSingleUrlImport
 * Single-video flow. Paste any YouTube URL → extract the video id →
 * call `/api/course-material/lookup` (1 quota unit) → present a single
 * result the user can add to the course.
 */

export interface SingleUrlImportState {
  url: string;
  loading: boolean;
  error: string | null;
  result: YouTubeSearchResult | null;
  hasFetched: boolean;
}

export const useSingleUrlImport = () => {
  const state = reactive<SingleUrlImportState>({
    url: '',
    loading: false,
    error: null,
    result: null,
    hasFetched: false,
  });

  const reset = () => {
    state.url = '';
    state.loading = false;
    state.error = null;
    state.result = null;
    state.hasFetched = false;
  };

  const fetchVideo = async () => {
    state.error = null;
    state.result = null;

    const videoId = extractVideoId(state.url);
    if (!videoId) {
      const playlistOnly = extractPlaylistId(state.url);
      state.error = playlistOnly
        ? 'That looks like a playlist URL — use the "Paste Playlist" tab instead.'
        : 'Could not detect a YouTube video id. Paste a watch or youtu.be URL.';
      return;
    }

    state.loading = true;
    state.hasFetched = true;

    try {
      const response = await $fetch<{ data: YouTubeSearchResultRaw }>(
        '/api/course-material/lookup',
        { params: { youtube_id: videoId } },
      );
      if (!response?.data?.youtube_id) {
        state.error = 'Video not found or has been deleted.';
        return;
      }
      state.result = normalizeSearchResult(response.data);
    } catch (err: any) {
      state.error = err?.data?.message || err?.message || 'Failed to look up video.';
    } finally {
      state.loading = false;
    }
  };

  return { state, reset, fetchVideo };
};
