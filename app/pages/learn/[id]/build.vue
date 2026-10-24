<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText, Presentation, PlayCircle, Link2, Upload, Loader2, CheckCircle2, AlertCircle, RotateCw, Trash2,
  Sparkles, ChevronUp, ChevronDown, Plus, Eye, Pencil, Globe, Lock, Rocket, Undo2, Users,
} from 'lucide-vue-next'
import { useLearn, apiError, kindLabel, type CreatorView, type Material, type Unit, type MaterialKind, type Concept } from '~/composables/learn/useLearn'
import ConceptSources from '~/components/learn/ConceptSources.vue'
import { renderMarkdown } from '~/utils/markdown'

definePageMeta({ layout: false, middleware: ['auth'] })

const route = useRoute()
const courseId = Number(route.params.id)
const api = useLearn()

const view = ref<CreatorView | null>(null)
const loading = ref(true)
const loadError = ref('')
const notice = ref<{ kind: 'error' | 'ok'; text: string } | null>(null)

const course = computed(() => view.value?.course)
const materials = computed(() => view.value?.materials ?? [])
const units = computed(() => view.value?.units ?? [])
const limits = computed(() => view.value?.limits)
const isPublished = computed(() => course.value?.course_status === 'published')

useHead(() => ({ title: `${course.value?.course_title || 'Course'} · Build - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'Home', href: '/' },
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}/build`, current: true },
])

const flash = (kind: 'error' | 'ok', text: string) => {
  notice.value = { kind, text }
  if (kind === 'ok') setTimeout(() => { if (notice.value?.text === text) notice.value = null }, 4000)
}

const load = async (quiet = false) => {
  if (!quiet) loading.value = true
  try {
    const v = await api.course(courseId)
    if (v.role !== 'creator') {
      await navigateTo(`/learn/${courseId}`)
      return
    }
    view.value = v
    loadError.value = ''
  } catch (e) {
    if (!quiet) loadError.value = apiError(e, 'Could not load this course.')
  } finally {
    loading.value = false
  }
}

// Refresh every 3 s while the AI is reading materials or organising
const busy = computed(() =>
  materials.value.some((m) => m.status === 'processing') || course.value?.organise_status === 'processing' ||
  course.value?.references_status === 'processing')
let poll: ReturnType<typeof setInterval> | undefined
watch(busy, (b) => {
  clearInterval(poll)
  if (b) poll = setInterval(() => load(true), 3000)
}, { immediate: true })
onMounted(() => load())
onBeforeUnmount(() => clearInterval(poll))

// ── materials ──────────────────────────────────────────────────────────
const uploading = ref<string[]>([])
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const uploadFiles = async (files: FileList | File[]) => {
  for (const file of Array.from(files)) {
    uploading.value.push(file.name)
    try {
      await api.uploadFile(courseId, file, file.name.replace(/\.(pdf|pptx)$/i, ''))
    } catch (e) {
      flash('error', `${file.name}: ${apiError(e)}`)
    } finally {
      uploading.value = uploading.value.filter((n) => n !== file.name)
    }
  }
  await load(true)
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

const linkForm = ref<{ kind: 'video' | 'link'; url: string; title: string; note: string }>({ kind: 'video', url: '', title: '', note: '' })
const addingLink = ref(false)
const addLink = async () => {
  if (!linkForm.value.url.trim()) return
  addingLink.value = true
  try {
    await api.addLink(courseId, { ...linkForm.value, url: linkForm.value.url.trim(), title: linkForm.value.title.trim() })
    linkForm.value = { kind: linkForm.value.kind, url: '', title: '', note: '' }
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  } finally {
    addingLink.value = false
  }
}

const removeMaterial = async (m: Material) => {
  if (!confirm(`Remove "${m.title}" from this course?`)) return
  try {
    await api.deleteMaterial(m.id)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const retry = async (m: Material) => {
  try {
    await api.retryMaterial(m.id)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}

const kindIcon: Record<MaterialKind, any> = { pdf: FileText, slides: Presentation, video: PlayCircle, link: Link2 }
const sizeLabel = (b?: number) => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`) : '')

// ── organise ───────────────────────────────────────────────────────────
const readyCount = computed(() => materials.value.filter((m) => m.status === 'ready').length)
const runsLeft = computed(() => Math.max(0, (limits.value?.organise_runs_per_course ?? 0) - (course.value?.organise_runs ?? 0)))
const organiseBlocked = computed(() => {
  if (isPublished.value) return 'Unpublish the course to organise it again.'
  if (materials.value.some((m) => m.status === 'processing')) return 'Wait until every material has been read.'
  if (!readyCount.value) return 'Add at least one material first.'
  if (!runsLeft.value) return 'You have used all AI organise runs for this course. You can still edit units by hand.'
  return ''
})
const organise = async () => {
  if (units.value.length && !confirm('This replaces the current units with a new AI proposal. Continue?')) return
  try {
    await api.organise(courseId)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}

// ── units ──────────────────────────────────────────────────────────────
const editing = ref<number | null>(null)
const draft = ref<{ title: string; body: string; material_ids: number[] }>({ title: '', body: '', material_ids: [] })
const preview = ref(false)
const savingUnit = ref(false)

const startEdit = (u: Unit) => {
  editing.value = u.id
  preview.value = false
  draft.value = { title: u.title, body: u.body, material_ids: (u.materials ?? []).map((m) => m.id) }
}
const toggleMaterial = (id: number) => {
  const ids = draft.value.material_ids
  draft.value.material_ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}
const saveUnit = async (u: Unit) => {
  savingUnit.value = true
  try {
    await api.updateUnit(u.id, draft.value)
    editing.value = null
    await load(true)
    flash('ok', 'Unit saved.')
  } catch (e) {
    flash('error', apiError(e))
  } finally {
    savingUnit.value = false
  }
}
const removeUnit = async (u: Unit) => {
  if (!confirm(`Delete the unit "${u.title}"?`)) return
  try {
    await api.deleteUnit(u.id)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const move = async (index: number, delta: number) => {
  const ids = units.value.map((u) => u.id)
  const j = index + delta
  if (j < 0 || j >= ids.length) return
  ;[ids[index], ids[j]] = [ids[j], ids[index]]
  try {
    await api.reorderUnits(courseId, ids)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const newUnitTitle = ref('')
const addUnit = async () => {
  if (!newUnitTitle.value.trim()) return
  try {
    const res = await api.addUnit(courseId, newUnitTitle.value.trim())
    newUnitTitle.value = ''
    await load(true)
    const u = units.value.find((x) => x.id === res.data.id)
    if (u) startEdit(u)
  } catch (e) {
    flash('error', apiError(e))
  }
}

// ── concepts ───────────────────────────────────────────────────────────
const editingConcept = ref<number | null>(null)
const conceptDraft = ref({ title: '', explanation: '' })
const newConcept = ref('')

const startConceptEdit = (c: Concept) => {
  editingConcept.value = c.id
  conceptDraft.value = { title: c.title, explanation: c.explanation }
}
const saveConcept = async (c: Concept) => {
  try {
    await api.updateConcept(c.id, conceptDraft.value)
    editingConcept.value = null
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const removeConcept = async (c: Concept) => {
  if (!confirm(`Remove the concept "${c.title}"?`)) return
  try {
    await api.deleteConcept(c.id)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const moveConcept = async (u: Unit, index: number, delta: number) => {
  const ids = (u.concepts ?? []).map((c) => c.id)
  const j = index + delta
  if (j < 0 || j >= ids.length) return
  ;[ids[index], ids[j]] = [ids[j], ids[index]]
  try {
    await api.reorderConcepts(u.id, ids)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const removeReference = async (c: Concept, url: string) => {
  try {
    await api.updateConcept(c.id, { keep_reference_urls: (c.references ?? []).map((r) => r.url).filter((u) => u !== url) })
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
const findReferences = async () => {
  try {
    await api.findReferences(courseId)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}

const addConcept = async (u: Unit) => {
  if (!newConcept.value.trim()) return
  try {
    const res = await api.addConcept(u.id, newConcept.value.trim())
    newConcept.value = ''
    await load(true)
    const fresh = units.value.find((x) => x.id === u.id)?.concepts?.find((c) => c.id === res.data.id)
    if (fresh) startConceptEdit(fresh)
  } catch (e) {
    flash('error', apiError(e))
  }
}

// ── publish ────────────────────────────────────────────────────────────
const visibility = ref<'public' | 'private'>('public')
const confirmRights = ref(false)
const publishing = ref(false)
const publish = async () => {
  publishing.value = true
  try {
    await api.publish(courseId, visibility.value, confirmRights.value)
    await load(true)
    flash('ok', visibility.value === 'public' ? 'Published! Learners can now find your course in Browse.' : 'Published privately.')
  } catch (e) {
    flash('error', apiError(e))
  } finally {
    publishing.value = false
  }
}
const unpublish = async () => {
  if (!confirm('Move the course back to draft? Learners will not see it until you publish again.')) return
  try {
    await api.unpublish(courseId)
    await load(true)
  } catch (e) {
    flash('error', apiError(e))
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <div v-if="loading" class="space-y-4 animate-pulse">
        <div class="h-10 w-1/2 rounded bg-muted/60" /><div class="h-48 rounded-lg bg-muted/60" /><div class="h-48 rounded-lg bg-muted/60" />
      </div>
      <div v-else-if="loadError" class="bg-destructive/10 text-destructive p-4 rounded-lg">
        {{ loadError }} <NuxtLink to="/learn" class="underline ml-2">Back to my courses</NuxtLink>
      </div>

      <template v-else-if="view && course">
        <!-- Header -->
        <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-foreground">{{ course.course_title }}</h1>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="isPublished ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'">
                {{ isPublished ? 'Published' : 'Draft' }}
              </span>
              <span v-if="isPublished" class="flex items-center gap-1 text-muted-foreground">
                <Globe v-if="course.course_visibility === 'public'" class="h-3.5 w-3.5" /><Lock v-else class="h-3.5 w-3.5" />
                {{ course.course_visibility === 'public' ? 'Public' : 'Private' }}
              </span>
              <span class="flex items-center gap-1 text-muted-foreground"><Users class="h-3.5 w-3.5" />{{ view.learners }} learners</span>
            </div>
          </div>
          <NuxtLink v-if="isPublished" :to="`/learn/${courseId}`"><Button variant="outline"><Eye class="h-4 w-4 mr-2" />View as learner</Button></NuxtLink>
        </div>

        <div v-if="notice" class="mb-6 rounded-lg p-3 text-sm flex items-start gap-2"
          :class="notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'">
          <AlertCircle v-if="notice.kind === 'error'" class="h-4 w-4 mt-0.5 shrink-0" /><CheckCircle2 v-else class="h-4 w-4 mt-0.5 shrink-0" />
          <span class="flex-1">{{ notice.text }}</span>
          <button type="button" class="opacity-60 hover:opacity-100" @click="notice = null">✕</button>
        </div>

        <!-- 1. Materials -->
        <section class="rounded-lg border border-border bg-card p-5 mb-6">
          <div class="flex items-baseline justify-between mb-1">
            <h2 class="text-lg font-semibold">1. Materials</h2>
            <span class="text-xs text-muted-foreground">{{ materials.length }} of {{ limits?.materials_per_course }}</span>
          </div>
          <p class="text-sm text-muted-foreground mb-4">Add your notes, slides and videos. The AI reads every file and watches every YouTube video to find the concepts it teaches.</p>

          <div class="rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
            :class="dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
            @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="onDrop" @click="fileInput?.click()">
            <Upload class="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p class="font-medium">Drop PDF or PowerPoint (.pptx) files here, or click to choose</p>
            <p class="text-xs text-muted-foreground mt-1">Up to {{ Math.round((limits?.max_file_bytes ?? 0) / 1048576) }} MB each</p>
            <input ref="fileInput" type="file" class="hidden" multiple accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" @change="onPick">
          </div>
          <div v-for="name in uploading" :key="name" class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 class="h-4 w-4 animate-spin" /> Uploading {{ name }}…
          </div>

          <form class="mt-4 grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto] items-center" @submit.prevent="addLink">
            <select v-model="linkForm.kind" class="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="video">YouTube video</option>
              <option value="link">Web link</option>
            </select>
            <Input v-model="linkForm.url" :placeholder="linkForm.kind === 'video' ? 'https://youtube.com/watch?v=…' : 'https://…'" />
            <Input v-model="linkForm.title" placeholder="Title (optional)" />
            <Button type="submit" variant="outline" :disabled="addingLink || !linkForm.url.trim()"><Plus class="h-4 w-4 mr-1" />Add</Button>
          </form>

          <ul v-if="materials.length" class="mt-5 divide-y divide-border">
            <li v-for="m in materials" :key="m.id" class="py-3 flex items-start gap-3">
              <component :is="kindIcon[m.kind]" class="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2">
                  <a :href="m.url" target="_blank" rel="noopener" class="font-medium hover:underline truncate">{{ m.title }}</a>
                  <span class="text-xs text-muted-foreground">{{ kindLabel[m.kind] }} {{ sizeLabel(m.size_bytes) }}</span>
                </div>
                <p v-if="m.status === 'ready' && m.digest?.summary && m.kind !== 'link'" class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ m.digest.summary }}</p>
                <p v-if="m.status === 'ready' && m.digest?.concepts?.length" class="text-xs text-primary mt-1">
                  {{ m.digest.concepts.length }} concepts found: {{ m.digest.concepts.slice(0, 4).map((c) => c.name).join(', ') }}{{ m.digest.concepts.length > 4 ? '…' : '' }}
                </p>
                <p v-if="m.status === 'failed'" class="text-xs text-destructive mt-1">{{ m.error }}</p>
              </div>
              <span v-if="m.status === 'processing'" class="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 class="h-3.5 w-3.5 animate-spin" />{{ m.kind === 'video' ? 'Watching…' : 'Reading…' }}</span>
              <CheckCircle2 v-else-if="m.status === 'ready'" class="h-4 w-4 text-green-600 mt-0.5" />
              <button v-else-if="m.status === 'failed'" type="button" class="flex items-center gap-1 text-xs text-primary hover:underline" @click="retry(m)"><RotateCw class="h-3.5 w-3.5" />Retry</button>
              <button type="button" class="text-muted-foreground hover:text-destructive" title="Remove" @click="removeMaterial(m)"><Trash2 class="h-4 w-4" /></button>
            </li>
          </ul>
        </section>

        <!-- 2. Organise -->
        <section class="rounded-lg border border-border bg-card p-5 mb-6">
          <h2 class="text-lg font-semibold mb-1">2. Organise with AI</h2>
          <p class="text-sm text-muted-foreground mb-4">
            The AI reads every material, finds the key concepts and where each one appears (pages, slides, video times), then builds units that explain each concept step by step with an example, a common mistake and a self-check question, linked to its sources. It then searches the web for free resources to expand each concept. You can edit everything afterwards.
          </p>
          <div v-if="course.organise_status === 'processing'" class="flex items-center gap-2 text-sm">
            <Loader2 class="h-4 w-4 animate-spin text-primary" /> Organising your course… this usually takes under a minute.
          </div>
          <template v-else>
            <div class="flex flex-wrap items-center gap-3">
              <Button type="button" :disabled="!!organiseBlocked" @click="organise">
                <Sparkles class="h-4 w-4 mr-2" />{{ units.length ? 'Organise again' : 'Organise into units' }}
              </Button>
              <span class="text-xs text-muted-foreground">{{ runsLeft }} of {{ limits?.organise_runs_per_course }} AI runs left</span>
            </div>
            <p v-if="organiseBlocked" class="mt-2 text-sm text-muted-foreground">{{ organiseBlocked }}</p>
            <p v-if="course.organise_status === 'failed' && course.organise_error" class="mt-2 text-sm text-destructive">{{ course.organise_error }}</p>
          </template>
          <div v-if="units.length" class="mt-4 border-t border-border pt-4 flex flex-wrap items-center gap-3 text-sm">
            <span class="font-medium">Expand-your-knowledge references:</span>
            <span v-if="course.references_status === 'processing'" class="flex items-center gap-1 text-muted-foreground"><Loader2 class="h-4 w-4 animate-spin" />Searching the web for good resources…</span>
            <span v-else-if="course.references_status === 'ready'" class="text-green-700 dark:text-green-400">added to each concept</span>
            <span v-else-if="course.references_status === 'failed'" class="text-destructive">some units could not be searched</span>
            <Button v-if="course.references_status !== 'processing'" type="button" variant="outline" class="h-8 px-3" @click="findReferences">
              {{ course.references_status === 'idle' ? 'Find references' : 'Search again' }}
            </Button>
          </div>
        </section>

        <!-- 3. Units -->
        <section class="rounded-lg border border-border bg-card p-5 mb-6">
          <h2 class="text-lg font-semibold mb-1">3. Units</h2>
          <p class="text-sm text-muted-foreground mb-4">Learners go through units in this order and must finish each one before the next opens.</p>

          <div v-if="!units.length" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No units yet. Organise with AI, or add a unit by hand below.
          </div>

          <ol class="space-y-3">
            <li v-for="(u, i) in units" :key="u.id" class="rounded-lg border border-border">
              <div class="flex items-center gap-3 p-3">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ u.title }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ (u.concepts ?? []).length }} concepts · {{ (u.materials ?? []).length }} materials · {{ u.source === 'ai' ? 'drafted by AI' : 'written by you' }}
                  </p>
                </div>
                <button type="button" class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === 0" title="Move up" @click="move(i, -1)"><ChevronUp class="h-4 w-4" /></button>
                <button type="button" class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === units.length - 1" title="Move down" @click="move(i, 1)"><ChevronDown class="h-4 w-4" /></button>
                <button type="button" class="p-1 text-muted-foreground hover:text-foreground" title="Edit" @click="editing === u.id ? (editing = null) : startEdit(u)"><Pencil class="h-4 w-4" /></button>
                <button type="button" class="p-1 text-muted-foreground hover:text-destructive" title="Delete" @click="removeUnit(u)"><Trash2 class="h-4 w-4" /></button>
              </div>

              <div v-if="editing === u.id" class="border-t border-border p-4 space-y-4">
                <Input v-model="draft.title" placeholder="Unit title" maxlength="255" />
                <div>
                  <div class="flex gap-1 mb-2">
                    <Button type="button" :variant="preview ? 'ghost' : 'secondary'" class="h-8 px-3" @click="preview = false">Write</Button>
                    <Button type="button" :variant="preview ? 'secondary' : 'ghost'" class="h-8 px-3" @click="preview = true">Preview</Button>
                  </div>
                  <textarea v-if="!preview" v-model="draft.body" rows="12"
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Unit introduction: what this unit covers and why it matters. Markdown works." />
                  <div v-else class="md-content rounded-md border border-border p-4 min-h-40" v-html="renderMarkdown(draft.body)" />
                </div>
                <!-- Concepts -->
                <div>
                  <p class="text-sm font-medium mb-2">Concepts <span class="text-muted-foreground font-normal">(each explained and linked to its sources; changes save on their own)</span></p>
                  <ol class="space-y-2">
                    <li v-for="(c, ci) in u.concepts ?? []" :key="c.id" class="rounded-md border border-border p-3">
                      <template v-if="editingConcept === c.id">
                        <Input v-model="conceptDraft.title" class="mb-2" maxlength="255" />
                        <textarea v-model="conceptDraft.explanation" rows="6"
                          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Explain the concept (Markdown)" />
                        <div class="mt-2 flex justify-end gap-2">
                          <Button type="button" variant="outline" class="h-8 px-3" @click="editingConcept = null">Cancel</Button>
                          <Button type="button" class="h-8 px-3" :disabled="!conceptDraft.title.trim()" @click="saveConcept(c)">Save concept</Button>
                        </div>
                      </template>
                      <template v-else>
                        <div class="flex items-start gap-2">
                          <span class="text-xs text-primary font-semibold mt-0.5">{{ ci + 1 }}.</span>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium">{{ c.title }}</p>
                            <p class="text-xs text-muted-foreground line-clamp-2 mt-0.5">{{ c.explanation }}</p>
                            <ConceptSources class="mt-2" :sources="c.sources" />
                            <div v-if="c.references?.length" class="mt-2 flex flex-wrap gap-1.5">
                              <span v-for="r in c.references" :key="r.url" class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                                <a :href="r.url" target="_blank" rel="noopener" class="hover:underline">{{ r.site }}</a>
                                <button type="button" class="opacity-60 hover:opacity-100 hover:text-destructive" title="Remove this reference" @click="removeReference(c, r.url)">✕</button>
                              </span>
                            </div>
                            <p v-if="!c.sources.length" class="mt-1 text-xs text-amber-700 dark:text-amber-400">No source linked</p>
                          </div>
                          <button type="button" class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="ci === 0" title="Move up" @click="moveConcept(u, ci, -1)"><ChevronUp class="h-4 w-4" /></button>
                          <button type="button" class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="ci === (u.concepts ?? []).length - 1" title="Move down" @click="moveConcept(u, ci, 1)"><ChevronDown class="h-4 w-4" /></button>
                          <button type="button" class="p-1 text-muted-foreground hover:text-foreground" title="Edit" @click="startConceptEdit(c)"><Pencil class="h-4 w-4" /></button>
                          <button type="button" class="p-1 text-muted-foreground hover:text-destructive" title="Remove" @click="removeConcept(c)"><Trash2 class="h-4 w-4" /></button>
                        </div>
                      </template>
                    </li>
                  </ol>
                  <form class="mt-2 flex gap-2" @submit.prevent="addConcept(u)">
                    <Input v-model="newConcept" placeholder="Add a concept" maxlength="255" />
                    <Button type="submit" variant="outline" :disabled="!newConcept.trim()"><Plus class="h-4 w-4 mr-1" />Add</Button>
                  </form>
                </div>

                <div>
                  <p class="text-sm font-medium mb-2">Materials in this unit <span class="text-muted-foreground font-normal">(in the order you tick them)</span></p>
                  <div class="grid gap-1 sm:grid-cols-2">
                    <label v-for="m in materials" :key="m.id" class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                      <input type="checkbox" :checked="draft.material_ids.includes(m.id)" @change="toggleMaterial(m.id)">
                      <component :is="kindIcon[m.kind]" class="h-4 w-4 text-muted-foreground" />
                      <span class="truncate">{{ m.title }}</span>
                      <span v-if="draft.material_ids.includes(m.id)" class="ml-auto text-xs text-primary">#{{ draft.material_ids.indexOf(m.id) + 1 }}</span>
                    </label>
                  </div>
                </div>
                <div class="flex justify-end gap-2">
                  <Button type="button" variant="outline" @click="editing = null">Cancel</Button>
                  <Button type="button" :disabled="savingUnit || !draft.title.trim()" @click="saveUnit(u)">{{ savingUnit ? 'Saving…' : 'Save unit' }}</Button>
                </div>
              </div>
            </li>
          </ol>

          <form class="mt-4 flex gap-2" @submit.prevent="addUnit">
            <Input v-model="newUnitTitle" placeholder="New unit title" maxlength="255" />
            <Button type="submit" variant="outline" :disabled="!newUnitTitle.trim()"><Plus class="h-4 w-4 mr-1" />Add unit</Button>
          </form>
        </section>

        <!-- 4. Publish -->
        <section class="rounded-lg border border-border bg-card p-5">
          <h2 class="text-lg font-semibold mb-1">4. Publish</h2>
          <template v-if="!isPublished">
            <p class="text-sm text-muted-foreground mb-4">Publishing makes the course available to learners. You can unpublish at any time.</p>
            <div class="space-y-2 mb-4">
              <label class="flex items-start gap-2 text-sm cursor-pointer">
                <input v-model="visibility" type="radio" value="public" class="mt-1">
                <span><span class="font-medium">Public</span>: anyone on FocusFlow can find and join it for free.</span>
              </label>
              <label class="flex items-start gap-2 text-sm cursor-pointer">
                <input v-model="visibility" type="radio" value="private" class="mt-1">
                <span><span class="font-medium">Private</span>: only you, and learners you invite.</span>
              </label>
            </div>
            <label v-if="visibility === 'public'" class="flex items-start gap-2 text-sm mb-4 rounded-md bg-muted/50 p-3 cursor-pointer">
              <input v-model="confirmRights" type="checkbox" class="mt-1">
              <span>I confirm I have the right to share these materials publicly (they are my own, or their licence allows sharing).</span>
            </label>
            <Button type="button" :disabled="publishing || !units.length || (visibility === 'public' && !confirmRights)" @click="publish">
              <Rocket class="h-4 w-4 mr-2" />{{ publishing ? 'Publishing…' : 'Publish course' }}
            </Button>
            <p v-if="!units.length" class="mt-2 text-sm text-muted-foreground">Add at least one unit first.</p>
          </template>
          <template v-else>
            <p class="text-sm text-muted-foreground mb-4">
              Your course is live. To reorganise it with AI, move it back to draft first (learners keep their place unless units are replaced).
            </p>
            <Button type="button" variant="outline" @click="unpublish"><Undo2 class="h-4 w-4 mr-2" />Move back to draft</Button>
          </template>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
