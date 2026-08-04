<script setup lang="ts">
import { useHead } from '#imports';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Plus, LayoutDashboard, Settings } from 'lucide-vue-next';
import useGetCourses from '~/composables/courses/useGetCourses';

// Set page metadata
useHead({
    title: 'My Courses - Teacher - FocusFlow'
});

// Define page layout and middleware
definePageMeta({
    layout: false,
    middleware: ['auth']
});

// Breadcrumbs for navigation
const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Courses', href: '/teacher/courses', current: true },
];

const { courses, loading, error, fetchCourses } = useGetCourses();
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
                    <LayoutDashboard class="h-6 w-6" />
                    My Courses
                </h1>
                <NuxtLink to="/courses/create">
                    <Button class="flex items-center gap-2">
                        <Plus class="h-4 w-4" />
                        Create New Course
                    </Button>
                </NuxtLink>
            </div>
            
            <!-- Loading state with skeleton cards -->
            <div v-if="loading" class="col-span-full">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    <div v-for="i in 3" :key="i" class="bg-card/95 dark:bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                        <div class="p-3 pt-3">
                            <div class="aspect-video bg-muted/80 dark:bg-muted/40 rounded-lg"></div>
                        </div>
                        <div class="px-5 pb-5">
                            <div class="h-6 bg-muted/80 dark:bg-muted/40 rounded mb-2 w-3/4"></div>
                            <div class="h-4 bg-muted/60 dark:bg-muted/30 rounded mb-4 w-full"></div>
                            <div class="border-t border-border pt-4 mt-6 flex items-center justify-between">
                                <div class="h-4 w-16 bg-muted/60 dark:bg-muted/30 rounded"></div>
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
            <div v-else-if="courses.length === 0" class="py-12 flex flex-col items-center justify-center bg-muted/20 dark:bg-muted/10 rounded-lg border border-border/40 dark:border-border/50 text-center px-4">
                <BookOpen class="h-12 w-12 text-muted-foreground mb-3" />
                <h3 class="text-lg font-medium text-foreground mb-1">No courses created</h3>
                <p class="text-muted-foreground mb-4">
                    You haven't created any courses yet. Share your knowledge with students!
                </p>
                <NuxtLink to="/courses/create">
                    <Button class="flex items-center gap-2">
                        <Plus class="h-4 w-4" />
                        Create Course
                    </Button>
                </NuxtLink>
            </div>
            
            <!-- Courses section -->
            <div v-else>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                        v-for="course in courses" 
                        :key="course.course_id" 
                        class="bg-card/95 dark:bg-card rounded-lg border border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/40"
                    >
                        <div class="p-3 pt-3">
                            <div class="aspect-video bg-muted relative rounded-lg overflow-hidden">
                                <div class="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    <BookOpen class="h-12 w-12 opacity-20" />
                                </div>
                                <img
                                    v-if="course.course_thumb || course.derived_thumb"
                                    class="w-full h-full object-cover absolute inset-0 z-10"
                                    :src="course.course_thumb || course.derived_thumb"
                                    :alt="`${course.course_title} thumbnail`"
                                    loading="lazy"
                                >
                            </div>
                        </div>
                        <div class="px-5 pb-5">
                            <h3 class="text-xl font-semibold text-foreground mb-1 line-clamp-2">{{ course.course_title }}</h3>
                            
                            <!-- Category and Visibility badges -->
                            <div class="flex flex-wrap gap-2 mb-4 mt-2">
                                <span 
                                    v-if="course.category?.category_name"
                                    class="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border border-primary/20 bg-primary/5 text-primary"
                                >
                                    {{ course.category.category_name }}
                                </span>
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
                                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users class="h-4 w-4" />
                                    <span>{{ (course as any).enrollment_count || 0 }} Enrollments</span>
                                </div>
                                
                                <div class="flex gap-2">
                                    <NuxtLink :to="`/courses/settings?id=${course.course_id}`">
                                        <Button variant="outline" size="sm" class="flex items-center gap-1.5">
                                            <Settings class="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                    </NuxtLink>
                                    <NuxtLink :to="`/courses/detail?id=${course.course_id}`">
                                        <Button size="sm" class="flex items-center gap-1.5">
                                            View
                                        </Button>
                                    </NuxtLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>
