<script setup lang="ts">
import type { YouTubeSearchResult } from '~/interfaces/search-course-material';
import { CheckCircle2, Plus } from 'lucide-vue-next';

/**
 * @module components/search-course-material/SearchResultCard
 * A single YouTube result row. Acts as a selectable toggle rather than a
 * link out — clicking it adds/removes the video from the dialog's
 * selection set. The parent owns selection state.
 */

defineProps<{
  result: YouTubeSearchResult;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', videoId: string): void;
}>();

const onClick = (result: YouTubeSearchResult) => {
  if (!result.videoId) return;
  emit('toggle', result.videoId);
};
</script>

<template>
  <button
    type="button"
    class="group flex w-full gap-3 rounded-xl border p-2.5 text-left transition-all duration-200"
    :class="
      selected
        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/30'
        : 'border-transparent hover:border-border/60 hover:bg-muted/60 dark:hover:bg-white/[0.04]'
    "
    @click="onClick(result)"
  >
    <!-- Thumbnail -->
    <div class="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-muted dark:bg-white/[0.06]">
      <img
        v-if="result.thumbnail"
        :src="result.thumbnail"
        :alt="result.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
      <div v-else class="flex h-full w-full items-center justify-center">
        <svg class="h-8 w-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      <!-- Selection overlay -->
      <div
        v-if="selected"
        class="absolute inset-0 flex items-center justify-center bg-primary/30"
      >
        <div class="rounded-full bg-primary p-1.5 shadow-md">
          <CheckCircle2 class="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
      <p
        class="line-clamp-2 text-sm font-semibold leading-snug transition-colors"
        :class="selected ? 'text-primary' : 'text-card-foreground group-hover:text-primary'"
      >
        {{ result.title }}
      </p>
      <p class="truncate text-xs text-muted-foreground">{{ result.channelTitle }}</p>
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground/80">
        <CheckCircle2 v-if="selected" class="h-3 w-3 text-primary" />
        <Plus v-else class="h-3 w-3" />
        <span>{{ selected ? 'Selected' : 'Click to add' }}</span>
      </div>
    </div>
  </button>
</template>
