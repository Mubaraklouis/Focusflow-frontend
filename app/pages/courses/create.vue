<script setup lang="ts">
import { onMounted } from 'vue'

// The old course form is retired. New courses start in the builder, which
// reads your materials and builds the units.
definePageMeta({ layout: false, middleware: ['auth'] })
useHead({ title: 'Create a course · FocusFlow' })

onMounted(() => navigateTo('/learn/new', { replace: true }))
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16 text-center text-[15px] text-muted-foreground">
    Taking you to the course builder…
  </div>
</template>
