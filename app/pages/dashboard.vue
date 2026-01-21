<script setup lang="ts">
import { useHead } from '#imports';

// Set page metadata
useHead({
    title: 'Dashboard - FocusFlow'
});

// Define page layout
definePageMeta({
    layout: false,
    middleware: 'auth'
});

// Breadcrumbs for the dashboard page
const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Dashboard', href: '/dashboard', current: true },
];
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <!-- Empty dashboard - content will be implemented later -->
        <div class="flex h-full flex-1 flex-col p-6 lg:p-8">
            <!-- Placeholder for future content -->
             <div>
                <h1>welcome to dashboard</h1>
             </div>
        </div>
    </NuxtLayout>
</template>