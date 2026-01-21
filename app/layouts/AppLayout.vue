<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppSidebar from '@/components/dashboard/AppSidebar.vue';
import AppHeader from '@/components/dashboard/AppHeader.vue';
import { useProfile, useProfileApi } from '~/composables/Profile';

interface Breadcrumb {
    title: string;
    href?: string;
    current?: boolean;
}

defineProps<{
    breadcrumbs?: Breadcrumb[];
}>();

// Mobile sidebar state
const isMobileSidebarOpen = ref(false);

// Sidebar collapsed state
const isSidebarCollapsed = ref(false);

// Get user data from profile composable
const { profile } = useProfile();
const { fetchProfile } = useProfileApi();

// Fetch profile data - runs immediately on client
if (import.meta.client) {
    fetchProfile();
}

// Computed user object for sidebar
const user = computed(() => ({
    name: profile.value.name || 'Loading...',
    email: profile.value.email,
    avatar: profile.value.avatar || undefined
}));

const toggleMobileSidebar = () => {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
    isMobileSidebarOpen.value = false;
};

const toggleSidebarCollapse = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
</script>

<template>
    <div class="flex h-screen bg-background">
        <!-- Desktop Sidebar -->
        <div class="hidden lg:flex">
            <AppSidebar 
                :collapsed="isSidebarCollapsed"
                :user="user"
                @toggle-collapse="toggleSidebarCollapse"
            />
        </div>

        <!-- Mobile Sidebar Overlay -->
        <Teleport to="body">
            <Transition name="fade">
                <div 
                    v-if="isMobileSidebarOpen" 
                    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                    @click="closeMobileSidebar"
                />
            </Transition>
        </Teleport>

        <!-- Mobile Sidebar -->
        <Teleport to="body">
            <Transition name="slide">
                <div 
                    v-if="isMobileSidebarOpen" 
                    class="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
                >
                    <AppSidebar 
                        :user="user"
                        @close-mobile="closeMobileSidebar"
                    />
                </div>
            </Transition>
        </Teleport>

        <!-- Main Content Area -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Header -->
            <AppHeader 
                :breadcrumbs="breadcrumbs"
                :user="user"
                @toggle-sidebar="toggleMobileSidebar"
            />

            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto">
                <slot />
            </main>
        </div>
    </div>
</template>

<style scoped>
/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Slide transition for mobile sidebar */
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
}
</style>
