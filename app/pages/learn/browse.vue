<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Compass, Search, Layers, Users } from 'lucide-vue-next'
import { useLearn, apiError, type LearnCourse } from '~/composables/learn/useLearn'

useHead({ title: 'Browse courses - FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'My learning', href: '/learn' },
  { title: 'Browse', href: '/learn/browse', current: true },
]

const api = useLearn()
const courses = ref<(LearnCourse & { units: number; learners: number })[]>([])
const q = ref('')
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    courses.value = await api.browse(q.value.trim() || undefined)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

let timer: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <h1 class="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
        <Compass class="h-6 w-6" /> Browse courses
      </h1>
      <p class="text-muted-foreground mb-6">Free courses made by the FocusFlow community.</p>

      <div class="relative mb-6">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="q" type="text" placeholder="Search by title or topic" class="pl-10 w-full bg-background" />
      </div>

      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
        <div v-for="i in 6" :key="i" class="h-36 rounded-lg bg-muted/60" />
      </div>
      <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-lg">
        {{ error }} <Button variant="outline" class="ml-3" @click="load">Try again</Button>
      </div>
      <div v-else-if="!courses.length" class="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
        {{ q ? 'No courses match your search.' : 'No public courses yet. Be the first to publish one!' }}
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="c in courses" :key="c.course_id" :to="`/learn/${c.course_id}`"
          class="flex flex-col rounded-lg border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all">
          <span v-if="c.category?.category_name" class="text-xs text-primary font-medium mb-1">{{ c.category.category_name }}</span>
          <h3 class="font-semibold text-foreground line-clamp-2">{{ c.course_title }}</h3>
          <p class="mt-1 text-sm text-muted-foreground line-clamp-3 flex-1">{{ c.course_description }}</p>
          <div class="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><Layers class="h-3.5 w-3.5" />{{ c.units }} units</span>
            <span class="flex items-center gap-1"><Users class="h-3.5 w-3.5" />{{ c.learners }} learners</span>
            <span class="ml-auto font-medium text-green-700 dark:text-green-400">Free</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>
