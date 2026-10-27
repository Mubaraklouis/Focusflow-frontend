<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronRight, Camera } from 'lucide-vue-next'
import { useLearn, apiError, type AttemptRow, type CreatorView } from '~/composables/learn/useLearn'
import { renderMarkdown } from '~/utils/markdown'

// One job: check the marks the AI proposed and give learners their result
// (F2.4). Evidence (tab, paste, follow-ups, camera) helps a person decide;
// nothing here is an automatic penalty.
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const api = useLearn()

const course = ref<CreatorView | null>(null)
const rows = ref<AttemptRow[]>([])
const filter = ref<'review' | 'all'>('review')
const loading = ref(true)
const error = ref('')
const notice = ref('')

useHead(() => ({ title: `Marks to review · ${course.value?.course.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course.course_title || 'Course', href: `/learn/${courseId}/review` },
  { title: 'Marks', href: `/learn/${courseId}/reviews`, current: true },
])

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    if (!course.value) {
      const c = await api.course(courseId)
      if (c.role !== 'creator') throw new Error('Only the course creator reviews marks.')
      course.value = c
    }
    rows.value = await api.courseAttempts(courseId, filter.value)
  } catch (e) {
    error.value = apiError(e, 'Could not load the attempts.')
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(filter, () => { open.value = null; load() })

// ── one attempt ───────────────────────────────────────────────────────────
const open = ref<number | null>(null)
const detail = ref<any>(null)
const marks = ref<{ mark: number | null; note: string }[]>([])
const saving = ref(false)
const toggle = async (r: AttemptRow) => {
  if (open.value === r.id) return (open.value = null)
  open.value = r.id
  detail.value = null
  try {
    detail.value = await api.attempt(r.id)
    marks.value = detail.value.attempt.items.map((it: any) => ({ mark: it.mark ?? it.ai_mark ?? null, note: it.teacher_note ?? '' }))
  } catch (e) {
    error.value = apiError(e)
  }
}
const canReview = computed(() => detail.value?.attempt.status === 'review')
const save = async () => {
  if (!detail.value) return
  if (marks.value.some((m) => m.mark == null)) return (error.value = 'Give every answer a mark.')
  saving.value = true
  error.value = ''
  try {
    await api.reviewAttempt(detail.value.attempt.id, marks.value.map((m, index) => ({ index, mark: m.mark as number, note: m.note })))
    notice.value = 'Saved. The learner can see the result.'
    setTimeout(() => (notice.value = ''), 3000)
    open.value = null
    await load()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    saving.value = false
  }
}

const evidenceText = (ev: Record<string, number>, r?: AttemptRow) => {
  const parts: string[] = []
  if (ev.tab_hidden) parts.push(`left the tab ${ev.tab_hidden}×`)
  if (ev.paste) parts.push(`tried to paste ${ev.paste}×`)
  if (ev.copy) parts.push(`tried to copy ${ev.copy}×`)
  if (ev.timeout || r?.auto_submitted) parts.push('ran out of time')
  return parts.join(' · ')
}
const consistencyLabel: Record<string, string> = { consistent: 'Explanations fit the answers', partly: 'Explanations partly fit', inconsistent: 'Explanations do not fit the answers' }
const statusLabel: Record<string, string> = { review: 'To review', done: 'Done', marking: 'Being marked', explain: 'Explaining' }
const markOptions = [{ v: 0, l: '0' }, { v: 0.5, l: '½' }, { v: 1, l: '1' }]
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '')
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-3xl px-4 pt-6 pb-24 sm:pt-10">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">Marks to review</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">Check the proposed marks, then give learners their result.</p>
      </header>
      <div class="ff-segment mb-5" role="group" aria-label="Which attempts">
        <button type="button" :aria-pressed="filter === 'review'" @click="filter = 'review'">To review</button>
        <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">All attempts</button>
      </div>
      <p v-if="notice" role="status" class="mb-4 rounded-2xl bg-green-500/10 p-3.5 text-[15px] text-green-700 dark:text-green-400">{{ notice }}</p>
      <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>

      <div v-if="loading" class="ff-group" aria-busy="true"><div v-for="i in 3" :key="i" class="ff-item px-4 py-4"><div class="h-4 animate-pulse rounded bg-muted" /></div></div>
      <div v-else-if="!rows.length" class="ff-group p-8 text-center text-[15px] text-muted-foreground">
        {{ filter === 'review' ? 'Nothing to review. Attempts that need your check appear here.' : 'No attempts yet.' }}
      </div>
      <ul v-else class="ff-group">
        <li v-for="r in rows" :key="r.id" class="ff-item">
          <button type="button" class="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]" :aria-expanded="open === r.id" @click="toggle(r)">
            <component :is="open === r.id ? ChevronDown : ChevronRight" class="h-4 w-4 shrink-0 text-muted-foreground" />
            <span class="min-w-0 flex-1 basis-48">
              <span class="block truncate text-[15px] font-medium">{{ r.learner_name }} · {{ r.unit_title }}</span>
              <span class="block truncate text-[13px] text-muted-foreground">
                Attempt {{ r.number }} · {{ when(r.submitted_at) }}<template v-if="evidenceText(r.evidence, r)"> · {{ evidenceText(r.evidence, r) }}</template>
                <template v-if="r.consistency"> · {{ consistencyLabel[r.consistency] }}</template>
              </span>
            </span>
            <span v-if="r.snapshots" class="inline-flex items-center gap-1 text-[13px] text-muted-foreground"><Camera class="h-4 w-4" />{{ r.snapshots }}</span>
            <span class="ml-auto shrink-0 text-[15px] font-semibold tabular-nums">{{ r.score_percent }}%</span>
            <span class="ff-pill-sm shrink-0">{{ statusLabel[r.status] || r.status }}</span>
          </button>

          <div v-if="open === r.id" class="border-t border-border/60 px-4 py-4">
            <div v-if="!detail" class="h-24 animate-pulse rounded-2xl bg-muted" />
            <template v-else>
              <p v-if="detail.attempt.mark_error" class="mb-4 rounded-2xl bg-amber-500/10 p-3.5 text-[15px]">{{ detail.attempt.mark_error }}</p>
              <ol class="space-y-4">
                <li v-for="(it, i) in detail.attempt.items" :key="i" class="rounded-2xl bg-foreground/[0.03] p-4">
                  <div class="ff-prose text-[15px] font-medium" v-html="renderMarkdown(it.prompt)" />
                  <ul v-if="it.options?.length" class="mt-2 space-y-1 text-[15px]">
                    <li v-for="(o, k) in it.options" :key="k" :class="{ 'font-semibold text-green-700 dark:text-green-400': (it.corrects?.length ? it.corrects.includes(k) : it.correct === k) }">
                      {{ it.choice === k || it.choices?.includes(k) ? '●' : '○' }} {{ o }}
                    </li>
                  </ul>
                  <template v-else>
                    <p class="mt-2 whitespace-pre-line text-[15px]">{{ it.answer || '(no answer)' }}</p>
                    <p v-if="it.answer_guide" class="mt-2 whitespace-pre-line text-[13px] text-muted-foreground"><b>Guide:</b> {{ it.answer_guide }}</p>
                  </template>
                  <p v-if="it.ai_feedback" class="mt-2 text-[13px]"><b>AI ({{ it.ai_mark }}):</b> {{ it.ai_feedback }}</p>
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <div class="ff-segment" role="group" :aria-label="`Mark for question ${i + 1}`">
                      <button v-for="m in markOptions" :key="m.v" type="button" :disabled="!canReview" :aria-pressed="marks[i].mark === m.v" @click="marks[i].mark = m.v">{{ m.l }}</button>
                    </div>
                    <Input v-model="marks[i].note" class="ff-field min-w-0 flex-1 basis-48" :disabled="!canReview" placeholder="Note for the learner · optional" :aria-label="`Note for question ${i + 1}`" />
                  </div>
                </li>
              </ol>

              <section v-if="detail.attempt.followups?.length" class="mt-6">
                <h3 class="ff-label">Explain your answer</h3>
                <p v-if="detail.attempt.consistency" class="mb-2 text-[15px]"><b>{{ consistencyLabel[detail.attempt.consistency] }}.</b> {{ detail.attempt.consistency_note }}</p>
                <ul class="space-y-3">
                  <li v-for="(f, i) in detail.attempt.followups" :key="i" class="rounded-2xl bg-foreground/[0.03] p-4 text-[15px]">
                    <p class="font-medium">{{ f.question }}</p>
                    <p class="mt-1 whitespace-pre-line text-muted-foreground">{{ f.answer || '(not answered)' }}</p>
                  </li>
                </ul>
              </section>

              <section v-if="r.snapshots" class="mt-6">
                <h3 class="ff-label">Camera pictures</h3>
                <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  <a v-for="n in r.snapshots" :key="n" :href="`/api/learn/attempts/${r.id}/snapshots/${n - 1}`" target="_blank" rel="noopener">
                    <img :src="`/api/learn/attempts/${r.id}/snapshots/${n - 1}`" :alt="`Camera picture ${n}`" loading="lazy" class="aspect-[4/3] w-full rounded-xl bg-muted object-cover">
                  </a>
                </div>
              </section>

              <section v-if="detail.changes?.length" class="mt-6">
                <h3 class="ff-label">Changes</h3>
                <ul class="text-[13px] text-muted-foreground">
                  <li v-for="c in detail.changes" :key="c.id">Question {{ c.item_index + 1 }}: {{ c.old_mark ?? '–' }} → {{ c.new_mark }} · {{ when(c.created_at) }}<template v-if="c.note"> · {{ c.note }}</template></li>
                </ul>
              </section>

              <div v-if="canReview" class="mt-6 flex justify-end">
                <Button size="lg" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Give the result' }}</Button>
              </div>
            </template>
          </div>
        </li>
      </ul>
      <div class="mt-10"><NuxtLink :to="`/learn/${courseId}/review`"><Button size="lg" variant="gray">Back to the course</Button></NuxtLink></div>
    </div>
  </NuxtLayout>
</template>
