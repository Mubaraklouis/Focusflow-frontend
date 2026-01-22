<script setup lang="ts">
import { useHead } from '#imports';

// Set page metadata
useHead({
    title: 'Dashboard - FocusFlow'
});

// Define page layout
definePageMeta({
    layout: false,
    middleware: ['auth', 'verified']
});

// Breadcrumbs for the dashboard page
const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Dashboard', href: '/dashboard', current: true },
];

// Handle email verification success
const route = useRoute()
const showVerificationSuccess = ref(false)

onMounted(() => {
    // Check if user just verified their email
    if (route.query.verified === '1') {
        showVerificationSuccess.value = true
        
        // Clean up URL after a short delay
        setTimeout(() => {
            navigateTo('/dashboard', { replace: true })
        }, 100)
        
        // Hide the notification after 5 seconds
        setTimeout(() => {
            showVerificationSuccess.value = false
        }, 5000)
    }
})
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <!-- Email Verification Success Banner -->
        <div 
            v-if="showVerificationSuccess" 
            class="fixed top-4 right-4 z-50 p-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200 shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Email verified successfully!</span>
        </div>

        <!-- Empty dashboard - content will be implemented later -->
        <div class="flex h-full flex-1 flex-col p-6 lg:p-8">
            <!-- Placeholder for future content -->
             <div>
                <h1>welcome to dashboard</h1>
             </div>
        </div>
    </NuxtLayout>
</template>