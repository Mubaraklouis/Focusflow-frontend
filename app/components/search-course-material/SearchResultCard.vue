<script setup lang="ts">
import type { YouTubeSearchResult } from '~/interfaces/search-course-material';
import { ExternalLink } from 'lucide-vue-next';

/**
 * @module components/search-course-material/SearchResultCard
 * Renders a single YouTube search result inside the search dialog.
 */

defineProps<{
  result: YouTubeSearchResult;
}>();
</script>

<template>
  <a
    :href="`https://www.youtube.com/watch?v=${result.videoId}`"
    target="_blank"
    rel="noopener noreferrer"
    class="group flex gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-muted/60 hover:shadow-sm dark:hover:bg-white/[0.04]"
  >
    <!-- Thumbnail -->
    <div class="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-muted dark:bg-white/[0.06]">
      <img
        :src="result.thumbnail"
        :alt="result.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
      <!-- Play overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
        <div class="scale-0 rounded-full bg-white/90 p-1.5 shadow-md transition-transform duration-200 group-hover:scale-100">
          <svg class="h-4 w-4 text-black" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
      <p class="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
        {{ result.title }}
      </p>
      <p class="truncate text-xs text-muted-foreground">
        {{ result.channelTitle }}
      </p>
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground/80">
        <ExternalLink class="h-3 w-3" />
        <span>youtube.com</span>
      </div>
    </div>
  </a>
</template>
