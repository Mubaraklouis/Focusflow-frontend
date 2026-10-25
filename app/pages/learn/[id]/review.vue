<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Loader2, Rocket, Globe, Lock, Eye } from 'lucide-vue-next'
import type { Unit } from '~/composables/learn/useLearn'
import { useCourseBuilder, moved } from '~/composables/learn/useCourseBuilder'
import StepShell from '~/components/learn/StepShell.vue'
import UnitEditor from '~/components/learn/UnitEditor.vue'

// Step 3 · one job: check the units and approve them for learners.
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const b = useCourseBuilder(courseId)
const { course, materials, units, progress, isPublished, loading, loadError, notice } = b

useHead(() => ({ title: `Review units · ${course.value?.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}/review`, current: true },
])

const writing = computed(() => course.value?.organise_status === 'processing' || (!!progress.value?.active && !units.value.length))

// ── units ─────────────────────────────────────────────────────────────────
const editing = ref<number | null>(null)
const toggleEdit = (u: Unit) => (editing.value = editing.value === u.id ? null : u.id)
const move = (index: number, delta: number) => {
  const ids = moved(units.value.map((u) => u.id), index, delta)
  if (ids) b.run(() => b.api.reorderUnits(courseId, ids))
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
const canPublish = computed(() => agreed.value && (units.value.length > 0 || materials.value.length > 0))
const publishHint = computed(() => {
  if (!units.value.length && !materials.value.length) return 'Add a material or a unit first.'
  if (!agreed.value) return 'Tick "I agree" to publish.'
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
      :course-id="courseId" step="review"
      title="Review your units"
      :subtitle="isPublished ? 'Your course is live. Changes to units show to learners straight away.' : 'Check each unit, open one to edit it, then approve and publish.'"
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      :back-to="`/learn/${courseId}/organise`"
      :next-hint="isPublished ? '' : publishHint">
      <div class="space-y-8">
        <!-- Units -->
        <div>
          <div v-if="!units.length && !writing" class="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No units yet. They appear here once the AI has organised your materials, or add one yourself below.
          </div>
          <ol v-else class="space-y-3">
            <li v-for="(u, i) in units" :key="u.id" class="rounded-lg border border-border bg-card">
              <div class="flex items-center gap-3 p-4">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{{ i + 1 }}</span>
                <button type="button" class="min-w-0 flex-1 text-left" :aria-expanded="editing === u.id" @click="toggleEdit(u)">
                  <p class="truncate text-sm font-medium">{{ u.title }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ (u.concepts ?? []).length }} concepts · {{ (u.materials ?? []).length }} materials · {{ u.source === 'ai' ? 'drafted by AI' : 'written by you' }}
                  </p>
                </button>
                <div class="flex shrink-0 items-center">
                  <button type="button" class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === 0" :aria-label="`Move ${u.title} up`" title="Move up" @click="move(i, -1)"><ChevronUp class="h-4 w-4" /></button>
                  <button type="button" class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === units.length - 1" :aria-label="`Move ${u.title} down`" title="Move down" @click="move(i, 1)"><ChevronDown class="h-4 w-4" /></button>
                  <button type="button" class="p-2 text-muted-foreground hover:text-foreground" :aria-label="`Edit ${u.title}`" title="Edit" @click="toggleEdit(u)"><Pencil class="h-4 w-4" /></button>
                  <button type="button" class="p-2 text-muted-foreground hover:text-destructive" :aria-label="`Delete ${u.title}`" title="Delete" @click="removeUnit(u)"><Trash2 class="h-4 w-4" /></button>
                </div>
              </div>
              <UnitEditor v-if="editing === u.id" :unit="u" :materials="materials"
                @changed="b.load(true)" @close="editing = null" @error="(msg) => b.flash('error', msg)"
                @saved="editing = null; b.flash('ok', 'Unit saved.')" />
            </li>
            <!-- The AI is still writing -->
            <li v-if="writing" class="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 p-4 text-sm" aria-live="polite">
              <Loader2 class="h-4 w-4 shrink-0 animate-spin text-primary" />
              <span>{{ units.length ? 'The AI is writing the next unit…' : 'The AI is writing your first unit…' }}
                <span class="text-muted-foreground">{{ progress?.percent ? progress.percent + '% · ' : '' }}each unit appears here as soon as it is written.</span></span>
            </li>
          </ol>

          <form class="mt-3 flex gap-2" @submit.prevent="addUnit">
            <Input v-model="newUnit" placeholder="Add a unit yourself" maxlength="255" aria-label="New unit title" />
            <Button type="submit" variant="ghost" :disabled="!newUnit.trim()"><Plus class="mr-1 h-4 w-4" />Add</Button>
          </form>

          <!-- Further reading links: a quiet extra -->
          <p v-if="units.length" class="mt-4 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <template v-if="refsStatus === 'processing'"><Loader2 class="h-3 w-3 animate-spin" />Finding free resources for each concept…</template>
            <template v-else-if="refsStatus === 'ready'">Further reading links added to each concept.</template>
            <template v-else-if="refsStatus === 'failed'">Some further reading links could not be found.</template>
            <template v-else>No further reading links yet.</template>
            <button v-if="refsStatus !== 'processing'" type="button" class="text-primary hover:underline" @click="b.run(() => b.api.findReferences(courseId))">
              {{ refsStatus === 'idle' ? 'Find links' : 'Search again' }}
            </button>
          </p>
        </div>

        <!-- Approve -->
        <section v-if="!isPublished" class="space-y-4 border-t border-border pt-8">
          <h2 class="text-base font-semibold">Who can take this course?</h2>
          <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Visibility">
            <label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm" :class="visibility === 'public' ? 'border-primary' : 'border-border'">
              <input v-model="visibility" type="radio" value="public" class="mt-0.5 accent-[hsl(var(--primary))]">
              <span><span class="flex items-center gap-1 font-medium"><Globe class="h-3.5 w-3.5" />Everyone</span>
                <span class="text-muted-foreground">Anyone on FocusFlow can find and join it for free.</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm" :class="visibility === 'private' ? 'border-primary' : 'border-border'">
              <input v-model="visibility" type="radio" value="private" class="mt-0.5 accent-[hsl(var(--primary))]">
              <span><span class="flex items-center gap-1 font-medium"><Lock class="h-3.5 w-3.5" />Only people I invite</span>
                <span class="text-muted-foreground">It stays out of Browse.</span></span>
            </label>
          </div>
          <label class="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm">
            <input v-model="agreed" type="checkbox" class="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]">
            <span><span class="font-medium">I agree.</span> I have reviewed these units and approve them for learners<template v-if="visibility === 'public'">, and I have the right to share these materials publicly (they are my own, or their licence allows it)</template>.</span>
          </label>
          <p v-if="progress?.active || !units.length" class="text-xs text-muted-foreground">You can publish now: learners see each new unit as soon as the AI has written it.</p>
        </section>
        <section v-else class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-8 text-sm">
          <span class="flex items-center gap-2 text-muted-foreground">
            <Globe v-if="course?.course_visibility === 'public'" class="h-4 w-4" /><Lock v-else class="h-4 w-4" />
            Live · {{ course?.course_visibility === 'public' ? 'everyone can join' : 'invite only' }}
          </span>
          <Button type="button" variant="ghost" class="text-muted-foreground" @click="unpublish">Move back to draft</Button>
        </section>
      </div>

      <template #next>
        <Button v-if="!isPublished" type="button" :disabled="!canPublish || publishing" @click="publish">
          <Loader2 v-if="publishing" class="mr-2 h-4 w-4 animate-spin" /><Rocket v-else class="mr-2 h-4 w-4" />{{ publishing ? 'Publishing…' : 'Publish course' }}
        </Button>
        <NuxtLink v-else :to="`/learn/${courseId}`"><Button type="button"><Eye class="mr-2 h-4 w-4" />View as learner</Button></NuxtLink>
      </template>
    </StepShell>
  </NuxtLayout>
</template>
