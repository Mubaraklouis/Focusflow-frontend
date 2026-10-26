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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
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
      :subtitle="isPublished ? 'Your course is live.' : 'Check the units, then publish.'"
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      :back-to="`/learn/${courseId}/organise`"
      :next-hint="isPublished ? '' : publishHint">
      <div class="space-y-8">
        <!-- Units -->
        <div>
          <div v-if="!units.length && !writing" class="rounded-lg border border-dashed border-border p-8 text-center text-base text-muted-foreground">
            No units yet.
          </div>
          <ol v-else class="space-y-3">
            <li v-for="(u, i) in units" :key="u.id" class="rounded-lg border border-border bg-card">
              <!-- On phones the actions drop below the title, so the title stays readable -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">{{ i + 1 }}</span>
                <button type="button" class="min-w-0 flex-1 basis-56 text-left" :aria-expanded="editing === u.id" @click="toggleEdit(u)">
                  <p class="line-clamp-2 break-words text-base font-medium" :title="u.title">{{ u.title }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ plural((u.concepts ?? []).length, 'concept') }} · {{ plural((u.materials ?? []).length, 'material') }}
                  </p>
                </button>
                <div class="ml-auto flex shrink-0 items-center">
                  <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-foreground disabled:opacity-30" :disabled="i === 0" :aria-label="`Move ${u.title} up`" title="Move up" @click="move(i, -1)"><ChevronUp class="h-5 w-5" /></button>
                  <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-foreground disabled:opacity-30" :disabled="i === units.length - 1" :aria-label="`Move ${u.title} down`" title="Move down" @click="move(i, 1)"><ChevronDown class="h-5 w-5" /></button>
                  <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-foreground" :aria-label="`Edit ${u.title}`" title="Edit" @click="toggleEdit(u)"><Pencil class="h-5 w-5" /></button>
                  <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-destructive" :aria-label="`Delete ${u.title}`" title="Delete" @click="removeUnit(u)"><Trash2 class="h-5 w-5" /></button>
                </div>
              </div>
              <UnitEditor v-if="editing === u.id" :unit="u" :materials="materials"
                @changed="b.load(true)" @close="editing = null" @error="(msg) => b.flash('error', msg)"
                @saved="editing = null; b.flash('ok', 'Unit saved.')" />
            </li>
            <!-- The AI is still writing -->
            <li v-if="writing" class="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 p-4 text-base" aria-live="polite">
              <Loader2 class="h-5 w-5 shrink-0 animate-spin text-primary" />
              <span>Writing {{ units.length ? 'the next' : 'the first' }} unit…<span v-if="progress?.percent" class="text-muted-foreground"> {{ progress.percent }}%</span></span>
            </li>
          </ol>

          <form class="mt-3 flex gap-2" @submit.prevent="addUnit">
            <Input class="h-11 text-base" v-model="newUnit" placeholder="New unit title" maxlength="255" aria-label="New unit title" />
            <Button size="lg" type="submit" variant="outline" :disabled="!newUnit.trim()"><Plus class="mr-1 h-5 w-5" />Add unit</Button>
          </form>

          <!-- Further reading links: a quiet extra -->
          <p v-if="units.length" class="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <template v-if="refsStatus === 'processing'"><Loader2 class="h-4 w-4 animate-spin" />Finding further reading…</template>
            <template v-else-if="refsStatus === 'ready'">Further reading added.</template>
            <template v-else-if="refsStatus === 'failed'">Some further reading is missing.</template>
            <Button v-if="refsStatus !== 'processing'" type="button" variant="outline" class="h-8 px-3 text-sm" @click="b.run(() => b.api.findReferences(courseId))">
              {{ refsStatus === 'idle' ? 'Find further reading' : 'Search again' }}
            </Button>
          </p>
        </div>

        <!-- Approve -->
        <section v-if="!isPublished" class="space-y-4 border-t border-border pt-8">
          <h2 class="text-lg font-semibold">Who can take this course?</h2>
          <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Visibility">
            <label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-base" :class="visibility === 'public' ? 'border-primary' : 'border-border'">
              <input v-model="visibility" type="radio" value="public" class="mt-0.5 accent-[hsl(var(--primary))]">
              <span><span class="flex items-center gap-1 font-medium"><Globe class="h-4 w-4" />Everyone</span>
                <span class="text-muted-foreground">Listed in Browse</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-base" :class="visibility === 'private' ? 'border-primary' : 'border-border'">
              <input v-model="visibility" type="radio" value="private" class="mt-0.5 accent-[hsl(var(--primary))]">
              <span><span class="flex items-center gap-1 font-medium"><Lock class="h-4 w-4" />Invite only</span>
                <span class="text-muted-foreground">Not listed</span></span>
            </label>
          </div>
          <label class="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/60 p-4 text-base">
            <input v-model="agreed" type="checkbox" class="mt-0.5 h-5 w-5 accent-[hsl(var(--primary))]">
            <span><span class="font-medium">I agree.</span> I approve these units<template v-if="visibility === 'public'"> and have the right to share these materials</template>.</span>
          </label>
        </section>
        <section v-else class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-8 text-base">
          <span class="flex items-center gap-2 text-muted-foreground">
            <Globe v-if="course?.course_visibility === 'public'" class="h-5 w-5" /><Lock v-else class="h-5 w-5" />
            Live · {{ course?.course_visibility === 'public' ? 'everyone can join' : 'invite only' }}
          </span>
          <Button size="lg" type="button" variant="outline" @click="unpublish">Back to draft</Button>
        </section>
      </div>

      <template #next>
        <Button size="lg" v-if="!isPublished" type="button" :disabled="!canPublish || publishing" @click="publish">
          <Loader2 v-if="publishing" class="mr-2 h-5 w-5 animate-spin" /><Rocket v-else class="mr-2 h-5 w-5" />{{ publishing ? 'Publishing…' : 'Publish course' }}
        </Button>
        <NuxtLink v-else :to="`/learn/${courseId}`"><Button size="lg" type="button"><Eye class="mr-2 h-5 w-5" />View as learner</Button></NuxtLink>
      </template>
    </StepShell>
  </NuxtLayout>
</template>
