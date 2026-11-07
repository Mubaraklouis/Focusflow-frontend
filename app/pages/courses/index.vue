<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLearn, apiError, type Category, type LearnCourse, type MyLearning } from '~/composables/learn/useLearn'
import CourseCard from '~/components/learn/CourseCard.vue'

// Discover: one job, find someone else's course. The API leaves out the
// courses you created, so everything here is other people's work.
useHead({ title: 'Discover courses - FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'Discover', href: '/courses', current: true },
]

type Row = LearnCourse & { units: number; learners: number; cover?: string }
type Sort = 'newest' | 'popular'

const api = useLearn()
const courses = ref<Row[]>([])
const me = ref<MyLearning | null>(null)
const categories = ref<Category[]>([])
const q = ref('')
const category = ref<number | null>(null)
const sort = ref<Sort>('newest')
const loading = ref(true)
const error = ref('')

const PER_PAGE = 9
const shownCount = ref(PER_PAGE)
const shown = computed(() => courses.value.slice(0, shownCount.value))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    courses.value = await api.browse({
      q: q.value.trim(),
      category: category.value,
      sort: sort.value,
    })
    shownCount.value = PER_PAGE
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  load()
  try {
    const [learning, cats] = await Promise.all([api.me(), api.categories()])
    me.value = learning
    categories.value = cats
  } catch {
    /* the cards still work without progress or categories */
  }
})

let timer: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})
watch([category, sort], load)

const filtered = computed(() => !!q.value.trim() || category.value !== null)

const joined = computed(() => new Map((me.value?.joined ?? []).map((j) => [j.course.course_id, j])))
const progressOf = (c: Row) => {
  const j = joined.value.get(c.course_id)
  return j ? (j.total_units ? Math.round((j.completed_units / j.total_units) * 100) : 0) : null
}
const actionOf = (c: Row) => {
  const p = progressOf(c)
  if (p == null) return 'View course'
  return p >= 100 ? 'Review' : p > 0 ? 'Continue' : 'Start'
}
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

const clearFilters = () => {
  q.value = ''
  category.value = null
  sort.value = 'newest'
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">Discover courses</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">Free courses from the community. Your own courses stay under My learning.</p>
      </header>

      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input v-model="q" type="search" class="ff-field w-full sm:max-w-sm" placeholder="Search by title or topic" aria-label="Search courses" />

        <div class="flex items-center gap-1.5" aria-label="Sort courses">
          <span class="mr-1 text-[13px] text-muted-foreground">Sort</span>
          <button
            v-for="option in ([{ v: 'newest', label: 'Newest' }, { v: 'popular', label: 'Most learners' }] as const)"
            :key="option.v"
            type="button"
            class="rounded-full px-3 py-1 text-[13px] font-medium transition-colors"
            :class="sort === option.v ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.06] text-foreground hover:bg-foreground/10'"
            :aria-pressed="sort === option.v"
            @click="sort = option.v"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Category filter -->
      <div v-if="categories.length" class="mb-8 flex flex-wrap items-center gap-1.5" aria-label="Filter by category">
        <button
          type="button"
          class="rounded-full px-3 py-1 text-[13px] font-medium transition-colors"
          :class="category === null ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.06] text-foreground hover:bg-foreground/10'"
          :aria-pressed="category === null"
          @click="category = null"
        >
          All categories
        </button>
        <button
          v-for="cat in categories"
          :key="cat.category_id"
          type="button"
          class="rounded-full px-3 py-1 text-[13px] font-medium transition-colors"
          :class="category === cat.category_id ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.06] text-foreground hover:bg-foreground/10'"
          :aria-pressed="category === cat.category_id"
          @click="category = category === cat.category_id ? null : cat.category_id"
        >
          {{ cat.category_name }}
        </button>
      </div>

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
        <p>{{ filtered ? 'No courses match these filters.' : 'No other courses are published yet.' }}</p>
        <Button v-if="filtered" size="lg" variant="gray" @click="clearFilters">Clear filters</Button>
        <p v-else class="max-w-sm text-[13px]">When other people publish a course it will show up here. Yours are under My learning.</p>
      </div>

      <template v-else>
        <p class="mb-4 text-[13px] text-muted-foreground">{{ plural(courses.length, 'course') }}</p>
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
