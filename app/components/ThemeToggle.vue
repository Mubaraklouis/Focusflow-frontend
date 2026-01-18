<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { Moon, Sun } from 'lucide-vue-next';

const { isDark, toggleTheme } = useTheme();
</script>

<template>
    <button
        @click="toggleTheme"
        class="relative flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Light mode' : 'Dark mode'"
    >
        <Sun 
            class="h-5 w-5 transition-all duration-300"
            :class="isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0 absolute'"
        />
        <Moon 
            class="h-5 w-5 transition-all duration-300"
            :class="!isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0 absolute'"
        />
    </button>
</template>
