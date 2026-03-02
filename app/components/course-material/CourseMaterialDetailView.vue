<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Video,
  Youtube,
} from 'lucide-vue-next';
import { useCourseMaterialDetail } from '~/composables/course-material/useCourseMaterialDetail';
import SearchCourseMaterialDialog from '~/components/search-course-material/SearchCourseMaterialDialog.vue';

/**
 * @module components/course-material/CourseMaterialDetailView
 * Pure UI renderer for course material details.
 */

const {
  loading,
  error,
  course,
  activeTab,
  currentVideo,
  youtubeEmbedUrl,
  totalLessons,
  computedProgress,
  currentResources,
  toggleModule,
  isModuleExpanded,
  playLesson,
  loadCourse,
} = useCourseMaterialDetail();

const hasNoMaterials = computed(() => {
  if (!course.value) return false;
  return course.value.modules.length === 0 || totalLessons.value === 0;
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center gap-3 rounded-xl bg-card p-8 text-sm text-muted-foreground shadow-sm">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Loading course materials...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-xl bg-destructive/5 p-8 text-sm text-destructive"
    >
      <p>{{ error }}</p>
      <Button variant="outline" class="mt-4" @click="loadCourse">Try Again</Button>
    </div>

    <!-- Not found state -->
    <div v-else-if="!course" class="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
      Course was not found.
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <NuxtLink to="/courses">
              <Button variant="ghost" size="sm" class="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft class="h-4 w-4" />
                Back
              </Button>
            </NuxtLink>
            <span
              class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {{ computedProgress }}% Complete
            </span>
          </div>
          <h1 class="text-2xl font-bold text-foreground md:text-3xl">{{ course.title }}</h1>
          <div class="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <BookOpen class="h-4 w-4" />
              {{ course.modules.length }} Modules
            </span>
            <span class="flex items-center gap-1.5">
              <Video class="h-4 w-4" />
              {{ totalLessons }} Lessons
            </span>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
          :style="{ width: `${computedProgress}%` }"
        />
      </div>

      <!-- Empty course materials state -->
      <div v-if="hasNoMaterials" class="flex flex-col items-center justify-center gap-8 overflow-hidden rounded-2xl bg-card py-24 shadow-sm">
        <div class="relative">
          <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
            <Youtube class="h-12 w-12 text-primary" />
          </div>
          <div class="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-md ring-1 ring-border/50">
            <BookOpen class="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div class="max-w-md text-center">
          <h2 class="text-2xl font-bold tracking-tight text-card-foreground">No Course Materials Yet</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
            This course doesn't have any learning materials. Search YouTube to discover
            video lessons, tutorials, and lectures to build your curriculum.
          </p>
        </div>
        <SearchCourseMaterialDialog>
          <Button size="lg" class="h-12 gap-2.5 rounded-xl px-8 text-base shadow-md">
            <Youtube class="h-5 w-5" />
            Search Course Materials
          </Button>
        </SearchCourseMaterialDialog>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Video player column -->
        <div class="lg:col-span-2">
          <Card class="overflow-hidden border-0 shadow-md">
            <CardContent class="p-0">
              <!-- Video embed -->
              <div v-if="youtubeEmbedUrl" class="relative h-0 overflow-hidden pb-[56.25%]">
                <iframe
                  class="absolute left-0 top-0 h-full w-full"
                  :src="youtubeEmbedUrl"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
              </div>

              <!-- Placeholder -->
              <div v-else class="flex min-h-[280px] flex-col items-center justify-center gap-3 bg-muted/60 p-6">
                <PlayCircle class="h-12 w-12 text-muted-foreground/50" />
                <p class="text-sm text-muted-foreground">Select a lesson from the playlist to start watching.</p>
              </div>

              <!-- Video info area -->
              <div class="p-5 md:p-6">
                <div class="flex flex-col gap-1">
                  <h2 class="line-clamp-2 text-lg font-bold text-card-foreground sm:text-xl md:text-2xl">
                    {{ currentVideo.title || 'Course Overview' }}
                  </h2>
                  <p class="text-sm text-muted-foreground">{{ currentVideo.module || 'No active module' }}</p>
                </div>

                <!-- Tabs -->
                <div class="mt-5">
                  <div class="flex w-full gap-1 overflow-x-auto">
                    <button
                      class="rounded-lg px-4 py-2 text-sm transition-colors"
                      :class="activeTab === 'description' ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'"
                      @click="activeTab = 'description'"
                    >
                      Description
                    </button>
                    <button
                      class="rounded-lg px-4 py-2 text-sm transition-colors"
                      :class="activeTab === 'resources' ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'"
                      @click="activeTab = 'resources'"
                    >
                      Resources
                    </button>
                  </div>
                </div>

                <!-- Tab content -->
                <div class="mt-4 h-52 overflow-y-auto text-sm">
                  <div v-if="activeTab === 'description'" class="space-y-3 leading-relaxed text-card-foreground">
                    <p>{{ course.description || 'No course description available yet.' }}</p>
                  </div>

                  <div v-else class="space-y-2 text-card-foreground">
                    <div
                      v-if="currentResources.length === 0"
                      class="rounded-lg bg-muted/40 p-4 text-center text-muted-foreground"
                    >
                      No lesson resources available.
                    </div>

                    <a
                      v-for="resource in currentResources"
                      :key="resource.id"
                      :href="resource.url || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-accent"
                    >
                      <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <BookOpen class="h-4 w-4 text-primary" />
                      </div>
                      <span class="text-sm font-medium">{{ resource.title }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Playlist sidebar -->
        <div class="lg:col-span-1">
          <Card class="overflow-hidden border-0 shadow-md lg:min-h-[600px]">
            <CardContent class="p-0">
              <!-- Playlist header -->
              <div class="sticky top-0 z-10 flex items-center justify-between bg-card px-4 py-3.5">
                <div class="flex items-center gap-2">
                  <PlayCircle class="h-5 w-5 text-primary" />
                  <h3 class="text-sm font-semibold text-card-foreground">Course Playlist</h3>
                </div>
                <div class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {{ computedProgress }}%
                </div>
              </div>

              <!-- Module list -->
              <div class="h-[calc(600px-52px)] overflow-y-auto">
                <div v-for="(moduleItem, idx) in course.modules" :key="moduleItem.id" class="px-2">
                  <!-- Module header button -->
                  <button
                    class="flex w-full items-center justify-between rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/50"
                    :class="idx > 0 ? 'mt-1' : ''"
                    @click="toggleModule(moduleItem.id)"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ChevronDown v-if="isModuleExpanded(moduleItem.id)" class="h-3.5 w-3.5 text-primary transition-transform" />
                        <ChevronRight v-else class="h-3.5 w-3.5 text-primary transition-transform" />
                      </div>
                      <div>
                        <div class="text-sm font-medium text-card-foreground">{{ moduleItem.title }}</div>
                        <div class="text-xs text-muted-foreground">{{ moduleItem.lessons.length }} lessons</div>
                      </div>
                    </div>
                    <CheckCircle2 v-if="moduleItem.completed" class="h-4 w-4 flex-shrink-0 text-primary" />
                  </button>

                  <!-- Lessons list -->
                  <div v-if="isModuleExpanded(moduleItem.id)" class="mb-2 space-y-1 pb-2 pl-2">
                    <button
                      v-for="lesson in moduleItem.lessons"
                      :key="lesson.id"
                      class="relative flex w-full items-center gap-2 overflow-hidden rounded-lg text-left transition-all duration-200"
                      :class="currentVideo.id === lesson.videoId ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-muted/60'"
                      @click="playLesson(moduleItem.id, lesson.id)"
                    >
                      <!-- Thumbnail -->
                      <div class="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md sm:w-22">
                        <img
                          :src="`https://i.ytimg.com/vi/${lesson.videoId}/mqdefault.jpg`"
                          :alt="lesson.title"
                          class="h-full w-full object-cover"
                        >
                        <div class="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] leading-4 text-white">
                          {{ lesson.duration }}
                        </div>
                      </div>

                      <!-- Lesson info -->
                      <div class="min-w-0 flex-1 py-1.5 pr-7">
                        <p class="truncate text-xs font-medium sm:text-sm" :class="currentVideo.id === lesson.videoId ? 'text-primary' : 'text-card-foreground'">
                          {{ lesson.title }}
                        </p>
                      </div>

                      <!-- Completed badge -->
                      <div class="absolute right-2 top-1/2 -translate-y-1/2">
                        <CheckCircle2 v-if="lesson.completed" class="h-3.5 w-3.5 text-primary" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
