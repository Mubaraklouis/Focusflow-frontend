<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useHead } from '#imports';
import {
    Settings2,
    User as UserIcon,
    Lock,
    ShieldCheck,
    LogOut,
    Camera,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    Bell,
    Globe,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile, useProfileApi, useProfileEdit, useProfileUtils } from '~/composables/Profile';
import { toProxiedAvatar } from '~/utils/thumbUrl';

useHead({
    title: 'Settings - FocusFlow'
});

definePageMeta({
    layout: false,
    middleware: ['auth']
});

const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Settings', href: '/settings', current: true }
];

const { profile } = useProfile();
const { fetchProfile, updateProfile, uploadAvatar } = useProfileApi();
const { setAvatarFile, avatarPreview } = useProfileEdit();
const { getInitials } = useProfileUtils();

// ------------------------------------------------------------- Profile
const profileForm = ref({ name: '', username: '', bio: '', location: '', website: '' });
watch(profile, (p) => {
    profileForm.value = {
        name: p.name,
        username: p.username,
        bio: p.bio,
        location: p.location,
        website: p.website,
    };
}, { immediate: true });

const profileSaving = ref(false);
const profileSaved = ref(false);
const profileError = ref<string | null>(null);

const saveProfile = async () => {
    profileSaving.value = true;
    profileSaved.value = false;
    profileError.value = null;
    try {
        const ok = await updateProfile(profileForm.value);
        if (!ok) throw new Error('Failed to update profile');
        profileSaved.value = true;
        setTimeout(() => (profileSaved.value = false), 2500);
    } catch (e: any) {
        profileError.value = e.message || 'Failed to update profile';
    } finally {
        profileSaving.value = false;
    }
};

// ------------------------------------------------------------- Avatar
const avatarUploading = ref(false);
const avatarMessage = ref<{ ok: boolean; text: string } | null>(null);

const onAvatarChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    avatarMessage.value = null;

    if (!file.type.startsWith('image/')) {
        avatarMessage.value = { ok: false, text: 'Please select an image file' };
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        avatarMessage.value = { ok: false, text: 'Image size should be less than 5MB' };
        return;
    }

    setAvatarFile(file);
    avatarUploading.value = true;
    try {
        const ok = await uploadAvatar(file);
        if (!ok) throw new Error('Failed to upload avatar');
        await fetchProfile();
        avatarMessage.value = { ok: true, text: 'Avatar updated' };
        setTimeout(() => (avatarMessage.value = null), 2500);
    } catch (e: any) {
        avatarMessage.value = { ok: false, text: e.message || 'Failed to upload avatar' };
    } finally {
        avatarUploading.value = false;
    }
};

const avatarSrc = computed(() => avatarPreview.value || toProxiedAvatar(profile.value.avatar) || '');
const avatarFallback = computed(() => getInitials(profile.value.name || 'U'));

// ------------------------------------------------------------- Security
const passwordForm = ref({ current_password: '', password: '', password_confirmation: '' });
const passwordSaving = ref(false);
const passwordMessage = ref<{ ok: boolean; text: string } | null>(null);

const changePassword = async () => {
    passwordMessage.value = null;
    if (!passwordForm.value.current_password) {
        passwordMessage.value = { ok: false, text: 'Current password is required' };
        return;
    }
    if (passwordForm.value.password.length < 8) {
        passwordMessage.value = { ok: false, text: 'New password must be at least 8 characters' };
        return;
    }
    if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
        passwordMessage.value = { ok: false, text: 'New passwords do not match' };
        return;
    }

    passwordSaving.value = true;
    try {
        await $fetch('/api/user/password', { method: 'PUT', body: passwordForm.value });
        passwordMessage.value = { ok: true, text: 'Password updated successfully' };
        passwordForm.value = { current_password: '', password: '', password_confirmation: '' };
    } catch (e: any) {
        passwordMessage.value = { ok: false, text: e.data?.message || e.message || 'Failed to change password' };
    } finally {
        passwordSaving.value = false;
    }
};

const loggingOut = ref(false);
const logout = async () => {
    loggingOut.value = true;
    try {
        await $fetch('/api/user/logout', { method: 'POST' });
    } catch {
        // ignore — navigate regardless
    }
    await navigateTo('/login');
};

// ------------------------------------------------------------- Preferences
const PREF_KEYS = {
    defaultVisibility: 'focusflow.prefs.default-visibility',
    emailNotifications: 'focusflow.prefs.email-notifications',
    publicProfile: 'focusflow.prefs.public-profile',
} as const;

const defaultVisibility = ref<'public' | 'private'>('private');
const emailNotifications = ref(true);
const publicProfile = ref(true);

if (import.meta.client) {
    defaultVisibility.value = window.localStorage.getItem(PREF_KEYS.defaultVisibility) === 'public' ? 'public' : 'private';
    emailNotifications.value = window.localStorage.getItem(PREF_KEYS.emailNotifications) !== 'false';
    publicProfile.value = window.localStorage.getItem(PREF_KEYS.publicProfile) !== 'false';
}
watch(defaultVisibility, (v) => import.meta.client && window.localStorage.setItem(PREF_KEYS.defaultVisibility, v));
watch(emailNotifications, (v) => import.meta.client && window.localStorage.setItem(PREF_KEYS.emailNotifications, String(v)));
watch(publicProfile, (v) => import.meta.client && window.localStorage.setItem(PREF_KEYS.publicProfile, String(v)));
</script>

<template>
    <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
        <div class="container max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 transition-colors space-y-6">
            <!-- Header -->
            <div class="mb-2">
                <div class="flex items-center gap-3 mb-2">
                    <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Settings2 class="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                </div>
                <p class="text-sm sm:text-base text-muted-foreground">Manage your profile, security and preferences</p>
            </div>

            <!-- Profile -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <UserIcon class="h-4 w-4" /> Profile
                    </CardTitle>
                    <CardDescription>How you appear across FocusFlow</CardDescription>
                </CardHeader>
                <CardContent class="space-y-5">
                    <div class="flex items-center gap-4">
                        <div class="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-bold overflow-hidden ring-2 ring-border shrink-0">
                            <img v-if="avatarSrc" :src="avatarSrc" :alt="profile.name" class="h-full w-full object-cover" />
                            <span v-else>{{ avatarFallback }}</span>
                        </div>
                        <div class="space-y-1.5">
                            <div>
                                <Label for="avatar-upload" class="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <Camera class="h-4 w-4" />
                                    <template v-if="avatarUploading"><Loader2 class="h-4 w-4 animate-spin" /> Uploading&hellip;</template>
                                    <template v-else>Change photo</template>
                                </Label>
                                <input id="avatar-upload" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
                            </div>
                            <p v-if="avatarMessage" class="text-xs flex items-center gap-1" :class="avatarMessage.ok ? 'text-emerald-600' : 'text-destructive'">
                                <CheckCircle2 v-if="avatarMessage.ok" class="h-3.5 w-3.5" />
                                <AlertCircle v-else class="h-3.5 w-3.5" />
                                {{ avatarMessage.text }}
                            </p>
                        </div>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="space-y-1.5">
                            <Label for="p-name">Full name</Label>
                            <Input id="p-name" v-model="profileForm.name" />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="p-username">Username</Label>
                            <Input id="p-username" v-model="profileForm.username" />
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <Label for="p-bio">Bio</Label>
                        <textarea id="p-bio" v-model="profileForm.bio" rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Tell students about yourself" />
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="space-y-1.5">
                            <Label for="p-location">Location</Label>
                            <Input id="p-location" v-model="profileForm.location" placeholder="City, Country" />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="p-website">Website</Label>
                            <Input id="p-website" v-model="profileForm.website" placeholder="https://&hellip;" />
                        </div>
                    </div>

                    <div class="flex items-center gap-3 pt-1">
                        <Button :disabled="profileSaving" @click="saveProfile">
                            <Loader2 v-if="profileSaving" class="mr-2 h-4 w-4 animate-spin" />
                            {{ profileSaving ? 'Saving&hellip;' : 'Save changes' }}
                        </Button>
                        <p v-if="profileSaved" class="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 class="h-4 w-4" /> Saved</p>
                        <p v-if="profileError" class="text-sm text-destructive flex items-center gap-1"><AlertCircle class="h-4 w-4" /> {{ profileError }}</p>
                    </div>
                </CardContent>
            </Card>

            <!-- Security -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Lock class="h-4 w-4" /> Security
                    </CardTitle>
                    <CardDescription>Change your password or sign out</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid gap-4 sm:grid-cols-3">
                        <div class="space-y-1.5">
                            <Label for="pw-current">Current password</Label>
                            <Input id="pw-current" type="password" v-model="passwordForm.current_password" autocomplete="current-password" />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="pw-new">New password</Label>
                            <Input id="pw-new" type="password" v-model="passwordForm.password" autocomplete="new-password" placeholder="Min 8 characters" />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="pw-confirm">Confirm new password</Label>
                            <Input id="pw-confirm" type="password" v-model="passwordForm.password_confirmation" autocomplete="new-password" />
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <Button :disabled="passwordSaving" @click="changePassword">
                            <Loader2 v-if="passwordSaving" class="mr-2 h-4 w-4 animate-spin" />
                            {{ passwordSaving ? 'Updating&hellip;' : 'Update password' }}
                        </Button>
                        <Button variant="outline" :disabled="loggingOut" @click="logout">
                            <LogOut class="mr-2 h-4 w-4" />
                            {{ loggingOut ? 'Signing out&hellip;' : 'Sign out' }}
                        </Button>
                    </div>
                    <p v-if="passwordMessage" class="text-sm flex items-center gap-1" :class="passwordMessage.ok ? 'text-emerald-600' : 'text-destructive'">
                        <CheckCircle2 v-if="passwordMessage.ok" class="h-4 w-4" />
                        <AlertCircle v-else class="h-4 w-4" />
                        {{ passwordMessage.text }}
                    </p>
                </CardContent>
            </Card>

            <!-- Preferences -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <ShieldCheck class="h-4 w-4" /> Preferences
                    </CardTitle>
                    <CardDescription>Defaults applied when you create courses</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div class="flex items-start gap-3">
                            <Eye class="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p class="text-sm font-medium">Default course visibility</p>
                                <p class="text-xs text-muted-foreground">Applied to every new course you create</p>
                            </div>
                        </div>
                        <div class="inline-flex rounded-md border border-input bg-muted p-1 shrink-0">
                            <button type="button" class="rounded px-3 py-1 text-xs font-medium transition-colors" :class="defaultVisibility === 'private' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'" @click="defaultVisibility = 'private'">Private</button>
                            <button type="button" class="rounded px-3 py-1 text-xs font-medium transition-colors" :class="defaultVisibility === 'public' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'" @click="defaultVisibility = 'public'">Public</button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div class="flex items-start gap-3">
                            <Bell class="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p class="text-sm font-medium">Email notifications</p>
                                <p class="text-xs text-muted-foreground">Receive emails about invites and course activity</p>
                            </div>
                        </div>
                        <Checkbox :checked="emailNotifications" @update:checked="(v) => emailNotifications = Boolean(v)" />
                    </div>
                    <div class="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div class="flex items-start gap-3">
                            <Globe class="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p class="text-sm font-medium">Public profile</p>
                                <p class="text-xs text-muted-foreground">Show my profile and courses to other students</p>
                            </div>
                        </div>
                        <Checkbox :checked="publicProfile" @update:checked="(v) => publicProfile = Boolean(v)" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </NuxtLayout>
</template>
