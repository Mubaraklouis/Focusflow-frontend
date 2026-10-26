<script setup lang="ts">
// iOS-style switch (skill §9: yes/no is a switch with role="switch").
defineProps<{ modelValue: boolean; label: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button type="button" role="switch" :aria-checked="modelValue" :aria-label="label" :disabled="disabled"
    class="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-40"
    :class="modelValue ? 'bg-primary' : 'bg-foreground/15'" @click="emit('update:modelValue', !modelValue)">
    <span class="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-200" :class="modelValue ? 'translate-x-5' : ''" />
  </button>
</template>
