<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Loader2, CheckCircle2, Sparkles } from 'lucide-vue-next'
import type { Material } from '~/composables/learn/useLearn'
import { useCourseBuilder, kindIcon, moved } from '~/composables/learn/useCourseBuilder'
import StepShell from '~/components/learn/StepShell.vue'
import MaterialState from '~/components/learn/MaterialState.vue'

// Step 2 · one job: put the materials in teaching order with clear names
// (the AI builds the units in this order).
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const b = useCourseBuilder(courseId)
const { course, materials, units, progress, loading, loadError, notice, organiseBlocked } = b

useHead(() => ({ title: `Organise materials · ${course.value?.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}/organise`, current: true },
])

// Came here while a file was still uploading: look for it for 2 minutes
let waitPoll: ReturnType<typeof setInterval> | undefined
const waitingFiles = ref(false)
watch(() => !loading.value && !materials.value.length, (empty) => {
  clearInterval(waitPoll)
  waitingFiles.value = empty
  if (!empty) return
  const until = Date.now() + 120_000
  waitPoll = setInterval(() => {
    if (Date.now() > until) { clearInterval(waitPoll); waitingFiles.value = false } else b.load(true)
  }, 3000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(waitPoll))

// Order or names changed after units were made: offer to rebuild them
const changedAfterUnits = ref(false)

// ── order ─────────────────────────────────────────────────────────────────
const move = async (index: number, delta: number) => {
  const ids = moved(materials.value.map((m) => m.id), index, delta)
  if (!ids) return
  if (await b.run(() => b.api.reorderMaterials(courseId, ids)) && units.value.length) changedAfterUnits.value = true
}

// ── rename ────────────────────────────────────────────────────────────────
const renaming = ref<number | null>(null)
const name = ref('')
const startRename = async (m: Material) => {
  renaming.value = m.id
  name.value = m.title
  await nextTick()
  document.getElementById(`rename-${m.id}`)?.focus()
}
const saveRename = async (m: Material) => {
  const title = name.value.trim()
  renaming.value = null
  if (!title || title === m.title) return
  if (await b.run(() => b.api.renameMaterial(m.id, title)) && units.value.length) changedAfterUnits.value = true
}

// ── the AI turning them into units ────────────────────────────────────────
const organising = computed(() => course.value?.organise_status === 'processing' || !!progress.value?.active)
const organise = async () => {
  if (units.value.length && !confirm('This replaces the current units with a new AI proposal in this order. Continue?')) return
  if (await b.run(() => b.api.organise(courseId))) changedAfterUnits.value = false
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <StepShell
      :course-id="courseId" step="organise"
      title="Organise your materials"
      subtitle="Arrange them in teaching order."
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      :back-to="`/learn/${courseId}/upload`"
      :skip-to="units.length ? undefined : `/learn/${courseId}/review`" skip-label="Skip"
      :next-to="`/learn/${courseId}/review`" next-label="Review units">
      <div class="space-y-8">
        <!-- Empty -->
        <div v-if="!materials.length" class="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border p-8 text-center text-base text-muted-foreground">
          <span v-if="waitingFiles" class="flex items-center gap-2"><Loader2 class="h-5 w-5 animate-spin text-primary" />Waiting for your files…</span>
          <span v-else>No materials yet.</span>
          <NuxtLink :to="`/learn/${courseId}/upload`"><Button size="lg" type="button" variant="outline">Upload files</Button></NuxtLink>
        </div>

        <!-- The one job: order and names -->
        <ol v-else class="divide-y divide-border" aria-label="Materials in teaching order">
          <li v-for="(m, i) in materials" :key="m.id" class="flex items-start gap-3 py-4">
            <span class="mt-0.5 w-5 shrink-0 text-right text-base font-semibold text-muted-foreground">{{ i + 1 }}</span>
            <component :is="kindIcon[m.kind]" class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div class="min-w-0 flex-1">
              <form v-if="renaming === m.id" @submit.prevent="saveRename(m)">
                <Input :id="`rename-${m.id}`" v-model="name" maxlength="255" aria-label="Material name" class="h-11 text-base"
                  @blur="saveRename(m)" @keydown.esc="renaming = null" />
              </form>
              <button v-else type="button" class="group flex max-w-full items-start gap-2 text-left" :title="`Rename ${m.title}`" @click="startRename(m)">
                <span class="line-clamp-2 break-words text-base font-medium">{{ m.title }}</span>
                <Pencil class="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
              <MaterialState :material="m" class="mt-0.5" @retry="b.retry(m)" />
            </div>
            <div class="flex shrink-0 items-center">
              <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-foreground disabled:opacity-30" :disabled="i === 0" :aria-label="`Move ${m.title} up`" title="Move up" @click="move(i, -1)"><ChevronUp class="h-5 w-5" /></button>
              <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-foreground disabled:opacity-30" :disabled="i === materials.length - 1" :aria-label="`Move ${m.title} down`" title="Move down" @click="move(i, 1)"><ChevronDown class="h-5 w-5" /></button>
              <button type="button" class="rounded-md p-2.5 text-foreground/70 hover:bg-accent hover:text-destructive" :aria-label="`Remove ${m.title}`" title="Remove" @click="b.removeMaterial(m)"><Trash2 class="h-5 w-5" /></button>
            </div>
          </li>
        </ol>

        <!-- Where the AI is with the units -->
        <section v-if="materials.length" aria-live="polite" class="space-y-3 rounded-lg bg-muted/60 p-5">
          <template v-if="organising && progress">
            <div class="flex items-center justify-between gap-3 text-base">
              <span class="flex items-center gap-2 font-medium"><Loader2 class="h-5 w-5 animate-spin text-primary" />{{ progress.label }}</span>
              <span class="tabular-nums text-muted-foreground">{{ progress.percent }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-background" role="progressbar" :aria-valuenow="progress.percent" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full bg-primary transition-all duration-700" :style="{ width: progress.percent + '%' }" />
            </div>
          </template>
          <template v-else-if="units.length">
            <p class="flex items-center gap-2 text-base font-medium">
              <CheckCircle2 class="h-5 w-5 text-green-700 dark:text-green-400" />{{ units.length }} {{ units.length === 1 ? 'unit' : 'units' }} ready
            </p>
            <Button size="lg" v-if="changedAfterUnits" type="button" variant="outline" :disabled="!!organiseBlocked" @click="organise"><Sparkles class="mr-2 h-5 w-5" />Rebuild units in this order</Button>
          </template>
          <template v-else>
            <p class="text-base" :class="course?.organise_status === 'failed' ? 'text-destructive' : 'text-muted-foreground'">
              {{ course?.organise_status === 'failed' && course?.organise_error ? course.organise_error : 'Units are made once files are read.' }}
            </p>
            <Button size="lg" type="button" variant="outline" :disabled="!!organiseBlocked" @click="organise"><Sparkles class="mr-2 h-5 w-5" />Make units now</Button>
          </template>
          <p v-if="organiseBlocked && !organising && (changedAfterUnits || !units.length)" class="text-sm text-muted-foreground">{{ organiseBlocked }}</p>
        </section>
      </div>
    </StepShell>
  </NuxtLayout>
</template>
