<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLearn, apiError, type SlidePage, type CreatorView } from '~/composables/learn/useLearn'
import SlideView from '~/components/learn/SlideView.vue'
import FfSwitch from '~/components/learn/quiz/FfSwitch.vue'
import { blocksToText, textToBlocks } from '~/utils/slideMarkdown'
import { Input } from '@/components/ui/input'

// Slides as written (F3.7): read a PowerPoint one slide at a time, inside
// FocusFlow. For now the creator previews a material here; learners will
// reach the same view through their units (F3.3). ?slide=N keeps the place.
definePageMeta({ layout: false, middleware: ['auth'] })

const route = useRoute()
const courseId = Number(route.params.id)
const materialId = Number(route.params.mid)
const api = useLearn()

const view = ref<CreatorView | null>(null)
const pages = ref<SlidePage[]>([])
const loading = ref(true)
const error = ref('')

const material = computed(() => view.value?.materials.find((m) => m.id === materialId) ?? null)
// Hidden slides are skipped, as learners will see it.
const editMode = ref(false)
// While editing, hidden slides stay in the list so they can be shown again
const shown = computed(() => (editMode.value ? pages.value : pages.value.filter((p) => !p.hidden)))
const hiddenCount = computed(() => pages.value.length - shown.value.length)
const step = computed(() => Math.min(Math.max(1, Number(route.query.slide) || 1), Math.max(1, shown.value.length)) - 1)
const page = computed(() => shown.value[step.value] ?? null)
const last = computed(() => step.value >= shown.value.length - 1)
const backTo = `/learn/${courseId}/upload`

// ── page editor (F3.6) ────────────────────────────────────────────────────
const draftTitle = ref('')
const draftText = ref('')
const savingPage = ref(false)
const pageMsg = ref('')
watch([page, editMode], () => {
  if (page.value) {
    draftTitle.value = page.value.title
    draftText.value = blocksToText(page.value.blocks)
  }
  pageMsg.value = ''
}, { immediate: true })
const draftBlocks = computed(() => (page.value ? textToBlocks(draftText.value, page.value.blocks) : []))
const previewPage = computed(() => (page.value && editMode.value ? { ...page.value, title: draftTitle.value, blocks: draftBlocks.value } : page.value))
const savePage = async (extra: { hidden?: boolean } = {}) => {
  if (!page.value) return
  savingPage.value = true
  pageMsg.value = ''
  try {
    const res = await api.updateSlidePage(page.value.id, { title: draftTitle.value, blocks: draftBlocks.value, ...extra })
    const i = pages.value.findIndex((p) => p.id === res.data.id)
    if (i >= 0) pages.value[i] = res.data
    pageMsg.value = 'Saved.'
  } catch (e) {
    pageMsg.value = apiError(e, 'Could not save.')
  } finally {
    savingPage.value = false
  }
}
const toggleDiagram = (on: boolean) => {
  const t = draftText.value.replace(/\n?\[diagram\]\n?/g, '\n').trim()
  draftText.value = on ? `${t}\n\n[diagram]` : t
}

const go = async (i: number) => {
  await navigateTo({ query: { ...route.query, slide: i > 0 ? i + 1 : undefined } }, { replace: true })
  document.querySelector('main')?.scrollTo({ top: 0 })
}
const onKey = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement)?.closest('input, textarea, iframe')) return
  if (e.key === 'ArrowRight' && !last.value) go(step.value + 1)
  if (e.key === 'ArrowLeft' && step.value > 0) go(step.value - 1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

useHead(() => ({ title: `${material.value?.title || 'Slides'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: view.value?.course.course_title || 'Course', href: backTo },
  { title: material.value?.title || 'Slides', href: route.path, current: true },
])

onMounted(async () => {
  try {
    const v = await api.course(courseId)
    if (v.role !== 'creator') throw new Error('Only the course creator can preview materials.')
    view.value = v
    pages.value = (await api.slidePages(materialId)).pages
  } catch (e) {
    error.value = apiError(e, 'These slides could not be opened.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-3xl px-5 pt-6 pb-32 sm:px-8 sm:pt-10 sm:pb-16">
      <div v-if="loading" class="space-y-4" aria-busy="true">
        <div class="h-1.5 animate-pulse rounded-full bg-muted" />
        <div class="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div class="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div v-else-if="error" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ error }} <NuxtLink :to="backTo" class="ml-2 underline">Back to materials</NuxtLink>
      </div>

      <div v-else-if="!page" class="ff-group p-8 text-center">
        <p class="text-[17px] font-semibold">No slides to show</p>
        <p class="mt-1 text-[15px] text-muted-foreground">Every slide in this file is hidden.</p>
        <NuxtLink :to="backTo"><Button size="lg" variant="gray" class="mt-5">Back to materials</Button></NuxtLink>
      </div>

      <template v-else>
        <p class="mb-4 text-[13px] text-muted-foreground">
          <button type="button" class="ff-pill-sm mr-2" @click="editMode = !editMode">{{ editMode ? 'Done editing' : 'Edit slides' }}</button>
          <template v-if="page.hidden"><span class="ff-pill-sm mr-2">Hidden</span></template>
          Preview: this is how learners read these slides.<template v-if="hiddenCount">{{ ' ' }}{{ hiddenCount }} hidden {{ hiddenCount === 1 ? 'slide is' : 'slides are' }} skipped.</template>
        </p>

        <!-- Where am I: segments for short decks, one bar for long ones -->
        <div v-if="shown.length <= 30" class="mb-8 flex gap-1" aria-hidden="true">
          <span v-for="(_, i) in shown" :key="i" class="h-1 flex-1 rounded-full transition-colors"
            :class="i <= step ? 'bg-primary' : 'bg-foreground/[0.08]'" />
        </div>
        <div v-else class="mb-8 h-1 overflow-hidden rounded-full bg-foreground/[0.08]" aria-hidden="true">
          <div class="h-full rounded-full bg-primary transition-[width]" :style="{ width: `${((step + 1) / shown.length) * 100}%` }" />
        </div>

        <article>
          <p class="text-[13px] font-medium text-muted-foreground">
            Slide {{ step + 1 }} of {{ shown.length }}<template v-if="page.section"> · {{ page.section }}</template>
          </p>
          <h1 class="mt-1 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{{ previewPage?.title || `Slide ${step + 1}` }}</h1>
          <SlideView v-if="previewPage?.blocks.length" class="mt-6" :page="previewPage" :material-url="material?.url || ''" :material-title="material?.title || 'the file'" />

          <!-- Page editor: the teacher fixes what was read from the file -->
          <section v-if="editMode" class="ff-group mt-8 space-y-4 p-4" aria-label="Edit this slide">
            <div class="flex items-center gap-3">
              <span class="min-w-0 flex-1 text-[15px] font-medium">Hide from learners</span>
              <FfSwitch :model-value="page.hidden" label="Hide from learners" @update:model-value="(v) => savePage({ hidden: v })" />
            </div>
            <div class="flex items-center gap-3">
              <span class="min-w-0 flex-1 text-[15px] font-medium">"See the original" card</span>
              <FfSwitch :model-value="draftText.includes('[diagram]')" label="See the original card" @update:model-value="toggleDiagram" />
            </div>
            <div>
              <label for="pg-title" class="ff-label">Title</label>
              <Input id="pg-title" v-model="draftTitle" class="ff-field" maxlength="500" />
            </div>
            <div>
              <label for="pg-text" class="ff-label">Text</label>
              <textarea id="pg-text" v-model="draftText" rows="10" class="ff-field font-mono text-[13px]" spellcheck="true" />
              <p class="mt-1 px-1 text-[13px] text-muted-foreground">"- " starts a bullet, two spaces per level, **bold**, *italic*, `code`, [text](https://link). Move or delete [picture 1] lines to move or remove pictures.</p>
            </div>
            <div class="flex items-center justify-end gap-3">
              <span v-if="pageMsg" class="text-[13px] text-muted-foreground" role="status">{{ pageMsg }}</span>
              <Button size="lg" variant="tinted" :disabled="savingPage" @click="savePage()">{{ savingPage ? 'Saving…' : 'Save slide' }}</Button>
            </div>
          </section>

          <section v-if="page.notes" class="mt-12 border-t border-border/70 pt-6">
            <h2 class="ff-label">Speaker notes</h2>
            <p class="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{{ page.notes }}</p>
          </section>
        </article>

        <!-- Back · Next: same place on every slide; frosted bar on phones -->
        <div class="fixed inset-x-0 bottom-0 z-10 border-t border-border/60 bg-background/75 backdrop-blur-xl sm:static sm:mt-12 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
          <div class="mx-auto flex max-w-3xl items-center gap-2 px-5 py-3 sm:px-0 sm:py-0">
            <Button v-if="step > 0" size="lg" variant="gray" @click="go(step - 1)">Back</Button>
            <NuxtLink v-else :to="backTo"><Button size="lg" variant="gray">Materials</Button></NuxtLink>
            <div class="ml-auto">
              <Button v-if="!last" size="lg" @click="go(step + 1)">Next</Button>
              <NuxtLink v-else :to="backTo"><Button size="lg">Done</Button></NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
