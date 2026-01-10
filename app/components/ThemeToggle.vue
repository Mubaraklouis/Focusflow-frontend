<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { Moon, Sun } from 'lucide-vue-next';

const { isDark, toggleTheme } = useTheme();
</script>

<template>
    <button
        @click="toggleTheme"
        class="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Light mode' : 'Dark mode'"
    >
        <Sun v-if="isDark" class="h-5 w-5" />
        <Moon v-else class="h-5 w-5" />
    </button>
</template>
