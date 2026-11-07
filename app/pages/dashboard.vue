<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead } from '#imports'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trophy,
} from 'lucide-vue-next'
import { useProfile } from '~/composables/Profile'
import { useLearn, apiError, type MyLearning, type MyQuizzes, type QuizAttemptRow } from '~/composables/learn/useLearn'
import StatCard from '~/components/dashboard/StatCard.vue'
import CourseCard from '~/components/learn/CourseCard.vue'

// Dashboard: the four numbers that matter, the courses still in progress,
// the latest results, and your own courses. One screen, no charts.
useHead({ title: 'Dashboard · FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'Dashboard', href: '/dashboard', current: true },
]

const { profile } = useProfile()
const api = useLearn()

const data = ref<MyLearning | null>(null)
const quizData = ref<MyQuizzes | null>(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  const [learning, quizzes] = await Promise.allSettled([api.me(), api.quizzes()])
  if (learning.status === 'fulfilled') data.value = learning.value
  else error.value = apiError(learning.reason)
  if (quizzes.status === 'fulfilled') quizData.value = quizzes.value
  loading.value = false
}

onMounted(load)

const firstName = computed(() => {
  const name = profile.value?.name?.trim() || ''
  return name.split(/\s+/)[0] || 'there'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return 'Welcome back'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const joined = computed(() => data.value?.joined ?? [])
const created = computed(() => data.value?.created ?? [])

// Courses closest to the start come first, so "continue" is really what is next.
const inProgress = computed(() =>
  [...joined.value]
    .sort((a, b) => {
      const ap = a.total_units ? a.completed_units / a.total_units : 0
      const bp = b.total_units ? b.completed_units / b.total_units : 0
      return ap - bp
    })
    .slice(0, 3),
)

const recent = computed(() => (quizData.value?.attempts ?? []).slice(0, 5))

const stats = computed(() => quizData.value?.stats)
const unitsDone = computed(() => joined.value.reduce((n, j) => n + j.completed_units, 0))
const hasNothing = computed(() => !loading.value && joined.value.length === 0 && created.value.length === 0)

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0)
const coverOf = (id: number) => data.value?.covers?.[String(id)]

const statusOf = (c: { course_status: string; course_visibility: string }) =>
  c.course_status === 'published' ? `Live · ${c.course_visibility === 'public' ? 'Public' : 'Invite only'}` : 'Draft'

const scoreTone = (score: number) => {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-primary'
  return 'text-destructive'
}

const resultLabel = (a: QuizAttemptRow) => {
  if (a.status === 'done') return `${Math.round(a.score_percent)}%`
  if (a.status === 'review') return 'With your teacher'
  if (a.status === 'marking') return 'Being marked'
  return 'In progress'
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : ''

const attemptHref = (a: QuizAttemptRow) =>
  `/learn/${a.course_id}/test/${a.unit_id}?attempt=${a.id}`
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <!-- Greeting -->
      <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">
            {{ greeting }}, {{ firstName }}
          </h1>
          <p class="mt-1 text-[15px] text-muted-foreground">Here is where your learning stands today.</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="gray" size="lg" class="gap-1.5" :disabled="loading" @click="load">
            <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            Refresh
          </Button>
          <NuxtLink v-if="data?.can_create_course" to="/learn/new">
            <Button size="lg" class="gap-1.5"><Plus class="h-4 w-4" />Create a course</Button>
          </NuxtLink>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading && !data" class="space-y-6" aria-busy="true">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="h-56 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-wrap items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        <span>{{ error }}</span>
        <Button variant="gray" size="lg" @click="load">Try again</Button>
      </div>

      <!-- Nothing yet -->
      <div v-else-if="hasNothing" class="ff-group flex flex-col items-center gap-4 p-10 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BookOpen class="h-5 w-5 text-primary" />
        </div>
        <div>
          <p class="text-[17px] font-semibold">Your dashboard is empty for now</p>
          <p class="mt-1 max-w-sm text-[15px] text-muted-foreground">
            Join a course to start learning, or turn your own notes into one.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <NuxtLink to="/courses"><Button size="lg">Discover courses</Button></NuxtLink>
          <NuxtLink v-if="data?.can_create_course" to="/learn/new"><Button size="lg" variant="tinted">Create a course</Button></NuxtLink>
        </div>
      </div>

      <template v-else>
        <!-- Stats -->
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Learning" :value="joined.length" hint="Courses joined" :icon="BookOpen" tone="text-primary" />
          <StatCard label="Units done" :value="unitsDone" hint="Across your courses" :icon="CheckCircle2" tone="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Average score" :value="`${Math.round(stats?.average_score ?? 0)}%`" hint="Finished quizzes" :icon="Trophy" :tone="stats?.attempts ? scoreTone(stats.average_score) : 'text-muted-foreground'" />
          <StatCard label="Quizzes passed" :value="stats?.passed ?? 0" :hint="`${stats?.available ?? 0} available`" :icon="Award" tone="text-amber-600 dark:text-amber-400" />
        </section>

        <!-- Continue learning -->
        <section class="mt-10">
          <div class="mb-3 flex items-baseline justify-between gap-3 px-1">
            <h2 class="text-[17px] font-semibold">Continue learning</h2>
            <NuxtLink to="/learn" class="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              My learning <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>

          <div v-if="!inProgress.length" class="ff-group flex flex-wrap items-center justify-between gap-3 p-5">
            <span class="text-[15px] text-muted-foreground">You haven't joined a course yet.</span>
            <NuxtLink to="/courses"><Button size="lg" variant="tinted">Discover courses</Button></NuxtLink>
          </div>
          <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <CourseCard
              v-for="j in inProgress"
              :key="j.course.course_id"
              :course="j.course"
              :cover="coverOf(j.course.course_id)"
              :to="`/learn/${j.course.course_id}`"
              :progress="pct(j.completed_units, j.total_units)"
              :action="j.completed_units >= j.total_units && j.total_units ? 'Review' : j.completed_units ? 'Continue' : 'Start'"
            />
          </div>
        </section>

        <div class="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <!-- Recent results -->
          <section>
            <div class="mb-3 flex items-baseline justify-between gap-3 px-1">
              <h2 class="text-[17px] font-semibold">Recent results</h2>
              <NuxtLink to="/quizzes" class="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                All quizzes <ArrowRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>

            <div v-if="!recent.length" class="ff-group flex flex-wrap items-center justify-between gap-3 p-5">
              <span class="text-[15px] text-muted-foreground">No quiz results yet.</span>
              <NuxtLink to="/quizzes"><Button size="lg" variant="tinted">See your quizzes</Button></NuxtLink>
            </div>
            <ul v-else class="ff-group">
              <li v-for="a in recent" :key="a.id" class="ff-item">
                <NuxtLink :to="attemptHref(a)" class="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03]">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-[15px] font-medium">{{ a.unit_title || 'Quiz' }}</span>
                    <span class="mt-0.5 block truncate text-[13px] text-muted-foreground">
                      {{ a.course_title }}<template v-if="formatDate(a.submitted_at)"> · {{ formatDate(a.submitted_at) }}</template>
                    </span>
                  </span>
                  <span class="shrink-0 text-right text-[15px] font-semibold tabular-nums" :class="a.status === 'done' ? scoreTone(a.score_percent) : 'text-muted-foreground'">
                    {{ resultLabel(a) }}
                  </span>
                  <ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </NuxtLink>
              </li>
            </ul>
          </section>

          <!-- Your courses -->
          <section>
            <div class="mb-3 flex items-baseline justify-between gap-3 px-1">
              <h2 class="text-[17px] font-semibold">Your courses</h2>
              <span class="text-[13px] text-muted-foreground">{{ created.length }} created</span>
            </div>

            <div v-if="!created.length" class="ff-group flex flex-col items-start gap-3 p-5">
              <p class="text-[15px] text-muted-foreground">Turn your notes, slides and videos into a course.</p>
              <NuxtLink v-if="data?.can_create_course" to="/learn/new"><Button size="lg" variant="tinted">Create a course</Button></NuxtLink>
            </div>
            <ul v-else class="ff-group">
              <li v-for="c in created.slice(0, 4)" :key="c.course_id" class="ff-item">
                <NuxtLink :to="`/learn/${c.course_id}`" class="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03]">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-[15px] font-medium">{{ c.course_title }}</span>
                    <span class="mt-0.5 block text-[13px]" :class="c.course_status === 'published' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">{{ statusOf(c) }}</span>
                  </span>
                  <ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </NuxtLink>
              </li>
            </ul>
            <NuxtLink v-if="created.length" to="/learn" class="mt-3 inline-flex items-center gap-1 px-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              Open all your courses <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </section>
        </div>
      </template>

      <p v-if="loading && data" class="mt-6 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 class="h-3.5 w-3.5 animate-spin" /> Refreshing…
      </p>
    </div>
  </NuxtLayout>
</template>
