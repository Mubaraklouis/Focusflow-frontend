<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { initTheme } = useTheme();

// Initialize theme
initTheme();

// Prevent flash of wrong theme
useHead({
  // Guarantee a mobile viewport even if the default head is ever overridden.
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  ],
  script: [
    {
      innerHTML: `(function() {
        try {
          var savedTheme = localStorage.getItem('focusflow-theme');
          var isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {}
      })()`
    }
  ]
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
