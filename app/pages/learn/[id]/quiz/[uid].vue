<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Plus, Upload, Sparkles, Loader2, RefreshCw, ClipboardCheck } from 'lucide-vue-next'
import {
  useLearn, apiError, QUIZ_LEVELS, QUESTION_KINDS,
  type CreatorTest, type CreatorView, type Question, type TestSettings, type Unit,
} from '~/composables/learn/useLearn'
import FfSwitch from '~/components/learn/quiz/FfSwitch.vue'
import QuestionEditor from '~/components/learn/quiz/QuestionEditor.vue'
import QuizImport from '~/components/learn/quiz/QuizImport.vue'

// One job: set up a quiz (a unit's test, a quiz between units, or the final
// exam): its questions and how strict it is (FEATURES.md M2).
definePageMeta({ layout: false, middleware: ['auth'] })

const route = useRoute()
const courseId = Number(route.params.id)
const unitId = Number(route.params.uid)
const api = useLearn()

const data = ref<CreatorTest | null>(null)
const course = ref<CreatorView | null>(null)
const loading = ref(true)
const loadError = ref('')
const notice = ref<{ kind: 'error' | 'ok'; text: string } | null>(null)
const flash = (kind: 'error' | 'ok', text: string) => {
  notice.value = { kind, text }
  if (kind === 'ok') setTimeout(() => { if (notice.value?.text === text) notice.value = null }, 3000)
}

const st = computed(() => data.value?.settings)
const unit = computed(() => data.value?.unit)
const questions = computed(() => data.value?.questions ?? [])
const isQuiz = computed(() => unit.value?.kind === 'quiz')
const lessons = computed<Unit[]>(() => (course.value?.units ?? []).filter((u) => u.kind !== 'quiz'))
const writing = computed(() => st.value?.pool_status === 'processing')
const backTo = `/learn/${courseId}/review`

useHead(() => ({ title: `${unit.value?.title || 'Quiz'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course.course_title || 'Course', href: backTo },
  { title: isQuiz.value ? unit.value?.title || 'Quiz' : 'Unit test', href: route.path, current: true },
])

let poll: ReturnType<typeof setInterval> | undefined
const load = async (quiet = false) => {
  try {
    const [t, c] = await Promise.all([api.test(unitId), quiet ? Promise.resolve(course.value) : api.course(courseId)])
    if (t.role !== 'creator' || !c || c.role !== 'creator') throw new Error('Only the course creator can set up its quizzes.')
    data.value = t
    course.value = c
    clearInterval(poll)
    if (t.settings.pool_status === 'processing') poll = setInterval(() => load(true), 2500)
  } catch (e) {
    if (!quiet) loadError.value = apiError(e, 'Could not load this quiz.')
  } finally {
    loading.value = false
  }
}
onMounted(() => load())
onBeforeUnmount(() => clearInterval(poll))

// ── settings ───────────────────────────────────────────────────────────────
const saving = ref(false)
const save = async (patch: Record<string, any>, ok?: string) => {
  saving.value = true
  try {
    const res = await api.updateTest(unitId, patch)
    if (data.value) data.value.settings = res.data
    if (ok) flash('ok', ok)
  } catch (e) {
    flash('error', apiError(e, 'Could not save.'))
  } finally {
    saving.value = false
  }
}
const num = (field: keyof TestSettings, v: string, lo: number, hi: number) => {
  const n = Math.round(Number(v))
  if (Number.isFinite(n) && n >= lo && n <= hi && st.value && n !== st.value[field]) save({ [field]: n })
}
const levelNote = computed(() => QUIZ_LEVELS.find((l) => l.v === st.value?.level)?.note ?? 'Your own mix of settings.')
// datetime-local works in the viewer's time zone; the API takes UTC
const localValue = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const setDate = (field: 'opens_at' | 'closes_at', v: string) => save({ [field]: v ? new Date(v).toISOString() : '' })

// ── covers (quiz units) ───────────────────────────────────────────────────
const coversAll = computed(() => !unit.value?.covers?.length)
const setCovers = async (ids: number[]) => {
  try {
    const res = await api.updateQuiz(unitId, { covers: ids })
    if (data.value) data.value.unit = { ...data.value.unit, covers: res.data.covers ?? [] }
  } catch (e) {
    flash('error', apiError(e))
  }
}
const toggleCover = (id: number) => {
  const cur = unit.value?.covers ?? []
  setCovers(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
}
const title = ref('')
const saveTitle = async () => {
  const t = title.value.trim()
  if (!t || t === unit.value?.title) return
  try {
    const res = await api.updateQuiz(unitId, { title: t })
    if (data.value) data.value.unit = { ...data.value.unit, title: res.data.title }
  } catch (e) {
    flash('error', apiError(e))
  }
}

// ── questions ─────────────────────────────────────────────────────────────
const panel = ref<'none' | 'new' | 'import'>('none')
const editing = ref<number | null>(null)
const busyQ = ref(false)
const kindLabel = Object.fromEntries(QUESTION_KINDS.map((k) => [k.v, k.label]))
const sourceLabel = { ai: 'AI', edited: 'AI, edited', manual: 'Yours' } as const
const addQuestion = async (q: Partial<Question>) => {
  busyQ.value = true
  try {
    await api.addQuestion(unitId, q)
    panel.value = 'none'
    await load(true)
    flash('ok', 'Question added.')
  } catch (e) {
    flash('error', apiError(e))
  } finally {
    busyQ.value = false
  }
}
const updateQuestion = async (q: Question, patch: Partial<Question>) => {
  busyQ.value = true
  try {
    await api.updateQuestion(q.id, patch)
    editing.value = null
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  } finally {
    busyQ.value = false
  }
}
const removeQuestion = async (q: Question) => {
  if (!confirm('Delete this question? Past attempts keep their copy.')) return
  try {
    await api.deleteQuestion(q.id)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const generate = async () => {
  try {
    await api.generateQuestions(unitId)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const onImported = async (n: number) => {
  panel.value = 'none'
  await load(true)
  flash('ok', `${n} question${n === 1 ? '' : 's'} imported.`)
}
const enable = (on: boolean) => save({ enabled: on }, on ? 'Learners can now take this quiz.' : 'The quiz is off.')
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:pt-10">
      <div v-if="loading" class="ff-group" aria-busy="true">
        <div v-for="i in 3" :key="i" class="ff-item flex items-center gap-3 px-4 py-3.5"><div class="h-4 flex-1 animate-pulse rounded bg-muted" /></div>
      </div>
      <div v-else-if="loadError" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ loadError }} <NuxtLink :to="backTo" class="ml-2 underline">Back to the course</NuxtLink>
      </div>

      <template v-else-if="data && st && unit">
        <header class="mb-6">
          <p class="text-[13px] font-medium text-muted-foreground">{{ unit.final ? 'Final exam' : isQuiz ? 'Quiz' : 'Unit test' }}</p>
          <input v-if="isQuiz" :value="unit.title" maxlength="255" aria-label="Quiz title"
            class="-mx-1.5 mt-0.5 w-full rounded-lg bg-transparent px-1.5 text-[26px] font-bold leading-tight tracking-tight outline-none hover:bg-foreground/[0.04] focus:bg-foreground/[0.05] focus:ring-4 focus:ring-primary/15 sm:text-[28px]"
            @input="title = ($event.target as HTMLInputElement).value" @blur="saveTitle" @keydown.enter.prevent="saveTitle">
          <h1 v-else class="mt-0.5 text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">{{ unit.title }}</h1>
        </header>

        <div v-if="notice" role="status" class="mb-5 rounded-2xl p-3.5 text-[15px]"
          :class="notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'">{{ notice.text }}</div>

        <!-- On / off -->
        <div class="ff-group mb-8 flex items-center gap-4 p-4">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary"><ClipboardCheck class="h-[18px] w-[18px]" /></span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-medium">Learners take this {{ isQuiz ? 'quiz' : 'test' }}</span>
            <span class="text-[13px] text-muted-foreground">{{ questions.length }} question{{ questions.length === 1 ? '' : 's' }}<template v-if="!questions.length"> · add some to turn it on</template></span>
          </span>
          <FfSwitch :model-value="st.enabled" label="Learners take this quiz" :disabled="!questions.length && !st.enabled" @update:model-value="enable" />
        </div>

        <!-- Level -->
        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">How strict</h2>
          <div class="ff-segment flex-wrap" role="group" aria-label="Restriction level">
            <button v-for="l in QUIZ_LEVELS" :key="l.v" type="button" :aria-pressed="st.level === l.v" @click="save({ level: l.v })">{{ l.label }}</button>
          </div>
          <p class="mt-2 px-1 text-[13px] text-muted-foreground"><span v-if="st.level === 'custom'" class="ff-pill-sm mr-1">Custom</span>{{ levelNote }}</p>
        </section>

        <!-- What it covers (quizzes between units) -->
        <section v-if="isQuiz && !unit.final && lessons.length" class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Covers</h2>
          <ul class="ff-group">
            <li class="ff-item flex items-center gap-3 px-4 py-3">
              <span class="min-w-0 flex-1 text-[15px]">Every lesson before it</span>
              <FfSwitch :model-value="coversAll" label="Every lesson before it" @update:model-value="(v) => setCovers(v ? [] : lessons.map((l) => l.id))" />
            </li>
            <template v-if="!coversAll">
              <li v-for="l in lessons" :key="l.id" class="ff-item">
                <label class="flex cursor-pointer items-center gap-3 px-4 py-3">
                  <input type="checkbox" class="h-4 w-4 accent-[hsl(var(--primary))]" :checked="unit.covers?.includes(l.id)" @change="toggleCover(l.id)">
                  <span class="min-w-0 flex-1 truncate text-[15px]">{{ l.title }}</span>
                </label>
              </li>
            </template>
          </ul>
        </section>

        <!-- Settings -->
        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Settings</h2>
          <ul class="ff-group">
            <li class="ff-item flex items-center gap-3 px-4 py-2.5">
              <label for="s-q" class="min-w-0 flex-1 text-[15px]">Questions per attempt</label>
              <Input id="s-q" type="number" min="1" max="50" class="ff-field w-24 text-right" :model-value="st.questions_per_test" @change="num('questions_per_test', ($event.target as HTMLInputElement).value, 1, 50)" />
            </li>
            <li class="ff-item flex items-center gap-3 px-4 py-2.5">
              <label for="s-p" class="min-w-0 flex-1 text-[15px]">Pass mark (%)</label>
              <Input id="s-p" type="number" min="1" max="100" class="ff-field w-24 text-right" :model-value="st.pass_mark" @change="num('pass_mark', ($event.target as HTMLInputElement).value, 1, 100)" />
            </li>
            <li class="ff-item flex items-center gap-3 px-4 py-2.5">
              <label for="s-t" class="min-w-0 flex-1 text-[15px]">Time limit (minutes, 0 = none)</label>
              <Input id="s-t" type="number" min="0" max="180" class="ff-field w-24 text-right" :model-value="st.time_limit_minutes" @change="num('time_limit_minutes', ($event.target as HTMLInputElement).value, 0, 180)" />
            </li>
            <li class="ff-item flex items-center gap-3 px-4 py-2.5">
              <label for="s-a" class="min-w-0 flex-1 text-[15px]">Attempts (0 = unlimited)</label>
              <Input id="s-a" type="number" min="0" max="20" class="ff-field w-24 text-right" :model-value="st.max_attempts" @change="num('max_attempts', ($event.target as HTMLInputElement).value, 0, 20)" />
            </li>
            <li class="ff-item flex flex-wrap items-center gap-3 px-4 py-2.5">
              <label for="s-sa" class="min-w-0 flex-1 basis-40 text-[15px]">Show the right answers</label>
              <select id="s-sa" class="ff-field w-auto" :value="st.show_answers" @change="save({ show_answers: ($event.target as HTMLSelectElement).value })">
                <option value="after_question">After each question</option>
                <option value="when_finished">Once passed or out of attempts</option>
                <option value="after_submit">After each attempt</option>
                <option value="after_close">After the quiz closes</option>
                <option value="never">Never</option>
              </select>
            </li>
            <li class="ff-item flex flex-wrap items-center gap-3 px-4 py-2.5">
              <span class="min-w-0 flex-1 basis-40 text-[15px]">Layout</span>
              <div class="ff-segment" role="group" aria-label="Layout">
                <button type="button" :aria-pressed="!st.all_on_one_page" @click="save({ all_on_one_page: false })">One per screen</button>
                <button type="button" :aria-pressed="st.all_on_one_page" @click="save({ all_on_one_page: true })">All on one page</button>
              </div>
            </li>
            <li v-for="row in [
              { f: 'practice', label: 'Practice only (never blocks the next unit)' },
              { f: 'no_back', label: 'No going back to earlier questions' },
              { f: 'teacher_review', label: 'I review the marks before learners see them' },
              { f: 'track_tab', label: 'Note when learners leave the test tab' },
              { f: 'track_paste', label: 'Block and note copy and paste' },
              { f: 'explain_answers', label: 'Follow-up questions on their answers' },
              { f: 'camera', label: 'Camera pictures (learners are told first)' },
            ]" :key="row.f" class="ff-item flex items-center gap-3 px-4 py-3">
              <span class="min-w-0 flex-1 text-[15px]">{{ row.label }}</span>
              <FfSwitch :model-value="!!(st as any)[row.f]" :label="row.label" @update:model-value="(v) => save({ [row.f]: v })" />
            </li>
          </ul>
        </section>

        <!-- When and who -->
        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">When and where</h2>
          <ul class="ff-group">
            <li class="ff-item flex flex-wrap items-center gap-3 px-4 py-2.5">
              <label for="s-o" class="min-w-0 flex-1 basis-32 text-[15px]">Opens</label>
              <input id="s-o" type="datetime-local" class="ff-field w-auto" :value="localValue(st.opens_at)" @change="setDate('opens_at', ($event.target as HTMLInputElement).value)">
            </li>
            <li class="ff-item flex flex-wrap items-center gap-3 px-4 py-2.5">
              <label for="s-c" class="min-w-0 flex-1 basis-32 text-[15px]">Closes</label>
              <input id="s-c" type="datetime-local" class="ff-field w-auto" :value="localValue(st.closes_at)" @change="setDate('closes_at', ($event.target as HTMLInputElement).value)">
            </li>
            <li class="ff-item flex flex-wrap items-center gap-3 px-4 py-3">
              <span class="min-w-0 flex-1 basis-40 text-[15px]">Access code <span class="text-muted-foreground">· given out in the room</span></span>
              <template v-if="st.access_code">
                <span class="rounded-lg bg-foreground/[0.06] px-2.5 py-1 font-mono text-[17px] font-semibold tracking-widest">{{ st.access_code }}</span>
                <button type="button" class="ff-icon-btn" aria-label="New access code" title="New code" @click="save({ new_access_code: true })"><RefreshCw class="h-[18px] w-[18px]" /></button>
                <button type="button" class="ff-pill-sm" @click="save({ new_access_code: false })">Remove</button>
              </template>
              <button v-else type="button" class="ff-pill-sm" @click="save({ new_access_code: true })">Add a code</button>
            </li>
          </ul>
        </section>

        <!-- Questions -->
        <section>
          <div class="mb-2 flex flex-wrap items-center gap-2 px-1">
            <h2 class="flex-1 text-[17px] font-semibold">Questions</h2>
            <span v-if="saving" class="text-[13px] text-muted-foreground">Saving…</span>
          </div>
          <div class="mb-3 flex flex-wrap gap-2">
            <Button size="lg" type="button" variant="tinted" @click="panel = panel === 'new' ? 'none' : 'new'"><Plus class="mr-1.5 h-4 w-4" />Write</Button>
            <Button size="lg" type="button" variant="gray" @click="panel = panel === 'import' ? 'none' : 'import'"><Upload class="mr-1.5 h-4 w-4" />Import</Button>
            <Button v-if="data.ai_available" size="lg" type="button" variant="gray" :disabled="writing" @click="generate">
              <Loader2 v-if="writing" class="mr-1.5 h-4 w-4 animate-spin" /><Sparkles v-else class="mr-1.5 h-4 w-4" />{{ writing ? 'Writing…' : 'Write with AI' }}
            </Button>
          </div>
          <p v-if="st.pool_status === 'failed' && st.pool_error" class="mb-3 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ st.pool_error }}</p>
          <div v-if="panel === 'new'" class="ff-group mb-3"><QuestionEditor :busy="busyQ" @save="addQuestion" @cancel="panel = 'none'" /></div>
          <div v-if="panel === 'import'" class="ff-group mb-3"><QuizImport :unit-id="unitId" @saved="onImported" @close="panel = 'none'" /></div>

          <div v-if="!questions.length && panel === 'none'" class="ff-group p-8 text-center text-[15px] text-muted-foreground">
            No questions yet. Write them, import a file, or let the AI write some from your {{ course?.course.build_mode === 'slides' ? 'slides' : 'lessons' }}.
          </div>
          <ol v-else-if="questions.length" class="ff-group">
            <li v-for="(q, i) in questions" :key="q.id" class="ff-item">
              <div class="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-3">
                <span class="w-5 shrink-0 pt-0.5 text-right text-[13px] font-semibold tabular-nums text-muted-foreground">{{ i + 1 }}</span>
                <div class="min-w-0 flex-1 basis-56">
                  <p class="line-clamp-2 break-words text-[15px]">{{ q.prompt }}</p>
                  <p class="text-[13px] text-muted-foreground">{{ kindLabel[q.kind] }} · {{ sourceLabel[q.source] }}<template v-if="q.concept"> · {{ q.concept }}</template></p>
                </div>
                <div class="ml-auto flex shrink-0">
                  <button type="button" class="ff-icon-btn" :class="editing === q.id ? 'bg-primary/10 text-primary' : ''" :aria-label="`Edit question ${i + 1}`" title="Edit" @click="editing = editing === q.id ? null : q.id"><Pencil class="h-[18px] w-[18px]" /></button>
                  <button type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Delete question ${i + 1}`" title="Delete" @click="removeQuestion(q)"><Trash2 class="h-[18px] w-[18px]" /></button>
                </div>
              </div>
              <QuestionEditor v-if="editing === q.id" :question="q" :busy="busyQ" @save="(p) => updateQuestion(q, p)" @cancel="editing = null" />
            </li>
          </ol>
        </section>

        <div class="mt-10 flex justify-between gap-2">
          <NuxtLink :to="backTo"><Button size="lg" variant="gray">Back</Button></NuxtLink>
          <NuxtLink :to="`/learn/${courseId}/reviews`"><Button size="lg" variant="tinted">Marks to review</Button></NuxtLink>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
