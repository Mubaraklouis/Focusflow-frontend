<script setup lang="ts">
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
import { Search, Youtube, Loader2 } from 'lucide-vue-next';
import SearchResultCard from '~/components/search-course-material/SearchResultCard.vue';
import { useSearchCourseMaterial } from '~/composables/search-course-material/useSearchCourseMaterial';

/**
 * @module components/search-course-material/SearchCourseMaterialDialog
 * Dialog that lets users search for course materials on YouTube.
 */

const { isOpen, state, reset, search } = useSearchCourseMaterial();

const handleOpenChange = (value: boolean) => {
  isOpen.value = value;

  if (!value) {
    reset();
  }
};

const handleSubmit = () => {
  search();
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <!-- Trigger — exposed via slot so parent controls the button -->
    <DialogTrigger>
      <slot>
        <Button variant="outline" size="sm" class="gap-2">
          <Youtube class="h-4 w-4" />
          Search YouTube
        </Button>
      </slot>
    </DialogTrigger>

    <!-- Dialog body -->
    <DialogContent class="max-w-2xl overflow-hidden">
      <!-- Clean header -->
      <div class="relative px-6 pb-5 pt-7">
        <DialogClose />

        <div class="flex items-start gap-4">
          <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border/60 dark:ring-white/10">
            <Youtube class="h-5 w-5 text-primary" />
          </div>
          <div class="min-w-0">
            <DialogTitle class="text-lg font-bold tracking-tight">
              Search YouTube
            </DialogTitle>
            <DialogDescription class="mt-0.5">
              Find video lessons and tutorials to enrich your course.
            </DialogDescription>
          </div>
        </div>

        <!-- Search form -->
        <form class="mt-5 flex gap-2" @submit.prevent="handleSubmit">
          <div class="relative flex-1">
            <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              v-model="state.query"
              placeholder="Search for videos, tutorials, lectures..."
              class="h-11 rounded-xl bg-background pl-10 shadow-sm ring-1 ring-border placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-background dark:ring-white/[0.08]"
            />
          </div>
          <Button
            type="submit"
            :disabled="state.loading || !state.query.trim()"
            class="h-11 gap-2 rounded-xl px-5 shadow-sm"
          >
            <Loader2 v-if="state.loading" class="h-4 w-4 animate-spin" />
            <Search v-else class="h-4 w-4" />
            <span class="hidden sm:inline">Search</span>
          </Button>
        </form>
      </div>

      <!-- Divider -->
      <div class="mx-6 border-b border-border/40 dark:border-white/[0.06]" />

      <!-- Results area -->
      <div class="max-h-[400px] min-h-[180px] overflow-y-auto px-6 py-4">
        <!-- Loading -->
        <div v-if="state.loading" class="flex flex-col items-center justify-center gap-3 py-16">
          <div class="relative">
            <div class="h-10 w-10 animate-spin rounded-full border-[3px] border-muted border-t-primary dark:border-white/10 dark:border-t-primary" />
          </div>
          <p class="text-sm font-medium text-muted-foreground">Searching YouTube...</p>
        </div>

        <!-- Error -->
        <div v-else-if="state.error" class="flex flex-col items-center gap-3 rounded-xl bg-destructive/5 p-6 text-center dark:bg-destructive/10">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
            <Search class="h-5 w-5 text-destructive" />
          </div>
          <p class="text-sm text-destructive">{{ state.error }}</p>
        </div>

        <!-- Results list -->
        <div v-else-if="state.results.length > 0" class="space-y-2">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {{ state.results.length }} results found
          </p>
          <SearchResultCard
            v-for="result in state.results"
            :key="result.videoId"
            :result="result"
          />
        </div>

        <!-- Empty state after searching -->
        <div v-else-if="state.hasSearched" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted dark:bg-white/[0.06]">
            <Search class="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p class="text-sm font-semibold text-card-foreground">No results found</p>
            <p class="mt-1 text-xs text-muted-foreground">Try a different keyword or a broader search term.</p>
          </div>
        </div>

        <!-- Default empty state -->
        <div v-else class="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div class="relative">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-white/[0.06]">
              <Youtube class="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 shadow-sm ring-2 ring-card dark:bg-primary/25">
              <Search class="h-3 w-3 text-primary" />
            </div>
          </div>
          <div>
            <p class="text-sm font-semibold text-card-foreground">Search for course materials</p>
            <p class="mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
              Type a topic, keyword, or course name above to discover relevant YouTube content.
            </p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
