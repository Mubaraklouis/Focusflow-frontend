<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, AlertCircle, X, Trash2, Eye, Link2 as LinkIcon } from 'lucide-vue-next'
import { apiError } from '~/composables/learn/useLearn'
import { useCourseBuilder } from '~/composables/learn/useCourseBuilder'
import StepShell from '~/components/learn/StepShell.vue'
import KindTile from '~/components/learn/KindTile.vue'
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
  return `${100 - day.used_percent}% AI left ${day.period === 'day' ? 'today' : 'this month'}`
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
      failed.value.push({ name: file.name, reason: 'Only PDF or PowerPoint files.' })
      continue
    }
    uploading.value.push(file.name)
    try {
      await b.api.uploadFile(courseId, file, file.name.replace(/\.(pdf|pptx)$/i, ''))
    } catch (e) {
      failed.value.push({ name: file.name, reason: apiError(e, 'Upload failed. Check your connection.') })
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
      subtitle="The AI reads each file as it arrives."
      :loading="loading" :load-error="loadError" :notice="notice" @dismiss-notice="notice = null"
      back-to="/learn" back-label="My courses"
      :skip-to="`/learn/${courseId}/review`" skip-label="Skip"
      :next-to="`/learn/${courseId}/organise`" :next-disabled="!materials.length && !uploading.length"
      :next-hint="!materials.length && !uploading.length ? 'Upload a file to continue.' : ''">
      <div class="space-y-6">
        <!-- The one job: drop files here -->
        <div
          role="button" tabindex="0" aria-label="Upload files"
          class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          :class="dragOver ? 'border-primary bg-primary/5' : 'border-foreground/10 bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/[0.03]'"
          @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="onDrop"
          @click="fileInput?.click()" @keydown.enter.prevent="fileInput?.click()" @keydown.space.prevent="fileInput?.click()">
          <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Upload class="h-6 w-6" /></span>
          <p class="text-[17px] font-semibold text-foreground">Drop files or click to choose</p>
          <p class="mt-1 text-[13px] text-muted-foreground">PDF or PowerPoint · up to {{ maxMB }} MB</p>
          <input ref="fileInput" type="file" class="hidden" multiple accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" @change="onPick">
        </div>

        <!-- What was uploaded, and how it is going -->
        <ul v-if="uploading.length || failed.length || materials.length" class="ff-group">
          <li v-for="name in uploading" :key="'up-' + name" class="ff-item flex items-center gap-3 px-4 py-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10"><Loader2 class="h-[18px] w-[18px] animate-spin text-primary" /></span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-medium">{{ name }}</p>
              <p class="text-[13px] text-muted-foreground">Uploading…</p>
            </div>
          </li>
          <li v-for="f in failed" :key="'fail-' + f.name" class="ff-item flex items-center gap-3 px-4 py-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-destructive/10"><AlertCircle class="h-[18px] w-[18px] text-destructive" /></span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-medium">{{ f.name }}</p>
              <p class="text-[13px] text-destructive">{{ f.reason }}</p>
            </div>
            <button type="button" class="ff-icon-btn" aria-label="Dismiss" title="Dismiss" @click="failed = failed.filter((x) => x !== f)"><X class="h-[18px] w-[18px]" /></button>
          </li>
          <li v-for="m in materials" :key="m.id" class="ff-item flex items-center gap-3 px-4 py-3">
            <KindTile :kind="m.kind" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-medium" :title="m.title">{{ m.title }}</p>
              <MaterialState :material="m" @retry="b.retry(m)" />
            </div>
            <NuxtLink v-if="m.kind === 'slides'" :to="`/learn/${courseId}/slides/${m.id}`" class="ff-icon-btn" :aria-label="`Preview ${m.title}`" title="Preview slides"><Eye class="h-[18px] w-[18px]" /></NuxtLink>
            <button type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Remove ${m.title}`" title="Remove" @click="b.removeMaterial(m)"><Trash2 class="h-[18px] w-[18px]" /></button>
          </li>
        </ul>

        <!-- Secondary: videos and links -->
        <div>
          <Button v-if="!showLink" size="lg" type="button" variant="tinted" @click="showLink = true">
            <LinkIcon class="mr-2 h-4 w-4" />Add video or link
          </Button>
          <form v-else class="ff-group space-y-3 p-4" @submit.prevent="addLink">
            <div class="ff-segment" role="group" aria-label="Link type">
              <button type="button" :aria-pressed="link.kind === 'video'" @click="link.kind = 'video'">YouTube video</button>
              <button type="button" :aria-pressed="link.kind === 'link'" @click="link.kind = 'link'">Web link</button>
            </div>
            <Input v-model="link.url" class="ff-field" :placeholder="link.kind === 'video' ? 'https://youtube.com/watch?v=…' : 'https://…'" aria-label="Address" />
            <Input v-model="link.title" class="ff-field" placeholder="Title (optional)" aria-label="Title" />
            <div class="flex justify-end gap-2">
              <Button size="lg" type="button" variant="gray" @click="showLink = false">Cancel</Button>
              <Button size="lg" type="submit" variant="tinted" :disabled="addingLink || !link.url.trim()">{{ addingLink ? 'Adding…' : 'Add' }}</Button>
            </div>
          </form>
        </div>

        <p v-if="allowanceLeft" class="px-1 text-[13px] text-muted-foreground">{{ allowanceLeft }}</p>
      </div>
    </StepShell>
  </NuxtLayout>
</template>
