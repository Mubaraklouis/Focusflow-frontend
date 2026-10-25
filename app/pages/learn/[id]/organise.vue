<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Loader2, CheckCircle2, Sparkles } from 'lucide-vue-next'
import { kindLabel, type Material } from '~/composables/learn/useLearn'
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
      subtitle="Put them in the order you teach them and give each a clear name. The AI builds your units in this order."
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      :back-to="`/learn/${courseId}/upload`"
      :skip-to="units.length ? undefined : `/learn/${courseId}/review`" skip-label="Skip"
      :next-to="`/learn/${courseId}/review`" next-label="Review units">
      <div class="space-y-8">
        <!-- Empty -->
        <div v-if="!materials.length" class="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No materials yet.
          <NuxtLink :to="`/learn/${courseId}/upload`" class="ml-1 font-medium text-primary hover:underline">Upload some first</NuxtLink>
        </div>

        <!-- The one job: order and names -->
        <ol v-else class="divide-y divide-border" aria-label="Materials in teaching order">
          <li v-for="(m, i) in materials" :key="m.id" class="flex items-start gap-3 py-3">
            <span class="mt-0.5 w-5 shrink-0 text-right text-sm font-semibold text-muted-foreground">{{ i + 1 }}</span>
            <component :is="kindIcon[m.kind]" class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div class="min-w-0 flex-1">
              <form v-if="renaming === m.id" @submit.prevent="saveRename(m)">
                <Input :id="`rename-${m.id}`" v-model="name" maxlength="255" aria-label="Material name" class="h-9"
                  @blur="saveRename(m)" @keydown.esc="renaming = null" />
              </form>
              <button v-else type="button" class="group flex max-w-full items-center gap-2 text-left" :title="`Rename ${m.title}`" @click="startRename(m)">
                <span class="truncate text-sm font-medium">{{ m.title }}</span>
                <Pencil class="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
              <div class="mt-0.5 flex flex-wrap items-center gap-x-2">
                <span class="text-xs text-muted-foreground">{{ kindLabel[m.kind] }}</span>
                <MaterialState :material="m" @retry="b.retry(m)" />
              </div>
            </div>
            <div class="flex shrink-0 items-center">
              <button type="button" class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === 0" :aria-label="`Move ${m.title} up`" title="Move up" @click="move(i, -1)"><ChevronUp class="h-4 w-4" /></button>
              <button type="button" class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === materials.length - 1" :aria-label="`Move ${m.title} down`" title="Move down" @click="move(i, 1)"><ChevronDown class="h-4 w-4" /></button>
              <button type="button" class="p-2 text-muted-foreground hover:text-destructive" :aria-label="`Remove ${m.title}`" title="Remove" @click="b.removeMaterial(m)"><Trash2 class="h-4 w-4" /></button>
            </div>
          </li>
        </ol>

        <!-- Where the AI is with the units -->
        <section v-if="materials.length" aria-live="polite" class="space-y-3 rounded-lg bg-muted/60 p-5">
          <template v-if="organising && progress">
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2 font-medium"><Loader2 class="h-4 w-4 animate-spin text-primary" />{{ progress.label }}</span>
              <span class="tabular-nums text-muted-foreground">{{ progress.percent }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-background" role="progressbar" :aria-valuenow="progress.percent" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full bg-primary transition-all duration-700" :style="{ width: progress.percent + '%' }" />
            </div>
            <p class="text-xs text-muted-foreground">You can go on to review: units appear there as soon as they are written.</p>
          </template>
          <template v-else-if="units.length">
            <p class="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 class="h-4 w-4 text-green-700 dark:text-green-400" />{{ units.length }} {{ units.length === 1 ? 'unit is' : 'units are' }} ready to review
            </p>
            <p v-if="changedAfterUnits" class="text-sm text-muted-foreground">You changed the order or names. Organise again to rebuild the units this way.</p>
            <Button v-if="changedAfterUnits" type="button" variant="outline" :disabled="!!organiseBlocked" @click="organise"><Sparkles class="mr-2 h-4 w-4" />Organise again</Button>
          </template>
          <template v-else>
            <p class="text-sm" :class="course?.organise_status === 'failed' ? 'text-destructive' : 'text-muted-foreground'">
              {{ course?.organise_status === 'failed' && course?.organise_error ? course.organise_error : 'The AI organises your materials into units as soon as they are read.' }}
            </p>
            <Button type="button" variant="outline" :disabled="!!organiseBlocked" @click="organise"><Sparkles class="mr-2 h-4 w-4" />Organise into units now</Button>
          </template>
          <p v-if="organiseBlocked && !organising && (changedAfterUnits || !units.length)" class="text-xs text-muted-foreground">{{ organiseBlocked }}</p>
        </section>
      </div>
    </StepShell>
  </NuxtLayout>
</template>
