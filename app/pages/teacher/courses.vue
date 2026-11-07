<script setup lang="ts">
import { onMounted } from 'vue'

// "My Teaching" is gone: courses you create (and the ones you take) live
// under My learning. Old links land there instead of a second, older list.
definePageMeta({ layout: false, middleware: ['auth'] })
useHead({ title: 'My learning · FocusFlow' })

onMounted(() => navigateTo('/learn', { replace: true }))
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16 text-center text-[15px] text-muted-foreground">
    Taking you to My learning…
  </div>
</template>
