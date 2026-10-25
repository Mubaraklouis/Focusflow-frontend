<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, AlertCircle, X, Trash2 } from 'lucide-vue-next'
import { apiError } from '~/composables/learn/useLearn'
import { useCourseBuilder, kindIcon } from '~/composables/learn/useCourseBuilder'
import StepShell from '~/components/learn/StepShell.vue'
import MaterialState from '~/components/learn/MaterialState.vue'

// Step 1 · one job: get the course materials in.
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const b = useCourseBuilder(courseId)
const { course, materials, limits, loading, loadError, notice } = b

useHead(() => ({ title: `Upload materials · ${course.value?.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}/upload`, current: true },
])

const maxMB = computed(() => Math.round((limits.value?.max_file_bytes ?? 0) / 1048576))
const allowanceLeft = computed(() => {
  const a = b.view.value?.ai_allowance
  if (!a || a.unlimited || !a.windows.length) return ''
  const day = a.windows.find((w) => w.period === 'day') ?? a.windows[0]
  if (!day) return ''
  return `AI allowance: ${100 - day.used_percent}% left ${day.period === 'day' ? 'today' : 'this month'}`
})

// ── files ─────────────────────────────────────────────────────────────────
const uploading = ref<string[]>([])
const failed = ref<{ name: string; reason: string }[]>([])
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const uploadFiles = async (files: FileList | File[]) => {
  for (const file of Array.from(files)) {
    failed.value = failed.value.filter((f) => f.name !== file.name)
    if (!/\.(pdf|pptx)$/i.test(file.name)) {
      failed.value.push({ name: file.name, reason: 'Only PDF and PowerPoint (.pptx) files can be uploaded.' })
      continue
    }
    uploading.value.push(file.name)
    try {
      await b.api.uploadFile(courseId, file, file.name.replace(/\.(pdf|pptx)$/i, ''))
    } catch (e) {
      failed.value.push({ name: file.name, reason: apiError(e, 'The upload did not finish. Check your connection and try again.') })
    } finally {
      uploading.value = uploading.value.filter((n) => n !== file.name)
    }
  }
  await b.load(true)
}
const onDrop = (e: DragEvent) => {
  dragOver.value = false
  if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files)
}
const onPick = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.length) uploadFiles(input.files)
  input.value = ''
}

// ── links (a quieter alternative) ─────────────────────────────────────────
const showLink = ref(false)
const link = ref<{ kind: 'video' | 'link'; url: string; title: string }>({ kind: 'video', url: '', title: '' })
const addingLink = ref(false)
const addLink = async () => {
  if (!link.value.url.trim()) return
  addingLink.value = true
  const ok = await b.run(() => b.api.addLink(courseId, { kind: link.value.kind, url: link.value.url.trim(), title: link.value.title.trim() }))
  addingLink.value = false
  if (ok) link.value = { kind: link.value.kind, url: '', title: '' }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <StepShell
      :course-id="courseId" step="upload"
      title="Upload your materials"
      subtitle="Add the notes and slides you teach from. The AI starts reading each file as soon as it arrives."
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      back-to="/learn" back-label="My courses"
      :skip-to="`/learn/${courseId}/review`" skip-label="Skip, I'll write units"
      :next-to="`/learn/${courseId}/organise`" :next-disabled="!materials.length"
      :next-hint="!materials.length ? 'Upload at least one file to continue, or skip to write units yourself.' : ''">
      <div class="space-y-8">
        <!-- The one job: drop files here -->
        <div
          role="button" tabindex="0" aria-label="Upload files"
          class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
          @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="onDrop"
          @click="fileInput?.click()" @keydown.enter.prevent="fileInput?.click()" @keydown.space.prevent="fileInput?.click()">
          <Upload class="mb-4 h-8 w-8 text-primary" />
          <p class="text-base font-semibold text-foreground">Drop files here, or click to choose</p>
          <p class="mt-1 text-sm text-muted-foreground">PDF or PowerPoint (.pptx), up to {{ maxMB }} MB each</p>
          <input ref="fileInput" type="file" class="hidden" multiple accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" @change="onPick">
        </div>

        <!-- What was uploaded, and how it is going -->
        <ul v-if="uploading.length || failed.length || materials.length" class="divide-y divide-border">
          <li v-for="name in uploading" :key="'up-' + name" class="flex items-center gap-3 py-3">
            <Loader2 class="h-5 w-5 shrink-0 animate-spin text-primary" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ name }}</p>
              <p class="text-xs text-muted-foreground">Uploading…</p>
            </div>
          </li>
          <li v-for="f in failed" :key="'fail-' + f.name" class="flex items-start gap-3 py-3">
            <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ f.name }}</p>
              <p class="text-xs text-destructive">{{ f.reason }}</p>
            </div>
            <button type="button" class="p-2 text-muted-foreground hover:text-foreground" aria-label="Dismiss" title="Dismiss" @click="failed = failed.filter((x) => x !== f)"><X class="h-4 w-4" /></button>
          </li>
          <li v-for="m in materials" :key="m.id" class="flex items-start gap-3 py-3">
            <component :is="kindIcon[m.kind]" class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ m.title }}</p>
              <MaterialState :material="m" class="mt-0.5" @retry="b.retry(m)" />
            </div>
            <button type="button" class="p-2 text-muted-foreground hover:text-destructive" :aria-label="`Remove ${m.title}`" title="Remove" @click="b.removeMaterial(m)"><Trash2 class="h-4 w-4" /></button>
          </li>
        </ul>

        <!-- Secondary: videos and links -->
        <div>
          <button v-if="!showLink" type="button" class="text-sm text-primary hover:underline" @click="showLink = true">
            Add a YouTube video or web link instead
          </button>
          <form v-else class="space-y-3" @submit.prevent="addLink">
            <div class="flex gap-2 text-sm" role="radiogroup" aria-label="Link type">
              <button type="button" class="rounded-md px-3 py-1.5" :class="link.kind === 'video' ? 'bg-accent font-medium' : 'text-muted-foreground'" :aria-pressed="link.kind === 'video'" @click="link.kind = 'video'">YouTube video</button>
              <button type="button" class="rounded-md px-3 py-1.5" :class="link.kind === 'link' ? 'bg-accent font-medium' : 'text-muted-foreground'" :aria-pressed="link.kind === 'link'" @click="link.kind = 'link'">Web link</button>
            </div>
            <Input v-model="link.url" :placeholder="link.kind === 'video' ? 'https://youtube.com/watch?v=…' : 'https://…'" aria-label="Address" />
            <Input v-model="link.title" placeholder="Title (optional)" aria-label="Title" />
            <div class="flex justify-end gap-2">
              <Button type="button" variant="ghost" @click="showLink = false">Cancel</Button>
              <Button type="submit" variant="outline" :disabled="addingLink || !link.url.trim()">{{ addingLink ? 'Adding…' : 'Add' }}</Button>
            </div>
          </form>
        </div>

        <p v-if="allowanceLeft" class="text-xs text-muted-foreground">{{ allowanceLeft }}</p>
      </div>
    </StepShell>
  </NuxtLayout>
</template>
