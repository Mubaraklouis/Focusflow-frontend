<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useLearn, apiError } from '~/composables/learn/useLearn'

// The old single builder page: opens the step the course is at
// (no materials → upload, materials but no units → organise, else review).
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const error = ref('')

onMounted(async () => {
  try {
    const v = await useLearn().course(courseId)
    if (v.role !== 'creator') return navigateTo(`/learn/${courseId}`, { replace: true })
    const step = v.units.length ? 'review' : v.materials.length ? 'organise' : 'upload'
    await navigateTo(`/learn/${courseId}/${step}`, { replace: true })
  } catch (e) {
    error.value = apiError(e, 'Could not load this course.')
  }
})
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="[{ title: 'My learning', href: '/learn' }]">
    <div class="mx-auto max-w-2xl px-4 py-12">
      <div v-if="error" class="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
        {{ error }} <NuxtLink to="/learn" class="ml-2 underline">Back to my courses</NuxtLink>
      </div>
      <div v-else class="space-y-3" aria-busy="true">
        <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  </NuxtLayout>
</template>
