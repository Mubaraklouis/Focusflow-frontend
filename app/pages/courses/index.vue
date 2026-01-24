<script setup lang="ts">
import { useHead } from '#imports';
import { Button } from '@/components/ui/button';

// Set page metadata
useHead({
    title: 'Courses - FocusFlow'
});

// Define page layout
definePageMeta({
    layout: false,
    middleware: ['auth']
});

// Breadcrumbs for the courses page
const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Courses', href: '/courses', current: true },
];
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col p-6 lg:p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-foreground mb-4">Courses</h1>
                    <p class="text-muted-foreground">Your courses will appear here.</p>
                </div>
                <NuxtLink to="/courses/create">
                    <Button>Create Course</Button>
                </NuxtLink>
            </div>
            
            <!-- Empty state or list could go here -->
            <div class="mt-8 border-dashed border-2 border-border rounded-lg p-12 text-center">
                <p class="text-muted-foreground">No courses found.</p>
            </div>
        </div>
    </NuxtLayout>
</template>