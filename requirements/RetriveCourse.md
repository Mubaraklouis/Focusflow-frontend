Description: 
 The code below is inertai code with vue  i want to migrate this code to work with nuxt 
 I have setup the structure of how to do just implment it with my structure 

 structure 
   pages
     courses
       index.vue => here is where all the course will be listed the course request is done inside compasable 
            useGetCourses.ts = this is where the course request is done the compasble wwill make request to my nitro server and get all the course 

            the server is 

            api
              courses
              index.get.ts

              this is where the request is made to get all the course 

              follow the same parten like regester and login


              rules

              Document the what you have writen in jsdocs style 
                



<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, BookOpen, RefreshCw, Search, PlayCircle } from 'lucide-vue-next';
import type { BreadcrumbItemType } from '@/types';

type FilterStatus = 'all' | 'in-progress' | 'completed' | 'not-started';

const activeFilter = ref<FilterStatus>('all');
const searchQuery = ref('');

// Pagination state
const itemsPerPage = 6; // Initially show 6 courses
const displayedCount = ref(itemsPerPage);

// Function to load more courses
const loadMoreCourses = () => {
  displayedCount.value += itemsPerPage;
};

const setFilter = (filter: FilterStatus) => {
    activeFilter.value = filter;
    resetPagination(); // Reset pagination when filter changes
};

// Define breadcrumbs for page navigation
const breadcrumbs: BreadcrumbItemType[] = [
    {
        title: 'Courses',
        href: '/courses'
    }
];

// Get courses data from Inertia props
interface Category {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  icon: string | null;
  pivot: {
    course_id: number;
    category_id: number;
  };
}

interface UserUuid {
  id: number;
  course_id: number;
  user_uuid: string;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  uuid: string;
  title: string;
  description: string;
  image: string;
  prerequisite: string | null;
  start_date: string | null;
  end_date: string | null;
  difficulty_level: string | null;
  progress: number;
  completion_message: string | null;
  created_at: string;
  updated_at: string;
  user_uuids: UserUuid[];
  categories: Category[];
}

interface PageProps {
  courses: Course[];
  error?: string;
  [key: string]: any; // Add index signature required by Inertia
}

// Get page props from Inertia
const page = usePage<PageProps>();

// Get courses from props
const courses = computed(() => page.props.courses || []);
const error = computed(() => page.props.error || null);
const loading = computed(() => false); // No loading state when using Inertia Server Side Props

// Get default placeholder image if API returns null or invalid image URL
const getPlaceholderImage = (id: number) => {
  return `https://picsum.photos/seed/course${id}/600/400`;
};

// Filter courses based on active filter and search query
const filteredCourses = computed(() => {
  const allCourses = courses.value;
  let filtered = allCourses;
  
  // Apply progress filter
  switch (activeFilter.value) {
    case 'completed':
      filtered = filtered.filter(course => course.progress === 100);
      break;
    case 'in-progress':
      filtered = filtered.filter(course => course.progress > 0 && course.progress < 100);
      break;
    case 'not-started':
      filtered = filtered.filter(course => course.progress === 0);
      break;
  }
  
  // Apply search filter if search query exists
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(course => {
      // Search in title, description, and categories
      return (
        course.title.toLowerCase().includes(query) ||
        (course.description && course.description.toLowerCase().includes(query)) ||
        course.categories.some(cat => cat.title.toLowerCase().includes(query))
      );
    });
  }
  
  return filtered;
});

// Limit displayed courses for better performance
const displayedCourses = computed(() => {
  return filteredCourses.value.slice(0, displayedCount.value);
});

// Check if there are more courses to load
const hasMoreCourses = computed(() => {
  return displayedCourses.value.length < filteredCourses.value.length;
});

// Reset displayed count when filters change
const resetPagination = () => {
  displayedCount.value = itemsPerPage;
};

// Watch for filter changes to reset pagination
watch([activeFilter, searchQuery], () => {
  resetPagination();
});
</script>

<template>
  <div>

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
                    <GraduationCap class="h-6 w-6" />
                    Courses
                </h1>
                <Button variant="outline" as="a" href="/courses/create">New Course</Button>
            </div>
            
            <!-- Search input -->
            <div class="relative mb-6">
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search courses by title, description or category"
                        class="pl-10 w-full bg-background"
                        v-model="searchQuery"
                    />
                </div>
            </div>

            <!-- Course filter -->
            <div class="flex flex-wrap gap-2 mb-8">
                <Button 
                    :variant="activeFilter === 'all' ? 'default' : 'outline'" 
                    size="sm"
                    @click="setFilter('all')"
                >
                    All status
                </Button>
                <Button 
                    :variant="activeFilter === 'in-progress' ? 'default' : 'outline'" 
                    size="sm"
                    @click="setFilter('in-progress')"
                >
                    In progress
                </Button>
                <Button 
                    :variant="activeFilter === 'completed' ? 'default' : 'outline'" 
                    size="sm"
                    @click="setFilter('completed')"
                >
                    Completed
                </Button>
                <Button 
                    :variant="activeFilter === 'not-started' ? 'default' : 'outline'" 
                    size="sm"
                    @click="setFilter('not-started')"
                >
                    Not started
                </Button>
            </div>

            <!-- Loading state with skeleton cards -->
            <div v-if="loading" class="col-span-full">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    <div v-for="i in 6" :key="i" class="bg-card/95 dark:bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                        <!-- Skeleton image -->
                        <div class="p-3 pt-3">
                            <div class="aspect-video bg-muted/80 dark:bg-muted/40 rounded-lg"></div>
                        </div>
                        <!-- Skeleton content -->
                        <div class="px-5 pb-5">
                            <!-- Title placeholder -->
                            <div class="h-6 bg-muted/80 dark:bg-muted/40 rounded mb-2 w-3/4"></div>
                            <!-- Description placeholder -->
                            <div class="h-4 bg-muted/60 dark:bg-muted/30 rounded mb-4 w-full"></div>
                            
                            <!-- Category placeholders -->
                            <div class="flex flex-wrap gap-2 mb-5">
                                <div class="h-6 w-16 bg-primary/10 dark:bg-primary/5 rounded-md"></div>
                                <div class="h-6 w-20 bg-primary/10 dark:bg-primary/5 rounded-md"></div>
                            </div>
                            
                            <!-- Footer placeholder -->
                            <div class="border-t border-border pt-4 mt-6 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-10 h-10 rounded-full bg-muted/60 dark:bg-muted/30"></div>
                                    <div class="h-4 w-16 bg-muted/60 dark:bg-muted/30 rounded"></div>
                                </div>
                                <div class="h-8 w-20 bg-primary/20 dark:bg-primary/10 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="col-span-full bg-destructive/10 text-destructive p-6 rounded-lg">
                <p>{{ error }}</p>
                <Button class="mt-4" variant="outline" @click="router.reload()">Try Again</Button>
            </div>
            
            <!-- Empty state -->
            <div v-else-if="filteredCourses.length === 0" class="py-12 flex flex-col items-center justify-center bg-muted/20 dark:bg-muted/10 rounded-lg border border-border/40 dark:border-border/50 text-center px-4">
                <BookOpen class="h-12 w-12 text-muted-foreground mb-3" />
                <h3 class="text-lg font-medium text-foreground mb-1">No courses found</h3>
                <p class="text-muted-foreground mb-4">There are no courses matching your current filters</p>
                <Button variant="outline" @click="setFilter('all')" class="flex items-center gap-2">
                    <RefreshCw class="h-4 w-4" />
                    Reset Filters
                </Button>
            </div>
            
            <!-- Courses section -->
            <div v-else>
                <!-- Course count info -->
                <div class="mb-4 text-sm text-muted-foreground">
                    <p>Showing {{ displayedCourses.length }} of {{ filteredCourses.length }} courses</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                        v-for="course in displayedCourses" 
                        :key="course.id" 
                        class="bg-card/95 dark:bg-card rounded-lg border border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/40 dark:shadow-lg dark:shadow-black/20 dark:hover:shadow-primary/5"
                    >
                        <div class="p-3 pt-3">
                            <div class="aspect-video bg-muted relative rounded-lg overflow-hidden">
                                <!-- Fallback icon (shows while image loads) -->
                                <div class="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    <BookOpen class="h-12 w-12 opacity-20" />
                                </div>
                                <!-- Course image or placeholder -->
                                <img 
                                    class="w-full h-full object-cover absolute inset-0 z-10" 
                                    :src="course.image || getPlaceholderImage(course.id)" 
                                    :alt="`${course.title} thumbnail`"
                                    loading="lazy"
                                >
                            </div>
                        </div>
                        <div class="px-5 pb-5">
                            <h3 class="text-xl font-semibold text-foreground mb-1 line-clamp-2">{{ course.title }}</h3>
                            <p class="text-sm text-muted-foreground/90 mb-4 line-clamp-1 font-medium">{{ course.description }}</p>

                            <!-- Categories -->
                            <div class="flex flex-wrap gap-2 mb-5">
                                <span 
                                    v-for="category in course.categories" 
                                    :key="category.id"
                                    class="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                >
                                    {{ category.title }}
                                </span>
                            </div>

                        <div class="flex items-center justify-between mt-6 pt-4 border-t border-border">
                            <div class="flex items-center gap-2">
                                <!-- Circular progress indicator -->
                                <div class="relative w-10 h-10">
                                    <svg class="w-10 h-10 transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            class="text-muted stroke-current"
                                            stroke-width="10"
                                            fill="transparent"
                                            r="40"
                                            cx="50"
                                            cy="50"
                                        />
                                        <circle
                                            class="text-primary stroke-current"
                                            stroke-width="10"
                                            stroke-linecap="round"
                                            fill="transparent"
                                            r="40"
                                            cx="50"
                                            cy="50"
                                            :stroke-dasharray="251.2"
                                            :stroke-dashoffset="251.2 - (251.2 * course.progress / 100)"
                                        />
                                    </svg>
                                    <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-medium">
                                        {{ course.progress }}%
                                    </div>
                                </div>
                                <span class="text-sm text-muted-foreground">Progress</span>
                            </div>
                            
                            <!-- Start/Continue button with different styles based on progress -->
                            <Button 
                                :variant="course.progress > 0 ? 'outline' : 'default'" 
                                size="sm"
                                @click="router.visit(`/courses/detail?id=${course.uuid}`)"
                                class="flex items-center gap-1.5"
                            >
                                <template v-if="course.progress > 0">
                                    <RefreshCw class="h-3.5 w-3.5" />
                                    Continue
                                </template>
                                <template v-else>
                                    <PlayCircle class="h-3.5 w-3.5" />
                                    Start
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>
                
                <!-- Load More Button -->
                <div v-if="hasMoreCourses" class="mt-8 flex justify-center">
                    <Button @click="loadMoreCourses" variant="outline" class="px-8 py-2 flex items-center gap-2">
                        <span>Load More Courses</span>
                        <RefreshCw class="h-4 w-4" :class="{'animate-spin': false}" />
                    </Button>
                </div>
                
                <!-- No more courses message -->
                <div v-else-if="filteredCourses.length > itemsPerPage" class="mt-6 text-center text-muted-foreground">
                    <p>All courses loaded</p>
                </div>
            </div>
        </div>

         </div>
    </AppLayout>
  </div>
</template>
