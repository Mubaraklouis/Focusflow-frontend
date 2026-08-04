<script setup lang="ts">
import { computed } from 'vue';
import { useHead } from '#imports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Globe, Lock, Image as ImageIcon, Tag, Trash2, Users, LinkIcon, Send } from 'lucide-vue-next';
import { useCourseSettings } from '~/composables/courses/useCourseSettings';

definePageMeta({
    layout: false,
    middleware: ['auth'],
});

useHead({ title: 'Course Settings - FocusFlow' });

const route = useRoute();
const courseId = computed(() => route.query.id as string | undefined);

const breadcrumbs = [
    { title: 'Courses', href: '/courses' },
    { title: 'Settings', href: '/courses/settings', current: true },
];

const {
    form,
    loading,
    saving,
    deleting,
    error,
    thumbnailPreviewUrl,
    loadCourse,
    saveCourse,
    removeCourse,
    handleThumbnailUpload,
} = useCourseSettings();

const confirmingDelete = ref(false);

onMounted(async () => {
    if (!courseId.value) {
        await navigateTo('/courses');
        return;
    }
    try {
        await loadCourse(courseId.value);
    } catch {
        // error state rendered below
    }
});

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    handleThumbnailUpload(target.files?.[0] || null);
};

const setVisibility = (value: 'public' | 'private' | 'shared') => {
    form.value.course_visibility = value;
};

// Share Link Logic
const copied = ref(false);
const copyShareLink = async () => {
    if (!courseId.value) return;
    const url = `${window.location.origin}/courses/detail?id=${courseId.value}`;
    try {
        await navigator.clipboard.writeText(url);
        copied.value = true;
        setTimeout(() => copied.value = false, 2000);
    } catch (e) {
        console.error('Failed to copy', e);
    }
};

// Invite Users Logic
const inviteEmail = ref<string>('');
const isInviting = ref(false);
const inviteMessage = ref('');
const inviteSuccess = ref(false);

const sendInvite = async () => {
    if (!courseId.value || !inviteEmail.value) return;
    isInviting.value = true;
    inviteMessage.value = '';
    
    try {
        await $fetch(`/api/courses/course/${courseId.value}/invite`, {
            method: 'POST',
            body: { email: inviteEmail.value }
        });
        inviteSuccess.value = true;
        inviteMessage.value = 'Invitation sent successfully!';
        inviteEmail.value = '';
    } catch (e: any) {
        inviteSuccess.value = false;
        inviteMessage.value = e.data?.message || 'Failed to send invitation.';
    } finally {
        isInviting.value = false;
        setTimeout(() => { if (inviteSuccess.value) inviteMessage.value = '' }, 3000);
    }
};

const handleSave = async () => {
    if (!courseId.value) return;
    try {
        await saveCourse(courseId.value);
        await navigateTo('/courses');
    } catch {
        // error state rendered below
    }
};

const handleDelete = async () => {
    if (!courseId.value) return;
    try {
        await removeCourse(courseId.value);
        await navigateTo('/courses');
    } catch {
        // error state rendered below
    }
};

// The preview shows the freshly picked file, falling back to the saved cover.
const previewSrc = computed(() => thumbnailPreviewUrl.value || form.value.course_thumb || '');
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="container max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
            <!-- Header -->
            <div class="mb-6 sm:mb-8">
                <div class="flex items-center gap-3 mb-2">
                    <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Settings class="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Course Settings</h1>
                </div>
                <p class="text-sm sm:text-base text-muted-foreground">Manage visibility, details, and removal of your course</p>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="space-y-4 animate-pulse">
                <div class="h-40 bg-muted/60 rounded-xl"></div>
                <div class="h-12 bg-muted/60 rounded-lg"></div>
                <div class="h-32 bg-muted/60 rounded-lg"></div>
            </div>

            <template v-else>
                <!-- Error banner -->
                <div v-if="error" class="mb-6 bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                    {{ error }}
                </div>

                <!-- Visibility -->
                <Card class="border border-border dark:border-border/80 shadow-md dark:shadow-none mb-6">
                    <CardContent class="p-5 sm:p-6">
                        <h3 class="text-base sm:text-lg font-semibold text-foreground mb-1">Visibility</h3>
                        <p class="text-sm text-muted-foreground mb-4">Control who can discover this course.</p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                @click="setVisibility('public')"
                                :class="[
                                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-all',
                                    form.course_visibility === 'public'
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                        : 'border-border hover:border-primary/40'
                                ]"
                            >
                                <Globe class="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                                <span>
                                    <span class="block font-medium text-foreground">Public</span>
                                    <span class="block text-xs text-muted-foreground">Anyone can find and view this course.</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                @click="setVisibility('private')"
                                :class="[
                                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-all',
                                    form.course_visibility === 'private'
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                        : 'border-border hover:border-primary/40'
                                ]"
                            >
                                <Lock class="h-5 w-5 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                                <span>
                                    <span class="block font-medium text-foreground">Private</span>
                                    <span class="block text-xs text-muted-foreground">Only you can access this course.</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                @click="setVisibility('shared')"
                                :class="[
                                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-all',
                                    form.course_visibility === 'shared'
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                        : 'border-border hover:border-primary/40'
                                ]"
                            >
                                <Users class="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>
                                    <span class="block font-medium text-foreground">Shared</span>
                                    <span class="block text-xs text-muted-foreground">Hidden. Anyone with the link can view it.</span>
                                </span>
                            </button>
                        </div>

                        <!-- Copy Link Button (only for public or shared) -->
                        <div v-if="form.course_visibility === 'public' || form.course_visibility === 'shared'" class="mt-4 p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                            <div>
                                <h4 class="text-sm font-medium">Share Link</h4>
                                <p class="text-xs text-muted-foreground">Share this link with others to let them enroll.</p>
                            </div>
                            <Button variant="outline" size="sm" @click="copyShareLink" class="shrink-0 gap-2">
                                <LinkIcon class="h-4 w-4" />
                                {{ copied ? 'Copied!' : 'Copy Link' }}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <!-- Invitations -->
                <Card class="border border-border dark:border-border/80 shadow-md dark:shadow-none mb-6">
                    <CardContent class="p-5 sm:p-6">
                        <h3 class="text-base sm:text-lg font-semibold text-foreground mb-1">Invite Users</h3>
                        <p class="text-sm text-muted-foreground mb-4">Send an invitation email to users so they can join this course.</p>
                        <div class="flex gap-3">
                            <Input
                                v-model="inviteEmail"
                                type="email"
                                placeholder="Enter email address..."
                                class="flex-1 border-border focus-visible:border-primary/50 focus-visible:ring-primary/20"
                            />
                            <Button @click="sendInvite" :disabled="isInviting || !inviteEmail" class="shrink-0">
                                <Send class="h-4 w-4 mr-2" />
                                {{ isInviting ? 'Sending...' : 'Send Invite' }}
                            </Button>
                        </div>
                        <p v-if="inviteMessage" :class="inviteSuccess ? 'text-green-600 dark:text-green-400' : 'text-destructive'" class="text-sm mt-2">
                            {{ inviteMessage }}
                        </p>
                    </CardContent>
                </Card>

                <!-- Details -->
                <Card class="border border-border dark:border-border/80 shadow-md dark:shadow-none mb-6">
                    <CardContent class="p-5 sm:p-6 space-y-5">
                        <h3 class="text-base sm:text-lg font-semibold text-foreground">Course Details</h3>

                        <!-- Thumbnail -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-foreground/80">Cover Image (Optional)</label>
                            <div class="relative aspect-video bg-muted rounded-xl overflow-hidden border-2 border-dashed border-border/60 hover:border-primary/50 transition-all cursor-pointer group">
                                <img v-if="previewSrc" :src="previewSrc" alt="Course cover" class="absolute inset-0 w-full h-full object-cover" />
                                <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                    <ImageIcon class="h-10 w-10 mb-2 text-primary/70" />
                                    <p class="text-sm">Click to upload a cover</p>
                                </div>
                                <input type="file" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" @change="onFileChange" />
                            </div>
                        </div>

                        <!-- Title -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-foreground/80">Course Title</label>
                            <Input v-model="form.course_title" type="text" class="h-11 bg-background" placeholder="Course title" />
                        </div>

                        <!-- Category -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-foreground/80 flex items-center gap-2">
                                <Tag class="h-4 w-4 text-muted-foreground" /> Category
                            </label>
                            <select
                                v-model="form.course_category_id"
                                class="flex h-11 w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                            >
                                <option :value="null" disabled>Select a category</option>
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

                        <!-- Description -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-foreground/80">Description</label>
                            <textarea
                                v-model="form.course_description"
                                class="w-full h-28 rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                maxlength="500"
                                placeholder="Course description"
                            ></textarea>
                        </div>
                    </CardContent>
                </Card>

                <!-- Save actions -->
                <div class="flex justify-end gap-3 mb-10">
                    <NuxtLink to="/courses">
                        <Button variant="outline" class="h-10">Cancel</Button>
                    </NuxtLink>
                    <Button class="h-10" @click="handleSave" :disabled="saving">
                        {{ saving ? 'Saving...' : 'Save Changes' }}
                    </Button>
                </div>

                <!-- Danger zone -->
                <Card class="border border-destructive/40 shadow-sm">
                    <CardContent class="p-5 sm:p-6">
                        <h3 class="text-base font-semibold text-destructive flex items-center gap-2 mb-1">
                            <Trash2 class="h-4 w-4" /> Danger Zone
                        </h3>
                        <p class="text-sm text-muted-foreground mb-4">Deleting a course is permanent and cannot be undone.</p>

                        <div v-if="!confirmingDelete">
                            <Button variant="outline" class="border-destructive/50 text-destructive hover:bg-destructive/10" @click="confirmingDelete = true">
                                Delete Course
                            </Button>
                        </div>
                        <div v-else class="flex flex-col sm:flex-row sm:items-center gap-3">
                            <p class="text-sm font-medium text-foreground">Are you sure?</p>
                            <div class="flex gap-2">
                                <Button variant="outline" class="h-9" @click="confirmingDelete = false" :disabled="deleting">Cancel</Button>
                                <Button class="h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground" @click="handleDelete" :disabled="deleting">
                                    {{ deleting ? 'Deleting...' : 'Yes, delete' }}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </template>
        </div>
    </NuxtLayout>
</template>
