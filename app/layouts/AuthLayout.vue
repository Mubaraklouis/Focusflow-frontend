<script setup lang="ts">
import AuthSimpleLayout from '@/components/Auth/AuthSimpleLayout.vue';
import AuthCardLayout from '@/components/Auth/AuthLayoutCard.vue';
import AuthSplitLayout from '@/components/Auth/AuthSplitLayout.vue';

defineProps<{
    title?: string;
    description?: string;
    variant?: 'simple' | 'card' | 'split';
    class?: string;
}>();
</script>

<template>
    <component
        :is="variant === 'card' ? AuthCardLayout : variant === 'split' ? AuthSplitLayout : AuthSimpleLayout"
        :title="title"
        :description="description"
        :class="$attrs.class"
    >
        <slot />
    </component>
</template>
