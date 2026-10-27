<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-vue-next'
import { useLearn, apiError, type ClassResults, type LearnerResult, type HelpDraft, type CreatorView } from '~/composables/learn/useLearn'

// One job: see who struggles with which concept, and send each learner help
// you have read first (F4.5). Only learners who agreed are shown (F4.4).
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const api = useLearn()
const course = ref<CreatorView | null>(null)
const data = ref<ClassResults | null>(null)
const loading = ref(true)
const error = ref('')
const notice = ref('')

useHead(() => ({ title: `Class results · ${course.value?.course.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course.course_title || 'Course', href: `/learn/${courseId}/review` },
  { title: 'Results', href: `/learn/${courseId}/results`, current: true },
])

const load = async () => {
  try {
    const [c, r] = await Promise.all([api.course(courseId), api.results(courseId)])
    if (c.role === 'creator') course.value = c
    data.value = r
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Sequential scale, one hue (primary): darker = more help needed.
const steps = [
  { min: 85, bg: 'hsl(var(--primary) / 0.07)', label: '85–100%' },
  { min: 70, bg: 'hsl(var(--primary) / 0.2)', label: '70–84%' },
  { min: 50, bg: 'hsl(var(--primary) / 0.38)', label: '50–69%' },
  { min: 30, bg: 'hsl(var(--primary) / 0.6)', label: '30–49%', dark: true },
  { min: 0, bg: 'hsl(var(--primary) / 0.85)', label: '0–29%', dark: true },
]
const stepFor = (v: number) => steps.find((s) => v >= s.min) ?? steps[steps.length - 1]
const cellStyle = (v: number | null) => (v == null ? {} : { background: stepFor(v).bg, color: stepFor(v).dark ? 'white' : undefined })

// ── help for one learner ──────────────────────────────────────────────────
const openFor = ref<number | null>(null)
const draft = ref<HelpDraft | null>(null)
const sending = ref(false)
const openHelp = async (l: LearnerResult) => {
  if (openFor.value === l.user_id) return (openFor.value = null)
  openFor.value = l.user_id
  draft.value = null
  try {
    draft.value = await api.helpDraft(courseId, l.user_id)
  } catch (e) {
    error.value = apiError(e)
  }
}
const send = async () => {
  if (!draft.value || openFor.value == null) return
  sending.value = true
  error.value = ''
  try {
    await api.sendHelp(courseId, openFor.value, { subject: draft.value.subject, body: draft.value.body, concepts: draft.value.concepts })
    notice.value = `Sent to ${draft.value.to}.`
    setTimeout(() => (notice.value = ''), 3500)
    openFor.value = null
    await load()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    sending.value = false
  }
}
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:pt-10">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">Class results</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">
          Who finds which concept hard, from their latest quiz and test attempts.
          <template v-if="data"> {{ data.consented }} of {{ data.enrolled }} learners agreed to share results.</template>
        </p>
      </header>
      <p v-if="notice" role="status" class="mb-4 rounded-2xl bg-green-500/10 p-3.5 text-[15px] text-green-700 dark:text-green-400">{{ notice }}</p>
      <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">
        {{ error }} <NuxtLink :to="`/learn/${courseId}/class`" class="ml-1 underline">Class page</NuxtLink>
      </p>
      <div v-if="loading" class="h-64 animate-pulse rounded-2xl bg-muted" />

      <template v-else-if="data">
        <div v-if="!data.learners.length || !data.concepts.length" class="ff-group p-8 text-center text-[15px] text-muted-foreground">
          No results yet. They appear when learners who agreed finish quizzes whose questions name a concept.
        </div>

        <template v-else>
          <!-- Hardest concepts for the class -->
          <section class="mb-8">
            <h2 class="mb-2 px-1 text-[17px] font-semibold">Class average by concept</h2>
            <ul class="ff-group">
              <li v-for="k in data.concepts" :key="k" class="ff-item flex items-center gap-3 px-4 py-2.5">
                <span class="min-w-0 flex-1 basis-40 truncate text-[15px]" :title="k">{{ k }}</span>
                <span class="hidden h-2 w-40 overflow-hidden rounded-full bg-foreground/[0.06] sm:block" aria-hidden="true">
                  <span class="block h-full rounded-full bg-primary" :style="{ width: `${data.class_average[k]}%` }" />
                </span>
                <span class="w-14 text-right text-[15px] font-semibold tabular-nums">{{ data.class_average[k] }}%</span>
              </li>
            </ul>
          </section>

          <!-- Struggle map: learners × concepts -->
          <section>
            <div class="mb-2 flex flex-wrap items-center gap-3 px-1">
              <h2 class="flex-1 text-[17px] font-semibold">Learners × concepts</h2>
              <div class="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground" aria-label="Colour scale">
                <span class="mr-1">Doing well</span>
                <span v-for="s in steps" :key="s.label" class="h-4 w-6 rounded" :style="{ background: s.bg }" :title="s.label" />
                <span class="ml-1">Needs help</span>
              </div>
            </div>
            <div class="ff-group overflow-x-auto">
              <table class="w-full border-separate border-spacing-0 text-[13px]">
                <caption class="sr-only">Score per learner and concept, in percent; most help needed first</caption>
                <thead>
                  <tr>
                    <th scope="col" class="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-semibold">Learner</th>
                    <th v-for="k in data.concepts" :key="k" scope="col" class="max-w-[8rem] px-2 py-2.5 text-left font-medium text-muted-foreground" :title="k">
                      <span class="line-clamp-2">{{ k }}</span>
                    </th>
                    <th scope="col" class="px-3 py-2.5 text-right font-semibold">All</th>
                    <th scope="col" class="px-3 py-2.5"><span class="sr-only">Help</span></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="l in data.learners" :key="l.user_id">
                    <tr class="border-t border-border/60">
                      <th scope="row" class="sticky left-0 z-10 bg-card px-4 py-2 text-left font-medium">
                        <span class="block max-w-[12rem] truncate text-[15px]">{{ l.name }}</span>
                        <span v-if="l.helped_at" class="text-[12px] font-normal text-muted-foreground">Help sent {{ day(l.helped_at) }}</span>
                      </th>
                      <td v-for="k in data.concepts" :key="k" class="p-[2px]">
                        <span class="flex h-9 min-w-[3rem] items-center justify-center rounded-md tabular-nums" :style="cellStyle(l.scores[k])"
                          :title="l.scores[k] == null ? `${l.name}: ${k} not tested yet` : `${l.name}: ${k} ${l.scores[k]}%`">
                          {{ l.scores[k] == null ? '–' : Math.round(l.scores[k] as number) }}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-right font-semibold tabular-nums">{{ l.overall == null ? '–' : `${l.overall}%` }}</td>
                      <td class="px-3 py-2 text-right">
                        <button type="button" class="ff-pill-sm whitespace-nowrap" :aria-expanded="openFor === l.user_id" @click="openHelp(l)">{{ l.weakest.length ? 'Send help' : 'Message' }}</button>
                      </td>
                    </tr>
                    <tr v-if="openFor === l.user_id">
                      <td :colspan="data.concepts.length + 3" class="bg-foreground/[0.02] p-4">
                        <div v-if="!draft" class="h-24 animate-pulse rounded-2xl bg-muted" />
                        <div v-else class="mx-auto max-w-2xl space-y-3">
                          <p class="text-[13px] text-muted-foreground">To {{ draft.to }} ({{ draft.email }}). Read and change it: nothing is sent until you press Send.</p>
                          <Input v-model="draft.subject" class="ff-field" aria-label="Subject" maxlength="255" />
                          <textarea v-model="draft.body" rows="10" class="ff-field text-[15px]" aria-label="Message" />
                          <div class="flex justify-end gap-2">
                            <Button size="lg" variant="gray" @click="openFor = null">Cancel</Button>
                            <Button size="lg" :disabled="sending" @click="send"><Send class="mr-2 h-4 w-4" />{{ sending ? 'Sending…' : 'Send' }}</Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </template>
    </div>
  </NuxtLayout>
</template>
