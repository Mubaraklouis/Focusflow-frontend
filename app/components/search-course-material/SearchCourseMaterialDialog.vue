<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Link2,
  ListMusic,
  Loader2,
  Plus,
  Search,
  Youtube,
} from 'lucide-vue-next';
import type {
  CourseMaterialImportMode,
  YouTubeSearchResult,
} from '~/interfaces/search-course-material';
import SearchResultCard from '~/components/search-course-material/SearchResultCard.vue';
import { useSearchCourseMaterial } from '~/composables/search-course-material/useSearchCourseMaterial';
import { usePlaylistImport } from '~/composables/search-course-material/usePlaylistImport';
import { useSingleUrlImport } from '~/composables/search-course-material/useSingleUrlImport';
import { useAddCourseMaterials } from '~/composables/search-course-material/useAddCourseMaterials';

/**
 * @module components/search-course-material/SearchCourseMaterialDialog
 *
 * Tabbed import dialog with three modes:
 *   1. Search   — keyword search against the YouTube Data API
 *   2. Playlist — paste a playlist URL and bulk-add every video
 *   3. URL      — paste a single video URL
 *
 * The dialog is owned by the parent (course detail). It receives the
 * `courseId` of the course the lessons should be attached to, plus a callback
 * to fire after a successful save (typically a `loadCourse()` reload).
 */

const props = defineProps<{
  /** Course the imported videos will be attached to. */
  courseId: string | number;
}>();

const emit = defineEmits<{
  (e: 'added', count: number): void;
}>();

const isOpen = ref<boolean>(false);
const mode = ref<CourseMaterialImportMode>('search');

// --- mode-specific composables ---------------------------------------------
const search = useSearchCourseMaterial();
const playlist = usePlaylistImport();
const single = useSingleUrlImport();
const add = useAddCourseMaterials();

// --- multi-select state shared across modes --------------------------------
// We key selections by `videoId`. The actual ordered list of selected
// objects is derived by walking the current visible results in order.
const selectedIds = ref<Set<string>>(new Set());

const toggleSelect = (videoId: string) => {
  if (!videoId) return;
  const next = new Set(selectedIds.value);
  if (next.has(videoId)) {
    next.delete(videoId);
  } else {
    next.add(videoId);
  }
  selectedIds.value = next;
};

const isSelected = (videoId: string) => selectedIds.value.has(videoId);

const visibleResults = computed<YouTubeSearchResult[]>(() => {
  if (mode.value === 'search') return search.state.results;
  if (mode.value === 'playlist') return playlist.state.results;
  if (mode.value === 'single' && single.state.result) return [single.state.result];
  return [];
});

const selectedItems = computed<YouTubeSearchResult[]>(() =>
  visibleResults.value.filter((r) => selectedIds.value.has(r.videoId)),
);

const canSave = computed(
  () => selectedItems.value.length > 0 && !!props.courseId && !add.isSaving.value,
);

// --- lifecycle reset -------------------------------------------------------
const resetAll = () => {
  search.reset();
  playlist.reset();
  single.reset();
  add.error.value = null;
  selectedIds.value = new Set();
};

const handleOpenChange = (value: boolean) => {
  isOpen.value = value;
  if (!value) resetAll();
};

// When the mode changes, drop selections from the previous mode so the
// counter is honest. (Switching tabs is a strong signal of starting over.)
watch(mode, () => {
  selectedIds.value = new Set();
  add.error.value = null;
});

// --- actions ---------------------------------------------------------------
const submitSearch = () => search.search();
const submitPlaylist = () => playlist.fetchPlaylist();
const submitSingle = () => single.fetchVideo();

const handleAdd = async () => {
  if (!canSave.value) return;
  const result = await add.save(props.courseId, selectedItems.value);
  if (result.ok) {
    emit('added', result.saved);
    isOpen.value = false;
    resetAll();
  }
};

// --- "Select all" affordance for playlist mode -----------------------------
const allVisibleSelected = computed(
  () =>
    visibleResults.value.length > 0 &&
    visibleResults.value.every((r) => selectedIds.value.has(r.videoId)),
);

const toggleSelectAll = () => {
  if (allVisibleSelected.value) {
    selectedIds.value = new Set();
    return;
  }
  selectedIds.value = new Set(visibleResults.value.map((r) => r.videoId));
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogTrigger>
      <slot>
        <Button variant="outline" size="sm" class="gap-2">
          <Youtube class="h-4 w-4" />
          Add Course Materials
        </Button>
      </slot>
    </DialogTrigger>

    <DialogContent class="max-w-2xl overflow-hidden">
      <!-- Header -->
      <div class="px-6 pb-4 pt-6">
        <div class="flex items-start gap-4">
          <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border/60 dark:ring-white/10">
            <Youtube class="h-5 w-5 text-primary" />
          </div>
          <div class="min-w-0">
            <DialogTitle class="text-lg font-bold tracking-tight">
              Add Course Materials
            </DialogTitle>
            <DialogDescription class="mt-0.5">
              Search YouTube, paste a playlist URL, or paste a single video URL.
            </DialogDescription>
          </div>
        </div>

        <!-- Tabs -->
        <div class="mt-5 flex gap-1 rounded-lg bg-muted/60 p-1 dark:bg-white/[0.04]">
          <button
            type="button"
            class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            :class="mode === 'search' ? 'bg-card shadow-sm text-card-foreground' : 'text-muted-foreground hover:text-card-foreground'"
            @click="mode = 'search'"
          >
            <span class="inline-flex items-center gap-1.5"><Search class="h-3.5 w-3.5" /> Search</span>
          </button>
          <button
            type="button"
            class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            :class="mode === 'playlist' ? 'bg-card shadow-sm text-card-foreground' : 'text-muted-foreground hover:text-card-foreground'"
            @click="mode = 'playlist'"
          >
            <span class="inline-flex items-center gap-1.5"><ListMusic class="h-3.5 w-3.5" /> Paste Playlist</span>
          </button>
          <button
            type="button"
            class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            :class="mode === 'single' ? 'bg-card shadow-sm text-card-foreground' : 'text-muted-foreground hover:text-card-foreground'"
            @click="mode = 'single'"
          >
            <span class="inline-flex items-center gap-1.5"><Link2 class="h-3.5 w-3.5" /> Paste URL</span>
          </button>
        </div>
      </div>

      <!-- Mode-specific input -->
      <div class="px-6">
        <!-- SEARCH -->
        <form v-if="mode === 'search'" class="flex gap-2" @submit.prevent="submitSearch">
          <div class="relative flex-1">
            <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              v-model="search.state.query"
              placeholder="Search for videos, tutorials, lectures..."
              class="h-11 rounded-xl pl-10"
            />
          </div>
          <Button
            type="submit"
            :disabled="search.state.loading || !search.state.query.trim()"
            class="h-11 gap-2 rounded-xl px-5"
          >
            <Loader2 v-if="search.state.loading" class="h-4 w-4 animate-spin" />
            <Search v-else class="h-4 w-4" />
            <span class="hidden sm:inline">Search</span>
          </Button>
        </form>

        <!-- PLAYLIST -->
        <form v-else-if="mode === 'playlist'" class="flex flex-col gap-2 sm:flex-row" @submit.prevent="submitPlaylist">
          <div class="relative flex-1">
            <ListMusic class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              v-model="playlist.state.url"
              placeholder="https://www.youtube.com/playlist?list=PL..."
              class="h-11 rounded-xl pl-10"
            />
          </div>
          <Button
            type="submit"
            :disabled="playlist.state.loading || !playlist.state.url.trim()"
            class="h-11 gap-2 rounded-xl px-5"
          >
            <Loader2 v-if="playlist.state.loading" class="h-4 w-4 animate-spin" />
            <ListMusic v-else class="h-4 w-4" />
            <span class="hidden sm:inline">Load playlist</span>
          </Button>
        </form>

        <!-- SINGLE -->
        <form v-else class="flex flex-col gap-2 sm:flex-row" @submit.prevent="submitSingle">
          <div class="relative flex-1">
            <Link2 class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              v-model="single.state.url"
              placeholder="https://www.youtube.com/watch?v=..."
              class="h-11 rounded-xl pl-10"
            />
          </div>
          <Button
            type="submit"
            :disabled="single.state.loading || !single.state.url.trim()"
            class="h-11 gap-2 rounded-xl px-5"
          >
            <Loader2 v-if="single.state.loading" class="h-4 w-4 animate-spin" />
            <Link2 v-else class="h-4 w-4" />
            <span class="hidden sm:inline">Load video</span>
          </Button>
        </form>
      </div>

      <!-- Divider -->
      <div class="mx-6 mt-5 border-b border-border/40 dark:border-white/[0.06]" />

      <!-- Results area -->
      <div class="max-h-[360px] min-h-[180px] overflow-y-auto px-6 py-4">
        <!-- Mode-specific loading / error / results -->
        <template v-if="mode === 'search'">
          <div v-if="search.state.loading" class="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
            <p class="text-sm text-muted-foreground">Searching YouTube…</p>
          </div>
          <div v-else-if="search.state.error" class="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
            {{ search.state.error }}
          </div>
          <div v-else-if="search.state.results.length > 0" class="space-y-2">
            <div class="mb-2 flex items-center justify-between text-xs">
              <span class="font-medium uppercase tracking-wider text-muted-foreground">
                {{ search.state.results.length }} results — {{ selectedItems.length }} selected
              </span>
            </div>
            <SearchResultCard
              v-for="result in search.state.results"
              :key="result.videoId"
              :result="result"
              :selected="isSelected(result.videoId)"
              @toggle="toggleSelect"
            />
          </div>
          <div v-else-if="search.state.hasSearched" class="py-10 text-center text-sm text-muted-foreground">
            No results. Try a broader keyword.
          </div>
          <div v-else class="py-10 text-center text-sm text-muted-foreground">
            Type a topic above to discover videos.
          </div>
        </template>

        <template v-else-if="mode === 'playlist'">
          <div v-if="playlist.state.loading" class="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
            <p class="text-sm text-muted-foreground">Loading playlist…</p>
          </div>
          <div v-else-if="playlist.state.error" class="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
            {{ playlist.state.error }}
          </div>
          <div v-else-if="playlist.state.results.length > 0" class="space-y-2">
            <div class="mb-2 flex items-center justify-between text-xs">
              <span class="font-medium uppercase tracking-wider text-muted-foreground">
                {{ playlist.state.results.length }} videos — {{ selectedItems.length }} selected
              </span>
              <button
                type="button"
                class="text-xs font-medium text-primary hover:underline"
                @click="toggleSelectAll"
              >
                {{ allVisibleSelected ? 'Deselect all' : 'Select all' }}
              </button>
            </div>
            <SearchResultCard
              v-for="result in playlist.state.results"
              :key="result.videoId"
              :result="result"
              :selected="isSelected(result.videoId)"
              @toggle="toggleSelect"
            />
          </div>
          <div v-else-if="playlist.state.hasFetched" class="py-10 text-center text-sm text-muted-foreground">
            No videos in that playlist.
          </div>
          <div v-else class="py-10 text-center text-sm text-muted-foreground">
            Paste a YouTube playlist URL above. We'll list every video so you can pick which to add.
          </div>
        </template>

        <template v-else>
          <div v-if="single.state.loading" class="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
            <p class="text-sm text-muted-foreground">Looking up video…</p>
          </div>
          <div v-else-if="single.state.error" class="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
            {{ single.state.error }}
          </div>
          <div v-else-if="single.state.result" class="space-y-2">
            <SearchResultCard
              :result="single.state.result"
              :selected="isSelected(single.state.result.videoId)"
              @toggle="toggleSelect"
            />
          </div>
          <div v-else class="py-10 text-center text-sm text-muted-foreground">
            Paste a YouTube watch URL or a youtu.be link above.
          </div>
        </template>
      </div>

      <!-- Footer with Add button -->
      <div class="flex flex-col gap-2 border-t border-border/40 bg-muted/30 px-6 py-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
        <p v-if="add.error.value" class="text-xs text-destructive">{{ add.error.value }}</p>
        <p v-else class="text-xs text-muted-foreground">
          {{ selectedItems.length }} selected — click a card to add or remove.
        </p>
        <div class="flex items-center gap-2">
          <DialogClose as-child>
            <Button variant="ghost" :disabled="add.isSaving.value">Cancel</Button>
          </DialogClose>
          <Button :disabled="!canSave" class="gap-2" @click="handleAdd">
            <Loader2 v-if="add.isSaving.value" class="h-4 w-4 animate-spin" />
            <Plus v-else-if="selectedItems.length === 0" class="h-4 w-4" />
            <CheckCircle2 v-else class="h-4 w-4" />
            {{
              add.isSaving.value
                ? 'Adding…'
                : selectedItems.length === 0
                  ? 'Select videos'
                  : `Add ${selectedItems.length} to course`
            }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
