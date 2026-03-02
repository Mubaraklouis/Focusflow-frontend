Implementation 001

Can you implment intergrate this into course detail page 

The implmentation should follow the code base guild line

1. use jsdoc documentation
2. follow the folder structure course material just have a folder in components ,pages, interface,composable 
3.each composabe or function should be in it's own file with less line of code the code should be radable and 
maintainable 

Use this design  

make sure the course detail page should not have any functionality



<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { Button } from '@/components/ui/button';
// Toast import removed as it's not currently used
import { Head } from '@inertiajs/vue3';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  PlayCircle,
  StickyNote,
  Video,
  Maximize2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Trophy,
  Star,
  Sparkles,
  Settings,
} from 'lucide-vue-next';
import type { BreadcrumbItemType } from '@/types';

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
});

// Active tab state
const activeTab = ref<string>('playlist');

// Track current video
const currentVideo = ref({
  id: props.course.modules[0]?.lessons[0]?.video_id || '',
  title: props.course.modules[0]?.lessons[0]?.title || '',
  duration: props.course.modules[0]?.lessons[0]?.duration || '0:00',
  completed: props.course.modules[0]?.lessons[0]?.completed || false,
  module: props.course.modules[0]?.title || ''
});

// Track progress saving state
const isSavingProgress = ref(false);

// Celebration state
const showCelebration = ref(false);
const showCourseCompletion = ref(false);
const celebrationMessage = ref('');
const audioLoaded = ref(false);

// Celebration quotes for individual lessons
const celebrationQuotes = [
  "Congrats! Keep fighting hard – every small victory builds your success story!",
  "Challenge conquered! Fight harder for the next one!",
  "Well done! Your persistence is your superpower – keep fighting!",
  "Another milestone achieved! Fight hard, dream big!",
  "Victory! Your dedication today creates your success tomorrow!"
];

// Inspirational quotes for course completion
const courseCompletionQuotes = [
  "Congratulations on completing the entire course! Your dedication and perseverance have paid off!",
  "You've conquered this entire course! Your commitment to growth is truly inspiring!",
  "Course completed! This achievement represents countless hours of focus and determination!",
  "You've mastered the entire course! This is just the beginning of your journey to greatness!",
  "Course complete! Your fighting spirit has carried you through to the finish line!"
];

// Calculate overall progress and check if course is completed
const progress = computed(() => {
  const totalLessons = props.course.modules.reduce(
    (acc, module) => acc + module.lessons.length, 0
  );
  const completedLessons = props.course.modules.reduce(
    (acc, module) => acc + module.lessons.filter(lesson => lesson.completed).length, 0
  );

  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
});

// Course completion status is used in the UI via the progress value
// const isCourseCompleted = computed(() => progress.value === 100);

// Method to play a lesson
const playLesson = (moduleId: number, lessonId: number) => {
  const module = props.course.modules.find(m => m.id === moduleId);
  if (module) {
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      currentVideo.value = {
        id: lesson.video_id,
        title: lesson.title,
        duration: lesson.duration,
        completed: lesson.completed,
        module: module.title
      };
    }
  }
};

// Toggle module collapse
const expandedModules = ref<number[]>(props.course.modules[0]?.id ? [props.course.modules[0].id] : []);

const toggleModule = (moduleId: number) => {
  const index = expandedModules.value.indexOf(moduleId);
  if (index === -1) {
    expandedModules.value.push(moduleId);
  } else {
    expandedModules.value.splice(index, 1);
  }
};

const isModuleExpanded = (moduleId: number) => {
  return expandedModules.value.includes(moduleId);
};

// Mark lesson as completed
const markLessonCompleted = (moduleId: number, lessonId: number) => {
  const module = props.course.modules.find(m => m.id === moduleId);
  if (module) {
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      // Only proceed if we're marking as completed (not toggling off)
      if (!lesson.completed) {
        // Set completed status
        lesson.completed = true;
        currentVideo.value.completed = true;

        // Check if all lessons in module are completed
        const allCompleted = module.lessons.every(l => l.completed);
        module.completed = allCompleted;

        // Send the request to the backend to update lesson progress
        router.post('/lesson/progress', {
          completed: true,
          lesson_id: lessonId
        }, {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            // Check if the course is now 100% complete
            if (progress.value === 100) {
              // Show course completion celebration
              celebrationMessage.value = courseCompletionQuotes[Math.floor(Math.random() * courseCompletionQuotes.length)];
              showCourseCompletion.value = true;

              // Play cheering sound
              if (audioLoaded.value && window.FocusFlowAudio) {
                window.FocusFlowAudio.playCheering();
              }
            } else {
              // Show regular lesson completion celebration
              celebrationMessage.value = celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)];
              showCelebration.value = true;
            }

            console.log('Lesson progress updated successfully');
          },
          onError: (errors) => {
            // Revert local state if the API call fails
            lesson.completed = false;
            currentVideo.value.completed = false;
            console.error('Failed to update lesson progress:', errors);
          }
        });
      } else {
        // If already completed, toggle back to incomplete
        lesson.completed = false;
        currentVideo.value.completed = false;

        // Send the request to the backend to update lesson progress
        router.post('/lesson/progress', {
          completed: false,
          lesson_id: lessonId
        }, {
          preserveState: true,
          preserveScroll: true
        });
      }
    }
  }
};

// Generate YouTube embed URL
const youtubeEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${currentVideo.value.id}?autoplay=0&rel=0&modestbranding=1`;
});

// Load audio helper
onMounted(() => {
  // Dynamically load the audio helper script
  const script = document.createElement('script');
  script.src = '/sounds/audio-helper.js';
  script.async = true;
  script.onload = () => {
    audioLoaded.value = true;
    console.log('Audio helper loaded successfully');
  };
  script.onerror = (error) => {
    console.error('Failed to load audio helper:', error);
  };
  document.head.appendChild(script);
});

// Define breadcrumbs for page navigation
const breadcrumbs: BreadcrumbItemType[] = [
  {
    title: 'Courses',
    href: '/courses'
  },
  {
    title: props.course.title,
    href: `/courses/detail?id=${props.course.id}`
  }
];
</script>

<template>
  <Head>
    <title>{{ course.title }} | FocusFlow</title>
  </Head>
  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="container mx-auto px-4 py-6">
      <!-- Course header -->
      <div class="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <Button variant="outline" size="sm" class="h-8" as="a" href="/courses">
              <ArrowLeft class="h-4 w-4 mr-1" />
              Back to Courses
            </Button>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:text-primary-foreground/90 border border-primary/20">
              {{ progress }}% Complete
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold text-foreground dark:text-white">{{ course.title }}</h1>
          <div class="flex items-center text-muted-foreground dark:text-gray-300 mt-2 text-sm gap-4">
            <span class="flex items-center">
              <BookOpen class="h-4 w-4 mr-1" />
              {{ course.modules.length }} Modules
            </span>
            <span class="flex items-center">
              <Video class="h-4 w-4 mr-1" />
              {{ course.modules.reduce((acc, module) => acc + module.lessons.length, 0) }} Lessons
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-9 px-4 transition-all duration-200 hover:bg-primary/10 dark:hover:bg-primary/20 border-primary/40 dark:border-primary/60 dark:text-white dark:bg-card/90"
          >
            <StickyNote class="h-4 w-4 mr-1.5" />
            Add Note
          </Button>
          <Button
            variant="default"
            size="sm"
            @click="router.visit('/focus')"
            class="h-9 px-4 transition-all duration-200 bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/80 shadow-sm dark:shadow-primary/30"
          >
            <Maximize2 class="h-4 w-4 mr-1.5" />
            Focus Mode
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="router.visit(`/courses/settings?id=${course.uuid}`)"
            class="h-9 px-4 transition-all duration-200 hover:bg-primary/10 dark:hover:bg-primary/20 border-primary/40 dark:border-primary/60 dark:text-white dark:bg-card/90"
          >
            <Settings class="h-4 w-4 mr-1.5" />
            Course Settings
          </Button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-muted rounded-full h-2 mb-8">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>

      <!-- Main content area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Video player column -->
        <div class="lg:col-span-2">
          <Card class="border shadow-sm dark:shadow-md dark:shadow-background/10">
            <CardContent class="p-0">
              <!-- Video player -->
              <div class="relative pb-[56.25%] h-0 overflow-hidden rounded-t-lg">
                <iframe
                  class="absolute top-0 left-0 w-full h-full"
                  :src="youtubeEmbedUrl"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>

              <!-- Video info - Responsive design with stacked layout on mobile -->
              <div class="p-4 md:p-6">
                <!-- Title and buttons with responsive layout -->
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <!-- Title and module info -->
                  <div class="w-full sm:w-auto">
                    <h2 class="text-lg sm:text-xl md:text-2xl font-bold mb-2 line-clamp-2">{{ currentVideo.title }}</h2>
                    <p class="text-sm text-muted-foreground dark:text-gray-300">{{ currentVideo.module }}</p>
                  </div>
                  
                  <!-- Action buttons - responsive positioning -->
                  <div class="flex mt-2 sm:mt-0 gap-2 w-full sm:w-auto">
                    <!-- Mark complete button (original styling) -->
                    <Button
                      @click="markLessonCompleted(course.modules.find(m => m.title === currentVideo.module)?.id, course.modules.find(m => m.title === currentVideo.module)?.lessons.find(l => l.video_id === currentVideo.id)?.id)"
                      :variant="currentVideo.completed ? 'default' : 'outline'"
                      size="sm"
                      class="transition-all duration-200 w-full sm:w-auto"
                      :class="{
                        'bg-primary text-white font-medium shadow-sm dark:bg-primary dark:text-white dark:shadow-primary/30': currentVideo.completed,
                        'border-primary/40 dark:border-primary/60 dark:text-white dark:bg-card/90 hover:bg-primary/10 dark:hover:bg-primary/20': !currentVideo.completed
                      }"
                      :disabled="isSavingProgress"
                    >
                      <div class="flex items-center gap-2">
                        <div v-if="isSavingProgress" class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        <CheckCircle2 v-else class="h-4 w-4" :class="currentVideo.completed ? 'text-white' : 'text-primary dark:text-primary'" />
                        <span class="dark:text-white">{{ currentVideo.completed ? 'Completed' : 'Mark as Complete' }}</span>
                      </div>
                    </Button>
                    
                    <!-- Edit button -->
                    <Button
                      variant="ghost"
                      size="icon"
                      class="flex-shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground hidden sm:flex"
                      @click="router.visit('/courses/content?id=' + course.id)"
                      title="Edit course content"
                    >
                      <Maximize2 class="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <!-- Custom tabs for video content -->
                <div class="mt-6 border-b">
                  <div class="flex space-x-1 sm:space-x-2 overflow-x-auto w-full">
                    <button
                      @click="activeTab = 'description'"
                      class="px-4 py-2 border-b-2 transition-colors text-foreground dark:text-white"
                      :class="activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent hover:text-primary/80 dark:hover:text-primary/90'"
                    >
                      <div class="flex items-center gap-1.5">
                        <BookOpen class="h-4 w-4" />
                        <span class="text-xs sm:text-sm">Description</span>
                      </div>
                    </button>
                    <button
                      @click="activeTab = 'resources'"
                      class="px-4 py-2 border-b-2 transition-colors text-foreground dark:text-white"
                      :class="activeTab === 'resources' ? 'border-primary text-primary' : 'border-transparent hover:text-primary/80 dark:hover:text-primary/90'"
                    >
                      <div class="flex items-center gap-1.5">
                        <FileText class="h-4 w-4" />
                        <span class="text-xs sm:text-sm">Resources</span>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Tab content area -->
                <div class="h-60 sm:h-52 overflow-y-auto mt-4 px-1">
                  <!-- Description tab content -->
                  <div v-if="activeTab === 'description'" class="space-y-4 text-sm text-foreground dark:text-white">
                    <p>{{ course.description }}</p>
                  </div>

                  <!-- Resources tab content -->
                  <div v-if="activeTab === 'resources'" class="space-y-2 text-sm text-foreground dark:text-white">
                    <div class="flex items-center gap-2 p-2 border rounded hover:bg-accent transition-colors cursor-pointer">
                      <BookOpen class="h-4 w-4 text-primary" />
                      <span>Course Materials (PDF)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Playlist sidebar - YouTube-inspired design -->
        <div class="lg:col-span-1">
          <Card class="border shadow-sm dark:shadow-md dark:shadow-background/10 min-h-[600px]">
            <CardContent class="p-0">
              <!-- Playlist header -->
              <div class="p-3 sm:p-4 border-b flex items-center justify-between bg-card dark:bg-card sticky top-0 z-10">
                <div class="flex items-center gap-2">
                  <PlayCircle class="h-5 w-5 text-primary" />
                  <h3 class="font-medium text-base sm:text-lg text-foreground dark:text-white">Course Playlist</h3>
                </div>
                <div class="px-2 py-0.5 sm:py-1 bg-primary/10 dark:bg-primary/20 rounded-full text-[10px] sm:text-xs font-medium text-primary dark:text-primary-foreground/90 whitespace-nowrap">
                  {{ progress }}% complete
                </div>
              </div>

              <!-- Course modules -->
              <div class="h-[calc(600px-57px)] overflow-y-auto">
                <div class="py-2">
                  <div v-for="module in course.modules" :key="module.id" class="mb-4">
                    <!-- Module header -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-muted dark:border-muted/70 pb-3 gap-2" @click="toggleModule(module.id)">
                      <div class="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:-mb-1 w-full justify-between sm:justify-start">
                        <div class="bg-primary/10 dark:bg-primary/20 rounded-full p-1">
                          <ChevronDown v-if="isModuleExpanded(module.id)" class="h-4 w-4 flex-shrink-0 text-primary" />
                          <ChevronRight v-else class="h-4 w-4 flex-shrink-0 text-primary" />
                        </div>
                        <div class="flex-1">
                          <div class="font-medium text-sm text-foreground dark:text-white">{{ module.title }}</div>
                          <div class="text-xs text-muted-foreground dark:text-gray-300">{{ module.lessons.length }} lessons</div>
                        </div>
                        <div class="flex items-center gap-1">
                          <CheckCircle2 v-if="module.completed" class="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>

                    <!-- Module lessons -->
                    <div v-if="isModuleExpanded(module.id)" class="space-y-2 py-2 bg-accent/5 dark:bg-accent/10">
                      <div
                        v-for="lesson in module.lessons"
                        :key="lesson.id"
                        @click="playLesson(module.id, lesson.id)"
                        class="mx-3 rounded-lg overflow-hidden flex cursor-pointer hover:bg-accent/30 dark:hover:bg-accent/20 transition-all duration-200 transform hover:translate-x-1 relative"
                        :class="{
                          'bg-primary/10 dark:bg-primary/20 ring-1 ring-primary': currentVideo.id === lesson.video_id,
                        }"
                      >
                        <!-- Thumbnail with play indicator -->
                        <div class="relative w-20 sm:w-24 h-16 flex-shrink-0 overflow-hidden">
                          <img
                            :src="`https://i.ytimg.com/vi/${lesson.video_id}/mqdefault.jpg`"
                            :alt="lesson.title"
                            class="w-full h-full object-cover"
                          />
                          <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                            <PlayCircle
                              v-if="currentVideo.id === lesson.video_id"
                              class="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white"
                              fill="currentColor"
                            />
                            <CheckCircle2
                              v-else-if="lesson.completed"
                              class="h-4 w-4 sm:h-5 sm:w-5 text-primary"
                            />
                          </div>
                          <!-- Duration badge -->
                          <div class="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {{ lesson.duration }}
                          </div>
                        </div>

                        <!-- Lesson info -->
                        <div class="p-2 flex-1 flex flex-col justify-center overflow-hidden">
                          <div
                            class="text-xs sm:text-sm font-medium truncate pr-8 sm:pr-0"
                            :class="{
                              'text-primary': currentVideo.id === lesson.video_id,
                              'text-foreground dark:text-white': currentVideo.id !== lesson.video_id
                            }"
                          >
                            {{ lesson.title }}
                          </div>
                          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-xs sm:text-sm text-muted-foreground dark:text-gray-300">
                            <div class="flex items-center gap-1">
                              <Video class="h-3 w-3" /> Lesson {{ module.lessons.indexOf(lesson) + 1 }}
                            </div>
                          </div>
                        </div>
                        
                        <!-- Mark complete button (positioned absolutely for better mobile layout) -->
                        <button 
                          v-if="currentVideo.id === lesson.video_id && !lesson.completed"
                          @click.stop="markLessonCompleted(module.id, lesson.id)"
                          class="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full p-1 transition-colors"
                        >
                          <CheckCircle2 class="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div 
                          v-else-if="lesson.completed"
                          class="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
                        >
                          <CheckCircle2 class="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </AppLayout>
  <!-- Celebration Modal (centered on screen) -->
  <Teleport to="body">
    <div v-if="showCelebration" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div class="relative w-full max-w-md mx-4 animate-bounce-in transform transition-all duration-500">
        <!-- Main celebration card -->
        <div class="bg-gradient-to-r from-primary via-primary/90 to-indigo-600 rounded-xl overflow-hidden shadow-2xl border border-primary/30 dark:border-primary/50">
          <!-- Confetti overlay -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute h-3 w-3 bg-yellow-300 rounded-full animate-confetti-1 opacity-80"></div>
            <div class="absolute h-3 w-3 bg-blue-300 rounded-full animate-confetti-2 opacity-80"></div>
            <div class="absolute h-4 w-2 bg-pink-300 rounded-full animate-confetti-3 opacity-80"></div>
            <div class="absolute h-2 w-4 bg-green-300 rounded-full animate-confetti-4 opacity-80"></div>
            <div class="absolute h-3 w-3 bg-purple-300 rounded-full animate-confetti-5 opacity-80"></div>
            <div class="absolute h-2 w-2 bg-yellow-200 rounded-full animate-confetti-6 opacity-80"></div>
          </div>

          <!-- Header with trophy -->
          <div class="pt-6 pb-4 px-6 text-center">
            <div class="relative inline-block">
              <div class="bg-white/20 rounded-full p-4 backdrop-blur-sm border border-white/30 inline-block">
                <Trophy class="h-10 w-10 text-yellow-300 animate-pulse" />
              </div>
              <!-- Stars animation -->
              <div class="absolute -top-1 -left-1 animate-ping delay-200 opacity-70">
                <Star class="h-4 w-4 text-yellow-200" />
              </div>
              <div class="absolute -top-2 right-0 animate-ping delay-500 opacity-70">
                <Star class="h-3 w-3 text-yellow-200" />
              </div>
              <div class="absolute bottom-0 -right-1 animate-ping delay-300 opacity-70">
                <Sparkles class="h-4 w-4 text-yellow-200" />
              </div>
            </div>

            <h2 class="text-2xl font-bold text-white mt-4 mb-1">Congratulations!</h2>
            <div class="w-16 h-1 bg-white/30 mx-auto rounded-full"></div>
          </div>

          <!-- Message content -->
          <div class="px-6 pb-6 text-center">
            <p class="text-white/90 text-lg font-medium leading-relaxed">{{ celebrationMessage }}</p>
          </div>

          <!-- Action button -->
          <div class="px-6 pb-6 flex justify-center">
            <Button
              @click="showCelebration = false"
              class="bg-white/20 hover:bg-white/30 text-white border border-white/20 font-medium"
            >
              <CheckCircle2 class="h-4 w-4 mr-2" />
              Keep Fighting!
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
  <!-- Course Completion Celebration Modal -->
  <Teleport to="body">
    <div v-if="showCourseCompletion" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300">
      <div class="relative w-full max-w-lg mx-4 animate-bounce-in transform transition-all duration-500">
        <!-- Main celebration card with enhanced styling for course completion -->
        <div class="bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-xl overflow-hidden shadow-2xl border border-primary/30 dark:border-primary/50">
          <!-- Confetti overlay with more particles for course completion -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute h-4 w-4 bg-yellow-300 rounded-full animate-confetti-1 opacity-90"></div>
            <div class="absolute h-4 w-4 bg-blue-300 rounded-full animate-confetti-2 opacity-90"></div>
            <div class="absolute h-5 w-2 bg-pink-300 rounded-full animate-confetti-3 opacity-90"></div>
            <div class="absolute h-3 w-5 bg-green-300 rounded-full animate-confetti-4 opacity-90"></div>
            <div class="absolute h-4 w-4 bg-purple-300 rounded-full animate-confetti-5 opacity-90"></div>
            <div class="absolute h-3 w-3 bg-yellow-200 rounded-full animate-confetti-6 opacity-90"></div>
            <!-- Additional confetti for course completion -->
            <div class="absolute h-3 w-3 bg-red-300 rounded-full animate-confetti-1 delay-300 opacity-90"></div>
            <div class="absolute h-2 w-5 bg-teal-300 rounded-full animate-confetti-2 delay-100 opacity-90"></div>
            <div class="absolute h-4 w-4 bg-orange-300 rounded-full animate-confetti-3 delay-500 opacity-90"></div>
          </div>

          <!-- Header with trophy and stars -->
          <div class="pt-10 pb-6 px-6 text-center">
            <div class="relative inline-block">
              <div class="bg-white/30 rounded-full p-6 backdrop-blur-sm border-2 border-white/50 inline-block">
                <Trophy class="h-16 w-16 text-yellow-300 animate-pulse" />
              </div>
              <!-- Animated elements -->
              <div class="absolute -top-2 -left-2 animate-ping delay-100 opacity-80">
                <Star class="h-5 w-5 text-yellow-200" />
              </div>
              <div class="absolute -top-3 right-0 animate-ping delay-300 opacity-80">
                <Star class="h-4 w-4 text-yellow-200" />
              </div>
              <div class="absolute bottom-0 -right-2 animate-ping delay-200 opacity-80">
                <Sparkles class="h-6 w-6 text-yellow-200" />
              </div>
            </div>

            <h2 class="text-3xl font-bold text-white mt-6 mb-2">Course Completed!</h2>
            <div class="w-24 h-1 bg-white/40 mx-auto rounded-full mb-4"></div>
          </div>

          <!-- Message content -->
          <div class="px-8 pb-6 text-center">
            <p class="text-white text-xl font-medium leading-relaxed">{{ celebrationMessage }}</p>

            <!-- Course stats summary -->
            <div class="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-3xl font-bold text-white">100%</div>
                  <div class="text-white/80 text-sm">Completion</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-white">{{ props.course.modules.reduce((acc, module) => acc + module.lessons.length, 0) }}</div>
                  <div class="text-white/80 text-sm">Lessons Completed</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action buttons with enhanced styling -->
          <div class="px-6 pb-8 flex justify-center space-x-4">
            <Button
              @click="showCourseCompletion = false"
              class="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-medium"
            >
              <CheckCircle2 class="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
            <Button
              @click="router.visit('/courses')"
              class="bg-white text-primary hover:bg-white/90 border border-white/80 font-medium shadow-md"
            >
              <BookOpen class="h-4 w-4 mr-2" />
              Browse More Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Smooth transitions */
.tab-content-enter-active,
.tab-content-leave-active {
  transition: opacity 0.3s ease;
}
.tab-content-enter-from,
.tab-content-leave-to {
  opacity: 0;
}

/* Animation for bouncing in */
@keyframes bounce-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  70% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Confetti animations */
@keyframes confetti-1 {
  0% { transform: translate(-5px, 0) rotate(0deg); }
  100% { transform: translate(-5px, 100px) rotate(360deg); opacity: 0; }
}

@keyframes confetti-2 {
  0% { transform: translate(5px, 0) rotate(0deg); }
  100% { transform: translate(5px, 110px) rotate(-360deg); opacity: 0; }
}

@keyframes confetti-3 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-20px, 105px) rotate(250deg); opacity: 0; }
}

@keyframes confetti-4 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(20px, 105px) rotate(-250deg); opacity: 0; }
}

@keyframes confetti-5 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-10px, 105px) rotate(360deg); opacity: 0; }
}

@keyframes confetti-6 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(10px, 105px) rotate(-360deg); opacity: 0; }
}

.animate-confetti-1 {
  top: 0;
  left: 10%;
  animation: confetti-1 3s ease-in-out forwards;
}

.animate-confetti-2 {
  top: 0;
  left: 20%;
  animation: confetti-2 2.5s ease-in-out 0.2s forwards;
}

.animate-confetti-3 {
  top: 0;
  left: 40%;
  animation: confetti-3 2.8s ease-in-out 0.4s forwards;
}

.animate-confetti-4 {
  top: 0;
  left: 60%;
  animation: confetti-4 2.7s ease-in-out 0.6s forwards;
}

.animate-confetti-5 {
  top: 0;
  left: 80%;
  animation: confetti-5 2.6s ease-in-out 0.8s forwards;
}

.animate-confetti-6 {
  top: 0;
  left: 90%;
  animation: confetti-6 2.5s ease-in-out 1s forwards;
}
</style>
