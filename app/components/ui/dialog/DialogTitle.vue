<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { DialogTitle } from 'radix-vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <DialogTitle :class="cn('text-lg font-semibold text-card-foreground', props.class)">
    <slot />
  </DialogTitle>
</template>
