<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Camera, CheckCircle2, XCircle, Circle, Square, CheckSquare, Loader2 } from 'lucide-vue-next'
import { useLearn, apiError, type LearnerTest, type LearnerAttempt, type AnswerIn, type LearnerItem, type LearnerView } from '~/composables/learn/useLearn'
import { renderMarkdown } from '~/utils/markdown'

// One job: take a quiz (FEATURES.md M2). Rules first (F2.3), then the
// questions, then the result. Signals are evidence for the teacher, never a
// penalty on their own (section 5).
definePageMeta({ layout: false, middleware: ['auth'] })

const route = useRoute()
const courseId = Number(route.params.id)
const unitId = Number(route.params.uid)
const api = useLearn()

const info = ref<LearnerTest | null>(null)
const outline = ref<LearnerView | null>(null)
const attempt = ref<LearnerAttempt | null>(null)
const loading = ref(true)
const error = ref('')
const code = ref('')
const starting = ref(false)

const st = computed(() => info.value?.settings)
const units = computed(() => outline.value?.units ?? [])
const next = computed(() => {
  const i = units.value.findIndex((u) => u.id === unitId)
  return i >= 0 ? units.value[i + 1] ?? null : null
})
const kindHint: Record<string, string> = { mcq: 'Choose one', multi: 'Choose every right answer', truefalse: 'True or false', short: 'A sentence or two', explain: 'A short paragraph' }

useHead(() => ({ title: `${info.value?.unit.title || 'Test'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: outline.value?.course.course_title || 'Course', href: `/learn/${courseId}` },
  { title: info.value?.unit.title || 'Test', href: route.path, current: true },
])

const load = async () => {
  error.value = ''
  try {
    const [t, o] = await Promise.all([api.test(unitId), api.course(courseId)])
    if (t.role === 'creator') return navigateTo(`/learn/${courseId}/quiz/${unitId}`, { replace: true })
    info.value = t
    if (o.role === 'learner') outline.value = o
    const open = t.in_progress_attempt_id ?? (t.attempts[0] && t.attempts[0].status !== 'done' ? t.attempts[0].id : null)
    if (open) await openAttempt(open)
  } catch (e: any) {
    error.value = e?.statusCode === 403 || e?.status === 403 ? 'Finish the unit before this one first.' : apiError(e, 'This test is not available.')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── taking ────────────────────────────────────────────────────────────────
const answers = ref<AnswerIn[]>([])
const step = ref(0)
const checked = ref<Record<number, { correct?: number; corrects?: number[]; right?: boolean; answer_guide?: string }>>({})
const taking = computed(() => attempt.value?.status === 'in_progress')
const items = computed<LearnerItem[]>(() => attempt.value?.items ?? [])
const onePerScreen = computed(() => !attempt.value?.all_on_one_page)

const openAttempt = async (id: number) => {
  const a: LearnerAttempt = await api.attempt(id)
  setAttempt(a)
}
const setAttempt = (a: LearnerAttempt) => {
  attempt.value = a
  if (a.status === 'in_progress') {
    answers.value = a.items.map((it, index) => ({ index, choice: it.choice, choices: it.choices ?? [], answer: it.answer ?? '' }))
    startTimer(a)
    startTracking(a)
    if (a.camera) startCamera(a.id)
  } else {
    stopAll()
    if (['marking', 'review', 'explain'].includes(a.status)) startPolling(a.id)
  }
}

const start = async () => {
  starting.value = true
  error.value = ''
  try {
    const res = await api.startTest(unitId, code.value.trim() || undefined)
    step.value = 0
    checked.value = {}
    setAttempt(res.data)
  } catch (e) {
    error.value = apiError(e, 'Could not start the test.')
  } finally {
    starting.value = false
  }
}

// autosave: a moment after each change, and every 20 seconds
let saveTimer: ReturnType<typeof setTimeout> | undefined
let lastSaved = ''
const saveNow = async () => {
  if (!attempt.value || !taking.value) return
  const body = JSON.stringify(answers.value)
  if (body === lastSaved) return
  try {
    await api.saveAnswers(attempt.value.id, answers.value)
    lastSaved = body
  } catch { /* the next save tries again; submit sends everything */ }
}
watch(answers, () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNow, 1500)
}, { deep: true })

const pick = (i: number, opt: number) => {
  if (checked.value[i]) return
  const a = answers.value[i]
  if (items.value[i].kind === 'multi') {
    a.choices = a.choices?.includes(opt) ? a.choices.filter((x) => x !== opt) : [...(a.choices ?? []), opt].sort()
  } else {
    a.choice = opt
  }
}
const answered = (i: number) => {
  const a = answers.value[i]
  const k = items.value[i]?.kind
  return k === 'multi' ? !!a?.choices?.length : k === 'mcq' || k === 'truefalse' ? a?.choice != null : !!a?.answer?.trim()
}
const answeredCount = computed(() => items.value.filter((_, i) => answered(i)).length)

// practice: show the right answer after each question
const canCheck = computed(() => attempt.value?.show_answers === 'after_question')
const check = async (i: number) => {
  if (!attempt.value) return
  await saveNow()
  try {
    checked.value[i] = (await api.checkAnswer(attempt.value.id, i)).data
  } catch (e) {
    error.value = apiError(e)
  }
}
const optionState = (i: number, opt: number) => {
  const c = checked.value[i]
  if (!c) return ''
  const right = items.value[i].kind === 'multi' ? c.corrects?.includes(opt) : c.correct === opt
  const chosen = items.value[i].kind === 'multi' ? answers.value[i].choices?.includes(opt) : answers.value[i].choice === opt
  return right ? 'right' : chosen ? 'wrong' : ''
}

// timer
const remaining = ref<number | null>(null)
let tick: ReturnType<typeof setInterval> | undefined
const startTimer = (a: LearnerAttempt) => {
  clearInterval(tick)
  if (!a.deadline) return (remaining.value = null)
  const offset = Date.now() - new Date(a.server_time).getTime()
  const end = new Date(a.deadline).getTime() + offset
  const update = () => {
    remaining.value = Math.max(0, Math.round((end - Date.now()) / 1000))
    if (remaining.value === 0) submit(true)
  }
  update()
  tick = setInterval(update, 1000)
}
const clock = computed(() => {
  const s = remaining.value ?? 0
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

// integrity signals (tab, copy/paste): batched, evidence only
let pending: string[] = []
let flushTimer: ReturnType<typeof setInterval> | undefined
const note = (k: string) => pending.push(k)
const onVisibility = () => { if (document.hidden) note('tab_hidden') }
const onPaste = (e: ClipboardEvent) => { e.preventDefault(); note('paste') }
const onCopy = (e: ClipboardEvent) => { e.preventDefault(); note('copy') }
const startTracking = (a: LearnerAttempt) => {
  stopTracking()
  if (a.track_tab) document.addEventListener('visibilitychange', onVisibility)
  if (a.track_paste) {
    document.addEventListener('paste', onPaste)
    document.addEventListener('copy', onCopy)
  }
  flushTimer = setInterval(() => {
    if (!pending.length || !attempt.value) return
    const ev = pending
    pending = []
    api.logEvents(attempt.value.id, ev).catch(() => {})
  }, 4000)
}
const stopTracking = () => {
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('paste', onPaste)
  document.removeEventListener('copy', onCopy)
  clearInterval(flushTimer)
}

// camera (F2.7): one still picture a minute, never video
const video = ref<HTMLVideoElement | null>(null)
const cameraOn = ref(false)
const cameraError = ref('')
let stream: MediaStream | null = null
let snapTimer: ReturnType<typeof setInterval> | undefined
const startCamera = async (aid: number) => {
  if (stream) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
    cameraOn.value = true
    setTimeout(() => { if (video.value) video.value.srcObject = stream }, 0)
    const snap = () => {
      const v = video.value
      if (!v || !v.videoWidth) return
      const c = document.createElement('canvas')
      c.width = 480
      c.height = Math.round((v.videoHeight / v.videoWidth) * 480)
      c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height)
      c.toBlob((blob) => {
        if (!blob) return
        const form = new FormData()
        form.append('image', blob, 'snapshot.jpg')
        $fetch(`/api/learn/attempts/${aid}/snapshots`, { method: 'POST', body: form }).catch(() => {})
      }, 'image/jpeg', 0.6)
    }
    setTimeout(snap, 5000)
    snapTimer = setInterval(snap, 60000)
  } catch {
    cameraError.value = 'The camera is off. Allow it in your browser so your teacher can see the pictures this test asks for.'
  }
}
const stopCamera = () => {
  clearInterval(snapTimer)
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  cameraOn.value = false
}

// polling while marking / waiting
let poll: ReturnType<typeof setInterval> | undefined
const startPolling = (id: number) => {
  clearInterval(poll)
  poll = setInterval(async () => {
    try {
      const a: LearnerAttempt = await api.attempt(id)
      attempt.value = a
      const waitingExplain = a.status === 'explain' && (!a.followups?.length || !!a.followups[0].answer)
      if (a.status === 'done' || a.status === 'review' || (a.status === 'explain' && !waitingExplain)) {
        clearInterval(poll)
        if (a.status === 'done') info.value = await api.test(unitId) as LearnerTest
      }
    } catch { /* keep trying */ }
  }, 2500)
}

const stopAll = () => {
  clearInterval(tick)
  clearTimeout(saveTimer)
  stopTracking()
  stopCamera()
}
onBeforeUnmount(() => {
  stopAll()
  clearInterval(poll)
})

const submitting = ref(false)
const submit = async (auto = false) => {
  if (!attempt.value || submitting.value || !taking.value) return
  if (!auto && answeredCount.value < items.value.length && !confirm(`You answered ${answeredCount.value} of ${items.value.length} questions. Submit anyway?`)) return
  submitting.value = true
  try {
    const res = await api.submitTest(attempt.value.id, answers.value)
    setAttempt(res.data)
    if (res.data.status === 'done') info.value = await api.test(unitId) as LearnerTest
  } catch (e) {
    error.value = apiError(e, 'Could not submit. Your answers are saved; try again.')
    if (attempt.value) await openAttempt(attempt.value.id)
  } finally {
    submitting.value = false
  }
}

// explain your answer (F2.5)
const replies = ref<string[]>([])
watch(() => attempt.value?.followups, (f) => { if (f && replies.value.length !== f.length) replies.value = f.map((x) => x.answer || '') }, { immediate: true })
const explaining = ref(false)
const sendReplies = async () => {
  if (!attempt.value) return
  if (replies.value.some((r) => !r.trim())) return (error.value = 'Answer every question.')
  explaining.value = true
  error.value = ''
  try {
    const res = await api.explain(attempt.value.id, replies.value.map((r) => r.trim()))
    attempt.value = res.data
    startPolling(res.data.id)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    explaining.value = false
  }
}
const needsReplies = computed(() => attempt.value?.status === 'explain' && !!attempt.value.followups?.length && !attempt.value.followups[0].answer)

const tryAgain = () => {
  attempt.value = null
  load()
}
const dateText = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '')
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-2xl px-5 pt-6 pb-32 sm:px-8 sm:pt-10">
      <div v-if="loading" class="space-y-4" aria-busy="true">
        <div class="h-8 w-2/3 animate-pulse rounded-lg bg-muted" /><div class="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div v-else-if="!info" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ error }} <NuxtLink :to="`/learn/${courseId}`" class="ml-2 underline">Back to course</NuxtLink>
      </div>

      <!-- ── Taking ── -->
      <template v-else-if="attempt && taking">
        <div class="sticky top-0 z-10 -mx-5 mb-6 flex items-center gap-3 bg-background/80 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
          <p class="min-w-0 flex-1 truncate text-[15px] font-semibold">{{ info.unit.title }}</p>
          <span class="text-[13px] text-muted-foreground">{{ answeredCount }}/{{ items.length }}</span>
          <span v-if="remaining != null" class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[15px] font-semibold tabular-nums"
            :class="remaining < 60 ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.06]'"><Clock class="h-4 w-4" />{{ clock }}</span>
        </div>
        <div v-if="attempt.camera" class="mb-5 flex items-center gap-3 rounded-2xl bg-foreground/[0.04] p-3 text-[13px] text-muted-foreground">
          <video v-show="cameraOn" ref="video" autoplay muted playsinline class="h-12 w-16 rounded-lg bg-black object-cover" />
          <Camera v-if="!cameraOn" class="h-5 w-5" />
          <span>{{ cameraError || 'Camera on: a still picture about once a minute, seen only by your teacher.' }}</span>
        </div>
        <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>

        <div class="space-y-10">
          <section v-for="(it, i) in items" v-show="!onePerScreen || i === step" :key="i" :aria-label="`Question ${i + 1}`">
            <p class="text-[13px] font-medium text-muted-foreground">Question {{ i + 1 }} of {{ items.length }} · {{ kindHint[it.kind] }}</p>
            <div class="ff-prose mt-2 text-[19px] font-semibold leading-snug" v-html="renderMarkdown(it.prompt)" />
            <ul v-if="it.options?.length" class="ff-group mt-5">
              <li v-for="(o, k) in it.options" :key="k" class="ff-item">
                <button type="button" class="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors hover:bg-foreground/[0.03]"
                  :class="{ 'bg-green-500/10': optionState(i, k) === 'right', 'bg-destructive/10': optionState(i, k) === 'wrong' }"
                  :aria-pressed="it.kind === 'multi' ? !!answers[i].choices?.includes(k) : answers[i].choice === k" @click="pick(i, k)">
                  <template v-if="it.kind === 'multi'">
                    <CheckSquare v-if="answers[i].choices?.includes(k)" class="h-5 w-5 shrink-0 text-primary" /><Square v-else class="h-5 w-5 shrink-0 text-foreground/25" />
                  </template>
                  <template v-else>
                    <CheckCircle2 v-if="answers[i].choice === k" class="h-5 w-5 shrink-0 text-primary" /><Circle v-else class="h-5 w-5 shrink-0 text-foreground/25" />
                  </template>
                  <span class="min-w-0 flex-1">{{ o }}</span>
                </button>
              </li>
            </ul>
            <textarea v-else v-model="answers[i].answer" :rows="it.kind === 'explain' ? 6 : 3" class="ff-field mt-5" :disabled="!!checked[i]"
              :placeholder="it.kind === 'explain' ? 'Explain in your own words' : 'Your answer'" :aria-label="`Answer to question ${i + 1}`" />
            <div v-if="canCheck" class="mt-3">
              <button v-if="!checked[i]" type="button" class="ff-pill-sm" :disabled="!answered(i)" @click="check(i)">Check my answer</button>
              <p v-else class="rounded-2xl p-3.5 text-[15px]" :class="checked[i].right === false ? 'bg-destructive/10' : 'bg-green-500/10'">
                <b v-if="checked[i].right !== undefined">{{ checked[i].right ? 'Right.' : 'Not quite.' }}</b>
                {{ checked[i].answer_guide }}
              </p>
            </div>
          </section>
        </div>

        <div class="fixed inset-x-0 bottom-0 z-10 border-t border-border/60 bg-background/75 backdrop-blur-xl sm:static sm:mt-12 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
          <div class="mx-auto flex max-w-2xl items-center gap-2 px-5 py-3 sm:px-0 sm:py-0">
            <Button v-if="onePerScreen && step > 0 && !attempt.no_back" size="lg" variant="gray" @click="step--">Back</Button>
            <div class="ml-auto flex gap-2">
              <Button v-if="onePerScreen && step < items.length - 1" size="lg" @click="saveNow(); step++">Next</Button>
              <Button v-else size="lg" :disabled="submitting" @click="submit()">{{ submitting ? 'Submitting…' : 'Submit' }}</Button>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Explain your answer ── -->
      <template v-else-if="attempt && needsReplies">
        <h1 class="text-[28px] font-bold leading-tight tracking-tight">A few questions about your answers</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">{{ attempt.message }}</p>
        <div class="mt-6 space-y-6">
          <div v-for="(f, i) in attempt.followups" :key="i">
            <label :for="`fu-${i}`" class="block text-[17px] font-semibold">{{ f.question }}</label>
            <textarea :id="`fu-${i}`" v-model="replies[i]" rows="4" class="ff-field mt-2" />
          </div>
        </div>
        <p v-if="error" role="alert" class="mt-4 text-[15px] text-destructive">{{ error }}</p>
        <div class="mt-6 flex justify-end"><Button size="lg" :disabled="explaining" @click="sendReplies">{{ explaining ? 'Sending…' : 'Send' }}</Button></div>
      </template>

      <!-- ── Waiting for marks / review ── -->
      <template v-else-if="attempt && attempt.status !== 'done'">
        <div class="ff-group p-8 text-center">
          <Loader2 v-if="attempt.status !== 'review'" class="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
          <p class="text-[17px] font-semibold">{{ attempt.status === 'review' ? 'Waiting for your teacher' : 'Almost there' }}</p>
          <p class="mt-1 text-[15px] text-muted-foreground">{{ attempt.message }}</p>
          <NuxtLink :to="`/learn/${courseId}`"><Button size="lg" variant="gray" class="mt-5">Back to course</Button></NuxtLink>
        </div>
      </template>

      <!-- ── Result ── -->
      <template v-else-if="attempt">
        <div class="ff-group p-6 text-center">
          <component :is="attempt.passed ? CheckCircle2 : XCircle" class="mx-auto h-10 w-10" :class="attempt.passed ? 'text-green-600' : 'text-destructive'" />
          <p class="mt-2 text-[34px] font-bold tabular-nums">{{ attempt.score_percent }}%</p>
          <p class="text-[15px] text-muted-foreground">{{ st?.practice ? 'Practice done' : attempt.passed ? 'Passed' : `Not passed yet · pass mark ${attempt.pass_mark}%` }}</p>
        </div>
        <ol class="mt-6 space-y-4">
          <li v-for="(it, i) in items" :key="i" class="ff-group p-4">
            <div class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums"
                :class="it.mark === 1 ? 'bg-green-500/10 text-green-700 dark:text-green-400' : it.mark ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-destructive/10 text-destructive'">{{ it.mark ?? 0 }}</span>
              <div class="ff-prose min-w-0 flex-1 text-[15px]" v-html="renderMarkdown(it.prompt)" />
            </div>
            <ul v-if="it.options?.length" class="mt-2 space-y-1 pl-10 text-[15px]">
              <li v-for="(o, k) in it.options" :key="k" class="flex items-center gap-2"
                :class="{ 'font-semibold text-green-700 dark:text-green-400': it.corrects?.includes(k) || it.correct === k }">
                <span class="w-4">{{ it.choice === k || it.choices?.includes(k) ? '●' : '○' }}</span>{{ o }}
              </li>
            </ul>
            <p v-else-if="it.answer" class="mt-2 whitespace-pre-line pl-10 text-[15px] text-muted-foreground">{{ it.answer }}</p>
            <p v-if="it.feedback" class="mt-2 pl-10 text-[13px]">{{ it.feedback }}</p>
            <p v-if="it.teacher_note" class="mt-1 pl-10 text-[13px]"><b>Teacher:</b> {{ it.teacher_note }}</p>
            <p v-if="it.answer_guide" class="mt-1 pl-10 text-[13px] text-muted-foreground">{{ it.answer_guide }}</p>
          </li>
        </ol>
        <div class="mt-8 flex flex-wrap justify-between gap-2">
          <NuxtLink :to="`/learn/${courseId}`"><Button size="lg" variant="gray">Course</Button></NuxtLink>
          <Button v-if="!attempt.passed && info.can_start" size="lg" variant="tinted" @click="tryAgain">Try again</Button>
          <NuxtLink v-else-if="next && (attempt.passed || st?.practice)" :to="next.kind === 'quiz' ? `/learn/${courseId}/test/${next.id}` : `/learn/${courseId}/unit/${next.id}`"><Button size="lg">Next unit</Button></NuxtLink>
        </div>
      </template>

      <!-- ── Rules before starting ── -->
      <template v-else-if="st">
        <p class="text-[13px] font-medium text-muted-foreground">{{ st.practice ? 'Practice quiz' : 'Test' }}</p>
        <h1 class="mt-1 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{{ info.unit.title }}</h1>
        <ul class="ff-group mt-6">
          <li class="ff-item flex justify-between gap-3 px-4 py-3 text-[15px]"><span>Questions</span><span class="text-muted-foreground">{{ st.questions }}</span></li>
          <li v-if="!st.practice" class="ff-item flex justify-between gap-3 px-4 py-3 text-[15px]"><span>Pass mark</span><span class="text-muted-foreground">{{ st.pass_mark }}%</span></li>
          <li class="ff-item flex justify-between gap-3 px-4 py-3 text-[15px]"><span>Time</span><span class="text-muted-foreground">{{ st.time_limit_minutes ? `${st.time_limit_minutes} minutes, then it submits itself` : 'No limit' }}</span></li>
          <li class="ff-item flex justify-between gap-3 px-4 py-3 text-[15px]"><span>Attempts</span><span class="text-muted-foreground">{{ st.max_attempts ? `${info.attempts.length} of ${st.max_attempts} used` : 'Unlimited' }}</span></li>
          <li v-if="st.no_back" class="ff-item px-4 py-3 text-[15px]">You cannot go back to earlier questions.</li>
          <li v-if="st.track_tab" class="ff-item px-4 py-3 text-[15px]">Leaving this tab is noted for your teacher.</li>
          <li v-if="st.track_paste" class="ff-item px-4 py-3 text-[15px]">Copy and paste are blocked and noted.</li>
          <li v-if="st.explain_answers" class="ff-item px-4 py-3 text-[15px]">After the test you explain a few of your answers in your own words.</li>
          <li v-if="st.camera" class="ff-item px-4 py-3 text-[15px]">Your camera takes a still picture about once a minute. Only your teacher sees them.</li>
          <li v-if="st.teacher_review" class="ff-item px-4 py-3 text-[15px]">Your teacher checks the marks before you see the result.</li>
          <li v-if="st.closes_at" class="ff-item flex justify-between gap-3 px-4 py-3 text-[15px]"><span>Closes</span><span class="text-muted-foreground">{{ dateText(st.closes_at) }}</span></li>
        </ul>

        <section v-if="info.attempts.length" class="mt-6">
          <h2 class="ff-label">Your attempts</h2>
          <ul class="ff-group">
            <li v-for="a in info.attempts" :key="a.id" class="ff-item">
              <button type="button" class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] hover:bg-foreground/[0.03]" @click="openAttempt(a.id)">
                <span>Attempt {{ a.number }}</span>
                <span class="text-muted-foreground">{{ a.status === 'done' ? `${a.score_percent}% · ${a.passed ? 'passed' : 'not passed'}` : a.status === 'review' ? 'with your teacher' : 'being marked' }}</span>
              </button>
            </li>
          </ul>
        </section>

        <div v-if="info.can_start && st.needs_code" class="mt-6">
          <label for="code" class="ff-label">Access code</label>
          <Input id="code" v-model="code" class="ff-field w-40 font-mono uppercase tracking-widest" maxlength="12" autocomplete="off" placeholder="From your teacher" />
        </div>
        <p v-if="!info.can_start && info.reason" class="mt-6 rounded-2xl bg-foreground/[0.04] p-4 text-[15px]">{{ info.reason }}</p>
        <p v-if="error" role="alert" class="mt-4 text-[15px] text-destructive">{{ error }}</p>
        <div class="mt-8 flex justify-between gap-2">
          <NuxtLink :to="`/learn/${courseId}`"><Button size="lg" variant="gray">Course</Button></NuxtLink>
          <Button v-if="info.can_start" size="lg" :disabled="starting || (st.needs_code && !code.trim())" @click="start">{{ starting ? 'Starting…' : info.in_progress_attempt_id ? 'Continue' : 'Start' }}</Button>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
