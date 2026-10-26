<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLearn, apiError, type LearnCourse, type MyLearning } from '~/composables/learn/useLearn'
import CourseCard from '~/components/learn/CourseCard.vue'

// Discover (Browse merged in): one job, find a course. Cards open the course page.
useHead({ title: 'Discover courses - FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'Discover', href: '/courses', current: true },
]

type Row = LearnCourse & { units: number; learners: number; cover?: string }
const api = useLearn()
const courses = ref<Row[]>([])
const me = ref<MyLearning | null>(null)
const q = ref('')
const loading = ref(true)
const error = ref('')

const PER_PAGE = 9
const shownCount = ref(PER_PAGE)
const shown = computed(() => courses.value.slice(0, shownCount.value))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    courses.value = await api.browse(q.value.trim() || undefined)
    shownCount.value = PER_PAGE
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  load()
  try { me.value = await api.me() } catch { /* cards still work without progress */ }
})
let timer: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})

const joined = computed(() => new Map((me.value?.joined ?? []).map((j) => [j.course.course_id, j])))
const mine = computed(() => new Set((me.value?.created ?? []).map((c) => c.course_id)))
const progressOf = (c: Row) => {
  const j = joined.value.get(c.course_id)
  return j ? (j.total_units ? Math.round((j.completed_units / j.total_units) * 100) : 0) : null
}
const actionOf = (c: Row) => {
  if (mine.value.has(c.course_id)) return 'Open'
  const p = progressOf(c)
  if (p == null) return 'View course'
  return p >= 100 ? 'Review' : p > 0 ? 'Continue' : 'Start'
}
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">Discover courses</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">Free courses from the community.</p>
      </header>

      <Input v-model="q" type="search" class="ff-field mb-8 max-w-xl" placeholder="Search by title or topic" aria-label="Search courses" />

      <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        <div v-for="i in 6" :key="i" class="ff-group p-2.5">
          <div class="aspect-video animate-pulse rounded-xl bg-muted" />
          <div class="space-y-2 p-2 pt-4"><div class="h-4 w-3/4 animate-pulse rounded bg-muted" /><div class="h-3 w-full animate-pulse rounded bg-muted" /></div>
        </div>
      </div>
      <div v-else-if="error" class="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ error }} <Button size="lg" variant="gray" @click="load">Try again</Button>
      </div>
      <div v-else-if="!courses.length" class="ff-group flex flex-col items-center gap-4 p-10 text-center text-[15px] text-muted-foreground">
        {{ q ? 'No courses match your search.' : 'No courses yet.' }}
        <Button v-if="q" size="lg" variant="gray" @click="q = ''">Clear search</Button>
      </div>

      <template v-else>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CourseCard v-for="c in shown" :key="c.course_id" :course="c" :cover="c.cover" :to="`/learn/${c.course_id}`"
            :progress="progressOf(c)" :meta="`${plural(c.units, 'unit')} · ${plural(c.learners, 'learner')}`" :action="actionOf(c)" />
        </div>
        <div v-if="shown.length < courses.length" class="mt-8 flex justify-center">
          <Button size="lg" variant="gray" @click="shownCount += PER_PAGE">Show more</Button>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
