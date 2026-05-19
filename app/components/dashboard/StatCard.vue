<script setup lang="ts">
/**
 * @module components/dashboard/StatCard
 * Single tile in the top-row stats strip. Dumb — the parent owns the value.
 */
defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  icon: any;
  /** Optional accent class for the icon (e.g. emerald for streak). */
  tone?: string;
}>();
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
    <div class="flex items-center gap-2.5">
      <component :is="icon" class="h-4 w-4" :class="tone || 'text-muted-foreground'" />
      <p class="text-sm font-medium text-muted-foreground">{{ label }}</p>
    </div>
    <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 text-xs text-muted-foreground">
      {{ hint }}
    </p>
  </div>
</template>
