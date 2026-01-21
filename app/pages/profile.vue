<script setup lang="ts">
/**
 * @fileoverview User Profile Page
 * @description
 * Displays user profile information with edit functionality.
 * Clean, minimal design inspired by modern applications.
 */

import { useHead } from '#imports';
import { onMounted } from 'vue';
import {
    MapPin,
    Link as LinkIcon,
    Calendar,
    Mail,
    Check
} from 'lucide-vue-next';
import {
    useProfile,
    useProfileEdit,
    useProfileApi,
    useProfileUtils
} from '~/composables/Profile';

// Page metadata
useHead({
    title: 'Profile - FocusFlow'
});

definePageMeta({
    layout: false,
    middleware: 'auth'
});

// Breadcrumb navigation
const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Profile', href: '/profile', current: true },
];

// Composables
const { profile, isLoading, error } = useProfile();
const { isEditMode, isSaving, editForm, toggleEditMode, cancelEdit, saveChanges } = useProfileEdit();
const { fetchProfile } = useProfileApi();
const { formatDate, getInitials } = useProfileUtils();

// Load profile data on mount
onMounted(async () => {
    await fetchProfile();
});

/**
 * Handles save button click
 */
const handleSave = async (): Promise<void> => {
    await saveChanges();
};
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="min-h-full bg-background">
            <!-- Loading -->
            <div v-if="isLoading" class="flex h-80 items-center justify-center">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>

            <!-- Error -->
            <div v-else-if="error" class="flex h-80 items-center justify-center">
                <p class="text-muted-foreground">{{ error }}</p>
            </div>

            <!-- Profile -->
            <div v-else class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
                <!-- Header Section -->
                <div class="mb-8">
                    <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                        <!-- Avatar -->
                        <div class="relative">
                            <div class="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                                <img 
                                    v-if="profile.avatar" 
                                    :src="profile.avatar" 
                                    :alt="profile.name"
                                    class="h-full w-full rounded-full object-cover"
                                />
                                <span v-else class="text-2xl font-medium text-primary">
                                    {{ getInitials(profile.name) }}
                                </span>
                            </div>
                        </div>

                        <!-- Info -->
                        <div class="flex-1 text-center sm:text-left">
                            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h1 v-if="!isEditMode" class="text-xl font-medium text-foreground">
                                        {{ profile.name }}
                                    </h1>
                                    <input
                                        v-else
                                        v-model="editForm.name"
                                        type="text"
                                        class="w-full border-b border-border bg-transparent py-1 text-xl font-medium text-foreground outline-none focus:border-primary"
                                    />
                                    <p class="mt-1 text-sm text-muted-foreground">{{ profile.email }}</p>
                                </div>

                                <!-- Actions -->
                                <div class="flex justify-center gap-2 sm:justify-start">
                                    <button
                                        v-if="!isEditMode"
                                        @click="toggleEditMode"
                                        class="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        Edit profile
                                    </button>
                                    <template v-else>
                                        <button
                                            @click="handleSave"
                                            :disabled="isSaving"
                                            class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {{ isSaving ? 'Saving...' : 'Save' }}
                                        </button>
                                        <button
                                            @click="cancelEdit"
                                            :disabled="isSaving"
                                            class="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </template>
                                </div>
                            </div>

                            <!-- Bio -->
                            <div class="mt-4">
                                <p v-if="!isEditMode" class="text-sm text-muted-foreground">
                                    {{ profile.bio || 'Add a bio to tell people about yourself.' }}
                                </p>
                                <textarea
                                    v-else
                                    v-model="editForm.bio"
                                    placeholder="Tell us about yourself..."
                                    rows="2"
                                    class="w-full resize-none border-b border-border bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-border" />

                <!-- Details Section -->
                <div class="py-6">
                    <h2 class="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Details
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- Location -->
                        <div class="flex items-center gap-3">
                            <MapPin class="h-5 w-5 text-muted-foreground" />
                            <div class="flex-1">
                                <span v-if="!isEditMode" class="text-sm text-foreground">
                                    {{ profile.location || 'Add location' }}
                                </span>
                                <input
                                    v-else
                                    v-model="editForm.location"
                                    type="text"
                                    placeholder="Your location"
                                    class="w-full border-b border-border bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                />
                            </div>
                        </div>

                        <!-- Website -->
                        <div class="flex items-center gap-3">
                            <LinkIcon class="h-5 w-5 text-muted-foreground" />
                            <div class="flex-1">
                                <a 
                                    v-if="!isEditMode && profile.website"
                                    :href="profile.website" 
                                    target="_blank" 
                                    class="text-sm text-primary hover:underline"
                                >
                                    {{ profile.website.replace(/^https?:\/\//, '') }}
                                </a>
                                <span v-else-if="!isEditMode" class="text-sm text-muted-foreground">
                                    Add website
                                </span>
                                <input
                                    v-else
                                    v-model="editForm.website"
                                    type="url"
                                    placeholder="https://yourwebsite.com"
                                    class="w-full border-b border-border bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                />
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="flex items-center gap-3">
                            <Mail class="h-5 w-5 text-muted-foreground" />
                            <span class="text-sm text-foreground">{{ profile.email }}</span>
                        </div>

                        <!-- Joined -->
                        <div class="flex items-center gap-3">
                            <Calendar class="h-5 w-5 text-muted-foreground" />
                            <span class="text-sm text-muted-foreground">
                                Joined {{ formatDate(profile.joinedDate) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-border" />

                <!-- Achievements Section -->
                <div class="py-6">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Achievements
                        </h2>
                        <span class="text-xs text-muted-foreground">
                            {{ profile.achievements?.length || 0 }} earned
                        </span>
                    </div>

                    <div v-if="profile.achievements?.length" class="grid gap-3 sm:grid-cols-2">
                        <div
                            v-for="achievement in profile.achievements"
                            :key="achievement.id"
                            class="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                                {{ achievement.icon }}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-medium text-foreground">{{ achievement.title }}</p>
                                <p class="truncate text-xs text-muted-foreground">{{ achievement.description }}</p>
                            </div>
                            <Check class="h-4 w-4 text-emerald-500" />
                        </div>
                    </div>

                    <div v-else class="py-8 text-center">
                        <p class="text-sm text-muted-foreground">No achievements yet</p>
                    </div>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>
