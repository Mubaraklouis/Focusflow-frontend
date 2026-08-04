<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Folder, Image as ImageIcon, BookOpen, Tag } from 'lucide-vue-next';
import { useHead } from '#imports';
import {useCreateCourse} from "~/composables/courses/useCreateCourse";


// Page config
definePageMeta({
    layout: false,
    middleware: ['auth']
});

useHead({
    title: 'Create Course - FocusFlow'
});

// Breadcrumbs
const breadcrumbs = [
    { title: 'Courses', href: '/courses' },
    { title: 'Create Course', href: '/courses/create', current: true }
];

const { form, createCourse, isLoading, validationErrors, handleThumbnailUpload, thumbnailPreviewUrl } = useCreateCourse();

const handlePublish = async () => {
    try {
        await createCourse();
        await navigateTo('/courses');
    } catch (e) {
        // Error is handled in composable state
    }
};

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] || null;
    handleThumbnailUpload(file);
};

</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="container max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 transition-colors">
            <!-- Header -->
            <div class="mb-6 sm:mb-8">
                <div class="flex items-center gap-3 mb-2">
                    <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                        <BookOpen class="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Create New Course</h1>
                </div>
                <p class="text-sm sm:text-base text-muted-foreground ml-13">Design and publish your course to reach students worldwide</p>
            </div>

            <!-- Progress Steps (Static Visual) -->
            <div class="mb-6">
                <div class="flex items-center max-w-3xl mx-auto">
                    <!-- Step 1: Basic Info -->
                    <div class="flex-1 flex flex-col items-center">
                        <div class="rounded-full h-10 w-10 flex items-center justify-center border border-border/50 bg-primary text-primary-foreground shadow-sm transition-colors">
                            <span>1</span>
                        </div>
                        <div class="mt-2 text-center">
                            <div class="text-foreground/90 font-medium text-sm">Basic Info</div>
                        </div>
                    </div>

                    <!-- Connector Line -->
                    <div class="w-10 h-px bg-border dark:bg-border/50"></div>

                    <!-- Step 2: Content -->
                    <div class="flex-1 flex flex-col items-center">
                        <div class="rounded-full h-10 w-10 flex items-center justify-center border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-colors dark:border-border/30 dark:bg-card/80">
                            <span>2</span>
                        </div>
                        <div class="mt-2 text-center">
                            <div class="text-foreground/90 font-medium text-sm">Content</div>
                        </div>
                    </div>

                    <!-- Connector Line -->
                    <div class="w-10 h-px bg-border dark:bg-border/50"></div>

                    <!-- Step 3: Settings -->
                    <div class="flex-1 flex flex-col items-center">
                        <div class="rounded-full h-10 w-10 flex items-center justify-center border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-colors dark:border-border/30 dark:bg-card/80">
                            <span>3</span>
                        </div>
                        <div class="mt-2 text-center">
                            <div class="text-foreground/90 font-medium text-sm">Settings</div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <!-- Course Thumbnail -->
                <div class="relative aspect-[3/2] sm:aspect-video bg-muted rounded-xl overflow-hidden border-2 border-dashed transition-all hover:border-primary/50 hover:shadow-lg shadow-sm cursor-pointer dark:bg-muted/50 mb-6 sm:mb-8 group"
                     :class="validationErrors.course_thumb ? 'border-destructive' : 'border-border/60'">
                    <!-- Preview Image (shown when file is uploaded) -->
                    <img 
                        v-if="thumbnailPreviewUrl" 
                        :src="thumbnailPreviewUrl" 
                        alt="Course thumbnail preview" 
                        class="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    <!-- Upload Placeholder (shown when no file) -->
                    <div v-else class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20 dark:from-muted/30 dark:to-muted/10 transition-all group-hover:from-muted/50 group-hover:to-muted/30">
                        <div class="bg-background/80 backdrop-blur-sm rounded-full p-4 mb-3 group-hover:scale-110 transition-transform">
                            <ImageIcon class="h-10 w-10 sm:h-12 sm:w-12 text-primary/70" />
                        </div>
                        <p class="text-sm sm:text-base font-semibold text-foreground mb-1">Upload Course Cover (Optional)</p>
                        <p class="text-xs sm:text-sm text-muted-foreground px-4 text-center">Click or drag image here (Recommended: 1280×720px). If skipped, we'll use your first lesson's thumbnail.</p>
                    </div>
                    
                    <input 
                        type="file" 
                        class="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="image/*" 
                        @change="onFileChange"
                    />
                </div>
                <p v-if="validationErrors.course_thumb" class="text-sm text-destructive -mt-4 mb-4">
                    {{ validationErrors.course_thumb }}
                </p>

                <!-- Document-style editor -->
                <Card class="border-none shadow-none bg-transparent transition-colors">
                    <CardContent class="p-0">
                        <!-- Course Details Form Card -->
                        <div class="bg-card dark:bg-card/60 border border-border dark:border-border/80 rounded-xl p-5 sm:p-8 shadow-md dark:shadow-none mb-6 sm:mb-8 transition-colors">
                            <h3 class="text-base sm:text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                                <div class="bg-primary/10 p-2 rounded-lg">
                                    <BookOpen class="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                Course Information
                            </h3>

                            <div class="space-y-5 sm:space-y-6">
                                <!-- Course Title -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-foreground/80">
                                        Course Title <span class="text-destructive">*</span>
                                    </label>
                                    <Input
                                        v-model="form.course_title"
                                        type="text"
                                        placeholder="e.g., Introduction to Web Development"
                                        :class="[
                                            'text-sm sm:text-base h-11 sm:h-12 transition-all bg-background text-foreground placeholder:text-muted-foreground',
                                            validationErrors.course_title 
                                                ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20' 
                                                : 'border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 dark:border-border/60'
                                        ]"
                                    />
                                    <p v-if="validationErrors.course_title" class="text-sm text-destructive">
                                        {{ validationErrors.course_title }}
                                    </p>
                                </div>

                                <!-- Category Dropdown -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-foreground/80 flex items-center gap-2">
                                        <Tag class="h-4 w-4 text-muted-foreground" />
                                        Category (Optional)
                                    </label>
                                    <select 
                                        v-model="form.course_category_id" 
                                        class="flex h-11 sm:h-12 w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary/50"
                                    >
                                        <option :value="null" disabled selected>Select a category</option>
                                        <option :value="1">Programming & Development</option>
                                        <option :value="2">Design & Creative</option>
                                        <option :value="3">Business & Marketing</option>
                                        <option :value="4">Data Science & Analytics</option>
                                        <option :value="5">Personal Development</option>
                                        <option :value="6">Health & Fitness</option>
                                        <option :value="7">Language Learning</option>
                                        <option :value="8">Other</option>
                                    </select>

                                </div>

                                <!-- Course Visibility -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-foreground/80 flex items-center gap-2">
                                        <BookOpen class="h-4 w-4 text-muted-foreground" />
                                        Visibility
                                    </label>
                                    <div class="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            :variant="form.course_visibility === 'public' ? 'default' : 'outline'"
                                            @click="form.course_visibility = 'public'"
                                            class="w-full sm:w-auto transition-colors"
                                        >
                                            Public
                                        </Button>
                                        <Button
                                            type="button"
                                            :variant="form.course_visibility === 'shared' ? 'default' : 'outline'"
                                            @click="form.course_visibility = 'shared'"
                                            class="w-full sm:w-auto transition-colors"
                                        >
                                            Shared
                                        </Button>
                                        <Button
                                            type="button"
                                            :variant="form.course_visibility === 'private' ? 'default' : 'outline'"
                                            @click="form.course_visibility = 'private'"
                                            class="w-full sm:w-auto transition-colors"
                                        >
                                            Private
                                        </Button>
                                    </div>
                                    <p class="text-xs text-muted-foreground mt-1">
                                        {{ form.course_visibility === 'public' ? 'Anyone can view and enroll in this course.' : form.course_visibility === 'shared' ? 'Hidden from discover. Anyone with the link can view and enroll.' : 'Only you can access this course.' }}
                                    </p>
                                </div>

                                <!-- Course Description -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-foreground/80">
                                        Course Description (Optional)
                                    </label>
                                    <div class="relative">
                                        <textarea
                                            v-model="form.course_description"
                                            placeholder="Provide a clear and engaging description of what students will learn..."
                                            :class="[
                                                'w-full h-32 sm:h-36 rounded-md border bg-background px-3 sm:px-4 py-3 text-sm sm:text-base text-foreground shadow-sm transition-all resize-none focus:outline-none focus:ring-2',
                                                validationErrors.course_description 
                                                    ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' 
                                                    : 'border-border/50 focus:ring-primary/20 focus:border-primary/50'
                                            ]"
                                            maxlength="500"
                                        ></textarea>
                                        <div class="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                                            {{ form.course_description.length }}/500
                                        </div>
                                    </div>
                                    <p v-if="validationErrors.course_description" class="text-sm text-destructive">
                                        {{ validationErrors.course_description }}
                                    </p>
                                    <p v-else class="text-xs text-muted-foreground">Write a compelling description to attract students</p>
                                </div>
                            </div>
                        </div>

                        <!-- Save/Publish buttons -->
                        <div class="flex flex-col sm:flex-row justify-between sm:justify-end gap-3 mt-8 sm:mt-10 sticky bottom-4 sm:static bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-4 sm:p-0 -mx-3 sm:mx-0 rounded-lg sm:rounded-none border sm:border-0 border-border/50 shadow-lg sm:shadow-none">
                            <Button
                                variant="outline"
                                class="w-full sm:w-auto h-11 sm:h-10 order-2 sm:order-1 transition-all hover:bg-muted hover:border-primary/30 border-border dark:border-border/60 dark:text-foreground dark:hover:bg-muted/80"
                            >
                                Save Draft
                            </Button>
                            <Button
                                class="w-full sm:w-auto h-11 sm:h-10 order-1 sm:order-2 transition-all bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg"
                                @click="handlePublish"
                                :disabled="isLoading"
                            >
                                {{ isLoading ? 'Publishing...' : 'Publish Course' }}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </NuxtLayout>
</template>
