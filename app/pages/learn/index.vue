<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLearn, apiError, type MyLearning } from '~/composables/learn/useLearn'
import AIAllowance from '~/components/learn/AIAllowance.vue'
import BuildProgressCard from '~/components/learn/BuildProgress.vue'
import CourseCard from '~/components/learn/CourseCard.vue'

useHead({ title: 'My learning - FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'My learning', href: '/learn', current: true },
]

const api = useLearn()
const data = ref<MyLearning | null>(null)
const loading = ref(true)
const error = ref('')

const load = async (quiet = false) => {
  if (!quiet) loading.value = true
  error.value = ''
  try {
    data.value = await api.me()
  } catch (e) {
    if (!quiet) error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(() => load())

// Refresh while a course is still being generated
const generating = computed(() => Object.values(data.value?.progress ?? {}).some((p) => p?.active))
let poll: ReturnType<typeof setInterval> | undefined
watch(generating, (g) => {
  clearInterval(poll)
  if (g) poll = setInterval(() => load(true), 4000)
})
onBeforeUnmount(() => clearInterval(poll))

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0)
const createdCount = computed(() => data.value?.created.length ?? 0)
const coverOf = (id: number) => data.value?.covers?.[String(id)]
const statusOf = (c: { course_status: string; course_visibility: string }) =>
  c.course_status === 'published' ? `Live · ${c.course_visibility === 'public' ? 'Public' : 'Invite only'}` : 'Draft'
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <!-- One job: get back to my courses -->
    <div class="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">My learning</h1>
          <p class="mt-1 text-[15px] text-muted-foreground">Your courses, in one place.</p>
        </div>
        <NuxtLink v-if="data?.can_create_course" to="/learn/new"><Button size="lg">Create a course</Button></NuxtLink>
      </header>

      <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        <div v-for="i in 3" :key="i" class="ff-group p-2.5"><div class="aspect-video animate-pulse rounded-xl bg-muted" /><div class="h-16" /></div>
      </div>
      <div v-else-if="error" class="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ error }} <Button size="lg" variant="gray" @click="load()">Try again</Button>
      </div>

      <template v-else-if="data">
        <!-- Taking -->
        <section class="mb-12">
          <h2 class="mb-3 px-1 text-[17px] font-semibold">Learning</h2>
          <div v-if="!data.joined.length" class="ff-group flex flex-wrap items-center justify-between gap-3 p-5">
            <span class="text-[15px] text-muted-foreground">You haven't joined a course yet.</span>
            <NuxtLink to="/courses"><Button size="lg" variant="tinted">Discover courses</Button></NuxtLink>
          </div>
          <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <CourseCard v-for="j in data.joined" :key="j.course.course_id" :course="j.course" :cover="coverOf(j.course.course_id)"
              :to="`/learn/${j.course.course_id}`" :progress="pct(j.completed_units, j.total_units)"
              :action="j.total_units && j.completed_units >= j.total_units ? 'Review' : j.completed_units ? 'Continue' : 'Start'" />
          </div>
        </section>

        <!-- Created -->
        <section>
          <div class="mb-3 flex items-baseline justify-between gap-3 px-1">
            <h2 class="text-[17px] font-semibold">Teaching</h2>
            <span class="text-[13px] text-muted-foreground">Free plan · {{ createdCount }} of {{ data.limits.courses_per_user }} courses</span>
          </div>
          <div v-if="!data.created.length" class="ff-group flex flex-wrap items-center justify-between gap-3 p-5">
            <span class="text-[15px] text-muted-foreground">Turn your notes, slides and videos into a course.</span>
            <NuxtLink v-if="data.can_create_course" to="/learn/new"><Button size="lg" variant="tinted">Create a course</Button></NuxtLink>
          </div>
          <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <CourseCard v-for="c in data.created" :key="c.course_id" :course="c" :cover="coverOf(c.course_id)"
              :to="`/learn/${c.course_id}`" :meta="statusOf(c)" action="Open">
              <BuildProgressCard :progress="data.progress?.[String(c.course_id)]" compact />
            </CourseCard>
          </div>
          <p v-if="!data.can_create_course && data.create_limit_reason" class="mt-3 px-1 text-[13px] text-muted-foreground">{{ data.create_limit_reason }}</p>
          <AIAllowance :allowance="data.ai_allowance" compact class="mt-6" />
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
