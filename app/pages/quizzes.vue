<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead } from '#imports'
import { Button } from '@/components/ui/button'
import { ArrowRight, Award, BookOpenCheck, CheckCircle2, Loader2, RefreshCw, Trophy } from 'lucide-vue-next'
import { useLearn, apiError, type MyQuizzes, type QuizAttemptRow, type QuizRow } from '~/composables/learn/useLearn'
import StatCard from '~/components/dashboard/StatCard.vue'

// Quizzes: what you can take in the courses you joined, and every attempt
// with its score and feedback. Results open on the quiz page with that
// attempt loaded, so the whole breakdown is in one place.
useHead({ title: 'Quizzes · FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'Quizzes', href: '/quizzes', current: true },
]

const api = useLearn()
const data = ref<MyQuizzes | null>(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    data.value = await api.quizzes()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const quizzes = computed(() => data.value?.quizzes ?? [])
const attempts = computed(() => data.value?.attempts ?? [])
const stats = computed(() => data.value?.stats)
const open = computed(() => quizzes.value.filter((q) => !q.locked && !q.passed))

const quizHref = (q: QuizRow) => `/learn/${q.course_id}/test/${q.unit_id}`
const attemptHref = (a: QuizAttemptRow) => `/learn/${a.course_id}/test/${a.unit_id}?attempt=${a.id}`

const quizAction = (q: QuizRow) => {
  if (q.locked) return 'Locked'
  if (q.passed) return 'Review'
  if (q.can_start) return q.attempts_used ? 'Try again' : 'Start'
  return 'View'
}

const scoreTone = (score: number) => {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-primary'
  return 'text-destructive'
}

const statusLabel = (a: QuizAttemptRow) => {
  if (a.status === 'done') return a.passed ? 'Passed' : 'Not passed'
  if (a.status === 'review') return 'With your teacher'
  if (a.status === 'marking') return 'Being marked'
  return 'In progress'
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

const meta = (q: QuizRow) => {
  const parts = [`${q.questions} question${q.questions === 1 ? '' : 's'}`, `pass ${q.pass_mark}%`]
  parts.push(q.max_attempts ? `${q.attempts_used} of ${q.max_attempts} attempts used` : `${q.attempts_used} attempt${q.attempts_used === 1 ? '' : 's'}, unlimited`)
  return parts.join(' · ')
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">Quizzes</h1>
          <p class="mt-1 text-[15px] text-muted-foreground">What you can take, what you have done, and what to fix.</p>
        </div>
        <Button variant="gray" size="lg" class="gap-1.5" :disabled="loading" @click="load">
          <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Refresh
        </Button>
      </header>

      <div v-if="loading && !data" class="space-y-6" aria-busy="true">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div class="h-40 animate-pulse rounded-2xl bg-muted" />
        <div class="h-56 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div v-else-if="error" class="flex flex-wrap items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        <span>{{ error }}</span>
        <Button variant="gray" size="lg" @click="load">Try again</Button>
      </div>

      <template v-else>
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Available" :value="stats?.available ?? 0" hint="In your courses" :icon="BookOpenCheck" tone="text-primary" />
          <StatCard label="Finished" :value="stats?.attempts ?? 0" hint="Submitted" :icon="CheckCircle2" tone="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Average" :value="`${Math.round(stats?.average_score ?? 0)}%`" hint="Across results" :icon="Trophy" :tone="stats?.attempts ? scoreTone(stats.average_score) : 'text-muted-foreground'" />
          <StatCard label="Passed" :value="stats?.passed ?? 0" hint="Different quizzes" :icon="Award" tone="text-amber-600 dark:text-amber-400" />
        </section>

        <!-- Open quizzes -->
        <section class="mt-10">
          <div class="mb-3 flex items-baseline justify-between gap-3 px-1">
            <h2 class="text-[17px] font-semibold">Ready to take</h2>
            <span class="text-[13px] text-muted-foreground">{{ open.length }} open</span>
          </div>

          <div v-if="!quizzes.length" class="ff-group p-6">
            <p class="text-[15px] text-muted-foreground">
              There are no quizzes in the courses you have joined yet. When a course creator adds a test, it shows up here.
            </p>
            <NuxtLink to="/courses" class="mt-3 inline-block"><Button size="lg" variant="tinted">Discover courses</Button></NuxtLink>
          </div>

          <ul v-else class="ff-group">
            <li v-for="q in quizzes" :key="q.unit_id" class="ff-item">
              <NuxtLink :to="quizHref(q)" class="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-foreground/[0.03]">
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[12px] font-medium text-primary">{{ q.course_title }}</span>
                  <span class="mt-0.5 block truncate text-[15px] font-medium">{{ q.unit_title || 'Quiz' }}</span>
                  <span class="mt-0.5 block text-[13px] text-muted-foreground">{{ meta(q) }}</span>
                  <span v-if="q.locked" class="mt-1 block text-[13px] text-muted-foreground">Finish the earlier units to open this quiz.</span>
                  <span v-else-if="!q.can_start && q.reason" class="mt-1 block text-[13px] text-muted-foreground">{{ q.reason }}</span>
                </span>
                <span class="shrink-0 text-right">
                  <span v-if="q.best_score != null" class="block text-[15px] font-semibold tabular-nums" :class="scoreTone(q.best_score)">{{ Math.round(q.best_score) }}%</span>
                  <span v-else-if="q.passed" class="block text-[13px] font-medium text-emerald-600 dark:text-emerald-400">Passed</span>
                  <span class="mt-0.5 inline-block rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">{{ quizAction(q) }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Results -->
        <section class="mt-10">
          <div class="mb-3 flex items-baseline justify-between gap-3 px-1">
            <h2 class="text-[17px] font-semibold">Your results</h2>
            <span class="text-[13px] text-muted-foreground">{{ attempts.length }} attempt{{ attempts.length === 1 ? '' : 's' }}</span>
          </div>

          <div v-if="!attempts.length" class="ff-group p-6 text-[15px] text-muted-foreground">
            Nothing submitted yet. Take a quiz above and your score, answers and feedback will appear here.
          </div>

          <ol v-else class="ff-group">
            <li v-for="a in attempts" :key="a.id" class="ff-item">
              <NuxtLink :to="attemptHref(a)" class="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-foreground/[0.03]">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-[12px] font-semibold tabular-nums"
                  :class="a.status === 'done' ? scoreTone(a.score_percent) : 'text-muted-foreground'">
                  <template v-if="a.status === 'done'">{{ Math.round(a.score_percent) }}%</template>
                  <Loader2 v-else-if="a.status === 'marking'" class="h-4 w-4 animate-spin" />
                  <span v-else>…</span>
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[15px] font-medium">{{ a.unit_title || 'Quiz' }}</span>
                  <span class="mt-0.5 block truncate text-[13px] text-muted-foreground">
                    {{ a.course_title }}
                    <template v-if="a.number > 1"> · attempt {{ a.number }}</template>
                    <template v-if="formatDate(a.submitted_at)"> · {{ formatDate(a.submitted_at) }}</template>
                  </span>
                  <span v-if="a.feedback_count" class="mt-1 block text-[13px] text-muted-foreground">
                    {{ a.feedback_count }} feedback note{{ a.feedback_count === 1 ? '' : 's' }}
                  </span>
                </span>

                <span class="shrink-0 text-right">
                  <span class="block text-[13px] font-medium" :class="a.status === 'done' ? (a.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive') : 'text-muted-foreground'">
                    {{ statusLabel(a) }}
                  </span>
                  <span class="mt-0.5 block text-[12px] text-muted-foreground">Result and feedback</span>
                </span>
                <ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </NuxtLink>
            </li>
          </ol>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
