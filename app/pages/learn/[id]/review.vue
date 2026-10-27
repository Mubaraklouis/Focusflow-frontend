<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Loader2, Globe, Lock, Eye, CheckCircle2, Circle, ClipboardCheck, GraduationCap } from 'lucide-vue-next'
import type { Unit } from '~/composables/learn/useLearn'
import { useCourseBuilder, moved, middleStep } from '~/composables/learn/useCourseBuilder'
import StepShell from '~/components/learn/StepShell.vue'
import UnitEditor from '~/components/learn/UnitEditor.vue'

// Step 3 · one job: check the units and approve them for learners.
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const b = useCourseBuilder(courseId)
const { course, materials, units, progress, isPublished, slidesMode, loading, loadError, notice } = b
const rangeLabel = (u: Unit) => (u.slides ?? []).map((r) => {
  const m = materials.value.find((x) => x.id === r.material_id)
  const w = r.kind === 'pdf' ? 'Page' : 'Slide'
  return `${r.first_page === r.last_page ? `${w} ${r.first_page}` : `${w}s ${r.first_page}–${r.last_page}`}${m ? ` · ${m.title}` : ''}`
}).join(', ')

useHead(() => ({ title: `Review units · ${course.value?.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}/review`, current: true },
])

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const writing = computed(() => course.value?.organise_status === 'processing' || (!!progress.value?.active && !units.value.length))

// ── units ─────────────────────────────────────────────────────────────────
const editing = ref<number | null>(null)
const toggleEdit = (u: Unit) => (editing.value = editing.value === u.id ? null : u.id)
const move = (index: number, delta: number) => {
  const ids = moved(units.value.map((u) => u.id), index, delta)
  if (ids) b.run(() => b.api.reorderUnits(courseId, ids))
}
// ── quizzes (F2.2) ────────────────────────────────────────────────────────
const quizTo = (u: Unit) => `/learn/${courseId}/quiz/${u.id}`
const hasFinal = computed(() => units.value.some((u) => u.final))
const quizLabel = (u: Unit) => {
  const n = u.test?.questions ?? 0
  const state = !n ? 'No questions yet' : u.test?.enabled ? 'On' : 'Off'
  return `${u.final ? 'Final exam' : 'Quiz'} · ${plural(n, 'question')} · ${state}`
}
const testLabel = (u: Unit) => (u.test?.enabled ? `Test on · ${plural(u.test.questions ?? 0, 'question')}` : '')
const pendingReviews = computed(() => units.value.reduce((n, u) => n + (u.test?.pending_reviews ?? 0), 0))
const addQuiz = async (final = false) => {
  const lessons = units.value.filter((u) => u.kind !== 'quiz')
  try {
    const res = await b.api.createQuiz(courseId, final ? { final: true } : { after_unit_id: lessons[lessons.length - 1]?.id })
    await navigateTo(quizTo(res.data))
  } catch (e: any) {
    b.flash('error', e?.data?.message || 'Could not add the quiz.')
  }
}
const removeUnit = (u: Unit) => confirm(`Delete the unit "${u.title}"?`) && b.run(() => b.api.deleteUnit(u.id))
const newUnit = ref('')
const addUnit = async () => {
  const title = newUnit.value.trim()
  if (!title) return
  try {
    const res = await b.api.addUnit(courseId, title)
    newUnit.value = ''
    await b.load(true)
    editing.value = res.data.id
  } catch (e: any) {
    b.flash('error', e?.data?.message || 'Could not add the unit.')
  }
}

// ── references (quiet) ────────────────────────────────────────────────────
const refsStatus = computed(() => course.value?.references_status)

// ── approve and publish ───────────────────────────────────────────────────
const visibility = ref<'public' | 'private'>('public')
const agreed = ref(false)
const publishing = ref(false)
// A slides course needs units; an AI course may still be writing them
const hasContent = computed(() => units.value.length > 0 || (!slidesMode.value && materials.value.length > 0))
const canPublish = computed(() => agreed.value && hasContent.value)
const publishHint = computed(() => {
  if (!hasContent.value) return slidesMode.value ? 'Cut your slides into units first.' : 'Add a material or a unit first.'
  if (!agreed.value) return 'Turn on "I agree" to publish.'
  return ''
})
const publish = async () => {
  publishing.value = true
  // The approval also confirms the right to share when the course is public
  await b.run(() => b.api.publish(courseId, visibility.value, visibility.value === 'public' && agreed.value),
    visibility.value === 'public' ? 'Published. Learners can now find your course in Browse.' : 'Published privately.')
  publishing.value = false
}
const unpublish = () =>
  confirm('Move the course back to draft? Learners will not see it until you publish again.') && b.run(() => b.api.unpublish(courseId))
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <StepShell
      :course-id="courseId" step="review" :mode="course?.build_mode"
      title="Review your units"
      :subtitle="isPublished ? 'Your course is live.' : 'Check the units, then publish.'"
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      :back-to="`/learn/${courseId}/${middleStep(course?.build_mode)}`"
      :next-hint="isPublished ? '' : publishHint">
      <div class="space-y-8">
        <!-- Units -->
        <div class="space-y-3">
          <div v-if="!units.length && !writing" class="ff-group p-8 text-center text-[15px] text-muted-foreground">
            No units yet.
            <NuxtLink v-if="slidesMode" :to="`/learn/${courseId}/units`" class="mt-4 block"><Button size="lg" variant="tinted">Cut slides into units</Button></NuxtLink>
          </div>
          <ol v-else class="ff-group">
            <li v-for="(u, i) in units" :key="u.id" class="ff-item">
              <!-- On phones the actions drop below the title, so the title stays readable -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-[15px] font-semibold tabular-nums text-primary">
                  <GraduationCap v-if="u.final" class="h-[18px] w-[18px]" /><ClipboardCheck v-else-if="u.kind === 'quiz'" class="h-[18px] w-[18px]" /><template v-else>{{ i + 1 }}</template>
                </span>
                <button type="button" class="min-w-0 flex-1 basis-56 text-left" :aria-expanded="editing === u.id"
                  @click="u.kind === 'quiz' ? navigateTo(quizTo(u)) : slidesMode ? navigateTo(`/learn/${courseId}/units`) : toggleEdit(u)">
                  <p class="line-clamp-2 break-words text-[15px] font-medium" :title="u.title">{{ u.title }}</p>
                  <p v-if="u.kind === 'quiz'" class="truncate text-[13px] text-muted-foreground">{{ quizLabel(u) }}<template v-if="u.test?.pending_reviews"> · {{ u.test.pending_reviews }} to review</template></p>
                  <p v-else-if="slidesMode" class="truncate text-[13px] text-muted-foreground">{{ rangeLabel(u) }}<template v-if="testLabel(u)"> · {{ testLabel(u) }}</template></p>
                  <p v-else class="text-[13px] text-muted-foreground">
                    {{ plural((u.concepts ?? []).length, 'concept') }} · {{ plural((u.materials ?? []).length, 'material') }}
                  </p>
                </button>
                <div class="ml-auto flex shrink-0 items-center">
                  <button type="button" class="ff-icon-btn" :disabled="i === 0" :aria-label="`Move ${u.title} up`" title="Move up" @click="move(i, -1)"><ChevronUp class="h-[18px] w-[18px]" /></button>
                  <button type="button" class="ff-icon-btn" :disabled="i === units.length - 1" :aria-label="`Move ${u.title} down`" title="Move down" @click="move(i, 1)"><ChevronDown class="h-[18px] w-[18px]" /></button>
                  <NuxtLink v-if="u.kind !== 'quiz'" :to="quizTo(u)" class="ff-icon-btn" :class="u.test?.enabled ? 'text-primary' : ''" :aria-label="`Unit test for ${u.title}`" title="Unit test"><ClipboardCheck class="h-[18px] w-[18px]" /></NuxtLink>
                  <NuxtLink v-if="u.kind === 'quiz'" :to="quizTo(u)" class="ff-icon-btn" :aria-label="`Edit ${u.title}`" title="Edit quiz"><Pencil class="h-[18px] w-[18px]" /></NuxtLink>
                  <NuxtLink v-else-if="slidesMode" :to="`/learn/${courseId}/units`" class="ff-icon-btn" :aria-label="`Change ${u.title}`" title="Change in Units"><Pencil class="h-[18px] w-[18px]" /></NuxtLink>
                  <button v-else type="button" class="ff-icon-btn" :class="editing === u.id ? 'bg-primary/10 text-primary' : ''" :aria-label="`Edit ${u.title}`" title="Edit" @click="toggleEdit(u)"><Pencil class="h-[18px] w-[18px]" /></button>
                  <button type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Delete ${u.title}`" title="Delete" @click="removeUnit(u)"><Trash2 class="h-[18px] w-[18px]" /></button>
                </div>
              </div>
              <UnitEditor v-if="editing === u.id && !slidesMode && u.kind !== 'quiz'" :unit="u" :materials="materials"
                @changed="b.load(true)" @close="editing = null" @error="(msg) => b.flash('error', msg)"
                @saved="editing = null; b.flash('ok', 'Unit saved.')" />
            </li>
            <!-- The AI is still writing -->
            <li v-if="writing" class="ff-item flex items-center gap-3 px-4 py-3 text-[15px]" aria-live="polite">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10"><Loader2 class="h-[18px] w-[18px] animate-spin text-primary" /></span>
              <span>Writing {{ units.length ? 'the next' : 'the first' }} unit…<span v-if="progress?.percent" class="text-muted-foreground"> {{ progress.percent }}%</span></span>
            </li>
          </ol>

          <div v-if="units.length" class="flex flex-wrap gap-2">
            <Button size="lg" type="button" variant="tinted" @click="addQuiz()"><ClipboardCheck class="mr-1.5 h-4 w-4" />Add a quiz</Button>
            <Button v-if="!hasFinal" size="lg" type="button" variant="gray" @click="addQuiz(true)"><GraduationCap class="mr-1.5 h-4 w-4" />Add final exam</Button>
            <NuxtLink :to="`/learn/${courseId}/reviews`"><Button size="lg" type="button" variant="gray">Marks to review<template v-if="pendingReviews"> ({{ pendingReviews }})</template></Button></NuxtLink>
            <NuxtLink :to="`/learn/${courseId}/class`"><Button size="lg" type="button" variant="gray">Class</Button></NuxtLink>
            <NuxtLink :to="`/learn/${courseId}/results`"><Button size="lg" type="button" variant="gray">Results</Button></NuxtLink>
          </div>
          <form v-if="!slidesMode" class="flex gap-2" @submit.prevent="addUnit">
            <Input v-model="newUnit" class="ff-field" placeholder="New unit title" maxlength="255" aria-label="New unit title" />
            <Button size="lg" type="submit" variant="tinted" :disabled="!newUnit.trim()"><Plus class="mr-1 h-4 w-4" />Add unit</Button>
          </form>

          <!-- Further reading links: a quiet extra -->
          <p v-if="units.length && !slidesMode" class="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[13px] text-muted-foreground">
            <template v-if="refsStatus === 'processing'"><Loader2 class="h-3.5 w-3.5 animate-spin" />Finding further reading…</template>
            <template v-else-if="refsStatus === 'ready'">Further reading added.</template>
            <template v-else-if="refsStatus === 'failed'">Some further reading is missing.</template>
            <button v-if="refsStatus !== 'processing'" type="button" class="ff-pill-sm" @click="b.run(() => b.api.findReferences(courseId))">
              {{ refsStatus === 'idle' ? 'Find further reading' : 'Search again' }}
            </button>
          </p>
        </div>

        <!-- Approve -->
        <section v-if="!isPublished" class="space-y-3">
          <h2 class="px-1 text-[17px] font-semibold">Who can take this course?</h2>
          <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Visibility">
            <label v-for="o in [{ v: 'public', icon: Globe, name: 'Everyone', note: 'Listed in Browse' }, { v: 'private', icon: Lock, name: 'Invite only', note: 'Not listed' }]" :key="o.v"
              class="ff-group flex cursor-pointer items-center gap-3 p-4 transition-shadow"
              :class="{ 'ff-selected': visibility === o.v }">
              <input v-model="visibility" type="radio" :value="o.v" class="sr-only">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.05]"><component :is="o.icon" class="h-[18px] w-[18px]" /></span>
              <span class="min-w-0 flex-1"><span class="block text-[15px] font-medium">{{ o.name }}</span><span class="text-[13px] text-muted-foreground">{{ o.note }}</span></span>
              <CheckCircle2 v-if="visibility === o.v" class="h-5 w-5 shrink-0 text-primary" /><Circle v-else class="h-5 w-5 shrink-0 text-foreground/20" />
            </label>
          </div>
          <div class="ff-group flex items-center gap-4 p-4">
            <span class="min-w-0 flex-1 text-[15px]"><span class="font-medium">I agree.</span> <span class="text-muted-foreground">I approve these units<template v-if="visibility === 'public'"> and have the right to share these materials</template>.</span></span>
            <!-- iOS-style switch -->
            <button type="button" role="switch" :aria-checked="agreed" aria-label="I agree"
              class="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              :class="agreed ? 'bg-primary' : 'bg-foreground/15'" @click="agreed = !agreed">
              <span class="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-200" :class="agreed ? 'translate-x-5' : ''" />
            </button>
          </div>
        </section>
        <section v-else class="ff-group flex flex-wrap items-center justify-between gap-3 p-4 text-[15px]">
          <span class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
              <Globe v-if="course?.course_visibility === 'public'" class="h-[18px] w-[18px]" /><Lock v-else class="h-[18px] w-[18px]" />
            </span>
            <span><span class="block font-medium">Live</span><span class="text-[13px] text-muted-foreground">{{ course?.course_visibility === 'public' ? 'Everyone can join' : 'Invite only' }}</span></span>
          </span>
          <Button size="lg" type="button" variant="gray" @click="unpublish">Back to draft</Button>
        </section>
      </div>

      <template #next>
        <Button v-if="!isPublished" size="lg" type="button" :disabled="!canPublish || publishing" @click="publish">
          <Loader2 v-if="publishing" class="mr-2 h-4 w-4 animate-spin" />{{ publishing ? 'Publishing…' : 'Publish course' }}
        </Button>
        <NuxtLink v-else :to="`/learn/${courseId}`"><Button size="lg" type="button"><Eye class="mr-2 h-4 w-4" />View as learner</Button></NuxtLink>
      </template>
    </StepShell>
  </NuxtLayout>
</template>
