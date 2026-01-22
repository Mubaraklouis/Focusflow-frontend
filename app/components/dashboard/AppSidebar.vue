<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    LayoutDashboard,
    Timer,
    BookOpen,
    ListTodo,
    Target,
    Settings,
    Command,
    X,
    Sparkles,
    LogOut,
    PanelLeftOpen,
    ChevronRight
} from 'lucide-vue-next';
import { useLogout } from '~/composables/Auth/useLogout';

interface NavItem {
    title: string;
    icon: any;
    href: string;
}

const props = defineProps<{
    collapsed?: boolean;
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
}>();

const emit = defineEmits<{
    (e: 'toggle-collapse'): void;
    (e: 'close-mobile'): void;
}>();

const isCollapsed = ref(props.collapsed || false);

const navigationItems: NavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { title: 'Focus Sessions', icon: Timer, href: '/focus' },
    { title: 'Courses', icon: BookOpen, href: '/courses' },
    { title: 'Tasks', icon: ListTodo, href: '/tasks' },
    { title: 'Goals', icon: Target, href: '/goals' },
];

const route = useRoute();

const isActiveRoute = (href: string) => {
    return route.path === href;
};

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    emit('toggle-collapse');
};

const userInitials = computed(() => {
    const name = props.user?.name || 'User';
    // Split name and get first letter of each word (e.g., "John Doe" -> "JD")
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // If single name, return first two letters
    return name.substring(0, 2).toUpperCase();
});

// Logout functionality
const { logout, isLoggingOut } = useLogout();

const handleLogout = async () => {
    await logout();
};
</script>

<template>
    <aside
        class="relative flex h-full flex-col border-r border-border bg-card shadow-sm transition-all duration-300 ease-in-out"
        :class="isCollapsed ? 'w-[72px]' : 'w-[240px]'"
    >
        <!-- Header with Logo -->
        <div class="flex h-16 items-center px-4" :class="isCollapsed ? 'justify-center' : 'justify-between'">
            <NuxtLink to="/" class="flex items-center gap-3">
                <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md transition-transform hover:scale-105">
                    <Sparkles class="h-4 w-4" />
                </div>
                <span 
                    v-if="!isCollapsed" 
                    class="whitespace-nowrap text-lg font-semibold text-foreground"
                >
                    FocusFlow
                </span>
            </NuxtLink>
            
            <!-- Collapse toggle button (desktop only) - shown when expanded -->
            <button
                v-if="!isCollapsed"
                @click="toggleCollapse"
                class="hidden items-center gap-1 rounded-lg border border-border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary lg:flex"
                title="Collapse (⌘B)"
            >
                <Command class="h-3 w-3" />
                <span class="font-medium">B</span>
            </button>

            <!-- Close button (mobile only) -->
            <button
                v-if="!isCollapsed"
                @click="$emit('close-mobile')"
                class="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary lg:hidden"
            >
                <X class="h-5 w-5" />
            </button>
        </div>

        <!-- Expand button when collapsed -->
        <div v-if="isCollapsed" class="hidden px-3 py-2 lg:block">
            <button
                @click="toggleCollapse"
                class="flex w-full items-center justify-center rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                title="Expand (⌘B)"
            >
                <PanelLeftOpen class="h-4 w-4" />
            </button>
        </div>

        <!-- Main Navigation -->
        <nav class="flex-1 space-y-1 px-3 py-4">
            <NuxtLink
                v-for="item in navigationItems"
                :key="item.href"
                :to="item.href"
                class="nav-link group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                :class="[
                    isActiveRoute(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                    isCollapsed ? 'justify-center' : ''
                ]"
                :title="isCollapsed ? item.title : undefined"
            >
                <component 
                    :is="item.icon" 
                    class="h-5 w-5 flex-shrink-0 transition-all duration-200"
                    :class="isActiveRoute(item.href) ? '' : 'group-hover:scale-110'"
                />
                <span 
                    v-if="!isCollapsed" 
                    class="flex-1 whitespace-nowrap"
                >
                    {{ item.title }}
                </span>
                <!-- Arrow indicator on hover -->
                <ChevronRight 
                    v-if="!isCollapsed && !isActiveRoute(item.href)"
                    class="h-4 w-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1"
                />
            </NuxtLink>
        </nav>

        <!-- Bottom Section -->
        <div class="border-t border-border px-3 py-4 space-y-2">
            <!-- Settings -->
            <NuxtLink
                to="/settings"
                class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                :class="isCollapsed ? 'justify-center' : ''"
                :title="isCollapsed ? 'Settings' : undefined"
            >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70 transition-all duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                    <Settings class="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                </div>
                <span v-if="!isCollapsed" class="whitespace-nowrap">Settings</span>
            </NuxtLink>

            <!-- Logout -->
            <button
                @click="handleLogout"
                :disabled="isLoggingOut"
                class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="isCollapsed ? 'justify-center' : ''"
                :title="isCollapsed ? 'Logout' : undefined"
            >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70 transition-all duration-200 group-hover:bg-red-500/20 group-hover:text-red-500">
                    <LogOut class="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                </div>
                <span v-if="!isCollapsed" class="whitespace-nowrap">
                    {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
                </span>
            </button>

            <!-- User Profile Card -->
            <NuxtLink
                to="/profile"
                class="group mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r from-muted/80 to-muted/50 p-3 transition-all duration-200 hover:from-primary/10 hover:to-primary/5"
                :class="isCollapsed ? 'justify-center p-2' : ''"
                :title="isCollapsed ? 'View Profile' : undefined"
            >
                <div class="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md overflow-hidden">
                    <!-- Show avatar image if available -->
                    <img 
                        v-if="user?.avatar" 
                        :src="user.avatar" 
                        :alt="user?.name"
                        class="h-full w-full object-cover"
                    />
                    <!-- Show initials if no avatar -->
                    <span v-else class="text-sm font-bold">{{ userInitials }}</span>
                    <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
                </div>
                <div v-if="!isCollapsed" class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-foreground">{{ user?.name || 'Loading...' }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ user?.email }}</p>
                </div>
                <ChevronRight v-if="!isCollapsed" class="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
            </NuxtLink>
        </div>
    </aside>
</template>

<style scoped>
.nav-link {
    position: relative;
    overflow: hidden;
}

.nav-link::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(var(--primary), 0.05), transparent);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.nav-link:hover::before {
    transform: translateX(100%);
}
</style>
