<script setup lang="ts">
import { computed } from 'vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import {
    Menu,
    Search,
    ChevronRight,
    Home,
    Command
} from 'lucide-vue-next';
import NotificationsPopover from './NotificationsPopover.vue';

interface Breadcrumb {
    title: string;
    href?: string;
    current?: boolean;
}

const props = defineProps<{
    breadcrumbs?: Breadcrumb[];
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
}>();

const emit = defineEmits<{
    (e: 'toggle-sidebar'): void;
}>();
</script>

<template>
    <header class="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border/40 bg-background/95 px-4 backdrop-blur-sm lg:px-6">
        <!-- Left side (shrinks first, so long titles never push the icons off) -->
        <div class="flex min-w-0 flex-1 items-center gap-4">
            <!-- Mobile menu toggle -->
            <button
                @click="$emit('toggle-sidebar')"
                class="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
                <Menu class="h-5 w-5" />
            </button>

            <!-- Breadcrumbs -->
            <!-- One line; long names are cut with "…" and shown in full on hover -->
            <nav v-if="breadcrumbs && breadcrumbs.length > 0" aria-label="Breadcrumb" class="hidden min-w-0 items-center gap-1 whitespace-nowrap text-sm sm:flex">
                <NuxtLink 
                    to="/" 
                    aria-label="Home"
                    class="flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Home class="h-4 w-4" />
                </NuxtLink>
                
                <template v-for="(crumb, index) in breadcrumbs" :key="index">
                    <ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    <NuxtLink
                        v-if="crumb.href && !crumb.current"
                        :to="crumb.href"
                        :title="crumb.title"
                        class="max-w-[10rem] shrink-0 truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {{ crumb.title }}
                    </NuxtLink>
                    <span v-else :title="crumb.title" aria-current="page" class="min-w-0 truncate font-medium text-foreground">
                        {{ crumb.title }}
                    </span>
                </template>
            </nav>

            <!-- Page title on mobile -->
            <h1 v-if="breadcrumbs && breadcrumbs.length > 0" class="min-w-0 truncate text-base font-medium text-foreground sm:hidden">
                {{ breadcrumbs[breadcrumbs.length - 1]?.title || 'Dashboard' }}
            </h1>
        </div>

        <!-- Right side -->
        <div class="flex shrink-0 items-center gap-2">
            <!-- Search bar -->
            <div class="hidden items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 transition-colors hover:bg-muted/50 md:flex">
                <Search class="h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    class="w-36 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none lg:w-48"
                />
                <div class="flex items-center gap-0.5 rounded border border-border/50 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Command class="h-2.5 w-2.5" />
                    K
                </div>
            </div>

            <!-- Search button (mobile) -->
            <button class="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden">
                <Search class="h-5 w-5" />
            </button>

            <!-- Notifications -->
            <NotificationsPopover />

            <!-- Theme toggle -->
            <ThemeToggle />
        </div>
    </header>
</template>
