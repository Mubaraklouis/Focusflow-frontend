<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useHead } from '#imports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, BookOpen, RefreshCw, Search, PlayCircle } from 'lucide-vue-next';
import useGetCourses from '~/composables/courses/useGetCourses';
import type { Course } from '~/composables/courses/useGetCourses';

/**
 * Filter status type for course filtering
 */
type FilterStatus = 'all' | 'in-progress' | 'completed' | 'not-started';

// Set page metadata
useHead({
    title: 'Courses - FocusFlow'
});

// Define page layout and middleware
definePageMeta({
    layout: false,
    middleware: ['auth']
});

// Breadcrumbs for navigation
const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Courses', href: '/courses', current: true },
];

// Get courses from composable
const { courses, loading, error, fetchCourses } = useGetCourses();

// Local state for filtering and search
const activeFilter = ref<FilterStatus>('all');
const searchQuery = ref('');

// Pagination state
const itemsPerPage = 6;
const displayedCount = ref(itemsPerPage);

/**
 * Sets the active filter and resets pagination
 * @param filter - The filter to apply
 */
const setFilter = (filter: FilterStatus) => {
    activeFilter.value = filter;
    resetPagination();
};

/**
 * Loads more courses for pagination
 */
const loadMoreCourses = () => {
    displayedCount.value += itemsPerPage;
};

/**
 * Resets the displayed count to initial value
 */
const resetPagination = () => {
    displayedCount.value = itemsPerPage;
};

/**
 * Gets a placeholder image URL for courses without thumbnails
 * @param id - The course ID for generating unique placeholder
 */
const getPlaceholderImage = (id: number) => {
    return `https://picsum.photos/seed/course${id}/600/400`;
};

/**
 * Filtered courses based on search and filter criteria
 * Note: Progress filtering is simplified since API doesn't provide progress data
 */
const filteredCourses = computed(() => {
    let filtered = courses.value;

    // Apply search filter if query exists
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        filtered = filtered.filter((course: Course) => {
            return course.course_title.toLowerCase().includes(query);
        });
    }

    return filtered;
});

/**
 * Courses to display (with pagination limit)
 */
const displayedCourses = computed(() => {
    return filteredCourses.value.slice(0, displayedCount.value);
});

/**
 * Whether more courses can be loaded
 */
const hasMoreCourses = computed(() => {
    return displayedCourses.value.length < filteredCourses.value.length;
});

// Reset pagination when filters change
watch([activeFilter, searchQuery], () => {
    resetPagination();
});
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
                    <GraduationCap class="h-6 w-6" />
                    Courses
                </h1>
                <NuxtLink to="/courses/create">
                    <Button variant="outline">New Course</Button>
                </NuxtLink>
            </div>
            
            <!-- Search input -->
            <div class="relative mb-6">
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search courses by title"
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
                <Button class="mt-4" variant="outline" @click="fetchCourses">Try Again</Button>
            </div>
            
            <!-- Empty state -->
            <div v-else-if="filteredCourses.length === 0" class="py-12 flex flex-col items-center justify-center bg-muted/20 dark:bg-muted/10 rounded-lg border border-border/40 dark:border-border/50 text-center px-4">
                <BookOpen class="h-12 w-12 text-muted-foreground mb-3" />
                <h3 class="text-lg font-medium text-foreground mb-1">No courses found</h3>
                <p class="text-muted-foreground mb-4">
                    {{ searchQuery ? 'No courses match your search' : 'You haven\'t created any courses yet' }}
                </p>
                <div class="flex gap-2">
                    <Button v-if="searchQuery" variant="outline" @click="searchQuery = ''" class="flex items-center gap-2">
                        <RefreshCw class="h-4 w-4" />
                        Clear Search
                    </Button>
                    <NuxtLink to="/courses/create">
                        <Button class="flex items-center gap-2">
                            Create Course
                        </Button>
                    </NuxtLink>
                </div>
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
                        :key="course.course_id" 
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
                                    :src="course.course_thumb || getPlaceholderImage(course.course_id)" 
                                    :alt="`${course.course_title} thumbnail`"
                                    loading="lazy"
                                >
                            </div>
                        </div>
                        <div class="px-5 pb-5">
                            <h3 class="text-xl font-semibold text-foreground mb-1 line-clamp-2">{{ course.course_title }}</h3>
                            
                            <!-- Visibility badge -->
                            <div class="flex flex-wrap gap-2 mb-5">
                                <span 
                                    class="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border"
                                    :class="course.course_visibility === 'public' 
                                        ? 'border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400' 
                                        : 'border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400'"
                                >
                                    {{ course.course_visibility === 'public' ? 'Public' : 'Private' }}
                                </span>
                            </div>

                            <div class="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                <!-- Start/View button -->
                                <Button 
                                    variant="default" 
                                    size="sm"
                                    @click="navigateTo(`/courses/detail?id=${course.course_id}`)"
                                    class="flex items-center gap-1.5"
                                >
                                    <PlayCircle class="h-3.5 w-3.5" />
                                    View
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Load More Button -->
                <div v-if="hasMoreCourses" class="mt-8 flex justify-center">
                    <Button @click="loadMoreCourses" variant="outline" class="px-8 py-2 flex items-center gap-2">
                        <span>Load More Courses</span>
                        <RefreshCw class="h-4 w-4" />
                    </Button>
                </div>
                
                <!-- No more courses message -->
                <div v-else-if="filteredCourses.length > itemsPerPage" class="mt-6 text-center text-muted-foreground">
                    <p>All courses loaded</p>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>