<script setup lang="ts">
defineProps<{
    href: string;
}>();
</script>

<template>
    <NuxtLink :to="href" class="font-medium text-primary hover:text-primary/80 transition-colors duration-200">
        <slot />
    </NuxtLink>
</template>
