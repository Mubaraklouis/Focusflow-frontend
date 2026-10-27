<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Scissors, Merge, EyeOff, Shapes, Eye, Sparkles, Loader2 } from 'lucide-vue-next'
import { apiError, type Material, type SlidePage } from '~/composables/learn/useLearn'
import { useCourseBuilder } from '~/composables/learn/useCourseBuilder'
import StepShell from '~/components/learn/StepShell.vue'

// Step 2 (slides as written, F3.3) · one job: cut the slides into units.
// Each unit is a run of slides; the scissors on a slide start a new unit
// there, the join button merges a unit into the one before. Cuts start from
// the deck's PowerPoint sections (F3.4).
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const b = useCourseBuilder(courseId)
const { course, materials, units, loading, loadError, notice, slidesMode } = b

useHead(() => ({ title: `Units · ${course.value?.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}/units`, current: true },
])

type Deck = {
  material: Material
  pages: SlidePage[]
  starts: number[] // slide numbers where a unit starts, sorted, always 1 first
  titles: Record<number, string> // titles the teacher typed, by start slide
}
const decks = ref<Deck[]>([])
const decksLoading = ref(true)
const decksError = ref('')
const saving = ref(false)

const sectionStarts = (pages: SlidePage[]) => {
  const out = [1]
  for (let i = 1; i < pages.length; i++) {
    if (pages[i].section && pages[i].section !== pages[i - 1].section) out.push(pages[i].number)
  }
  return out
}
const hasSections = (d: Deck) => sectionStarts(d.pages).length > 1

// Cuts and titles: the saved units first, else the deck's sections.
const initDeck = (material: Material, pages: SlidePage[], useSaved = true): Deck => {
  const saved = !useSaved ? [] : units.value.flatMap((u) => (u.slides ?? []).filter((r) => r.material_id === material.id).map((r) => ({ u, r })))
  if (saved.length) {
    const titles: Record<number, string> = {}
    const starts = saved.map(({ u, r }) => { titles[r.first_page || 1] = u.title; return r.first_page || 1 })
    return { material, pages, starts: [...new Set([1, ...starts])].sort((a, b) => a - b), titles }
  }
  const titles: Record<number, string> = {}
  for (const n of sectionStarts(pages)) {
    const section = pages.find((p) => p.number === n)?.section
    if (section) titles[n] = section
  }
  return { material, pages, starts: sectionStarts(pages), titles }
}

// Once: the builder refreshes the course in the background, which must not
// undo the teacher's cuts.
let started = false
watch(() => !loading.value && !!course.value, async (ready) => {
  if (!ready || started) return
  started = true
  if (!slidesMode.value) return navigateTo(`/learn/${courseId}/organise`, { replace: true })
  decksLoading.value = true
  try {
    const slides = materials.value.filter((m) => m.kind === 'slides')
    const pages = await Promise.all(slides.map((m) => b.api.slidePages(m.id).then((r) => r.pages)))
    decks.value = slides.map((m, i) => initDeck(m, pages[i]))
  } catch (e) {
    decksError.value = apiError(e, 'Could not read your slides.')
  } finally {
    decksLoading.value = false
  }
}, { immediate: true })

// ── units derived from the cuts ───────────────────────────────────────────
type DraftUnit = { deck: Deck; first: number; last: number; slides: SlidePage[] }
const unitsOf = (d: Deck): DraftUnit[] => {
  const last = d.pages.length ? d.pages[d.pages.length - 1].number : 1
  return d.starts.map((first, i) => {
    const end = i + 1 < d.starts.length ? d.starts[i + 1] - 1 : last
    return { deck: d, first, last: end, slides: d.pages.filter((p) => p.number >= first && p.number <= end) }
  })
}
const draft = computed(() => decks.value.flatMap(unitsOf))
const unitNumber = (u: DraftUnit) => draft.value.findIndex((x) => x.deck === u.deck && x.first === u.first) + 1

const suggestedTitle = (u: DraftUnit) => {
  if (u.deck.starts.length === 1) return u.deck.material.title
  const first = u.slides.find((p) => !p.hidden) ?? u.slides[0]
  return first?.title || `Slides ${u.first}–${u.last}`
}
const titleOf = (u: DraftUnit) => u.deck.titles[u.first] ?? suggestedTitle(u)
const setTitle = (u: DraftUnit, v: string) => (u.deck.titles[u.first] = v)
const rangeLabel = (u: DraftUnit) => (u.first === u.last ? `Slide ${u.first}` : `Slides ${u.first}–${u.last}`)

const split = (d: Deck, at: number) => (d.starts = [...d.starts, at].sort((a, b) => a - b))
const join = (d: Deck, start: number) => {
  d.starts = d.starts.filter((s) => s !== start)
  delete d.titles[start]
}
const useSections = (d: Deck) => {
  const fresh = initDeck(d.material, d.pages, false)
  d.starts = fresh.starts
  d.titles = fresh.titles
}

// AI suggestion (F3.5): only cuts and titles; the teacher adjusts them
const suggesting = ref<number | null>(null)
const suggest = async (d: Deck) => {
  suggesting.value = d.material.id
  try {
    const res = await b.api.suggestUnits(d.material.id)
    d.starts = res.data.map((c) => c.first_slide)
    d.titles = Object.fromEntries(res.data.map((c) => [c.first_slide, c.title]))
    b.flash('ok', 'Suggested. Move the cuts or rename units, then save.')
  } catch (e) {
    b.flash('error', apiError(e, 'Could not suggest units.'))
  } finally {
    suggesting.value = null
  }
}

// ── save ──────────────────────────────────────────────────────────────────
const save = async () => {
  saving.value = true
  // Keep existing unit ids in order so learners' progress stays.
  const ids = units.value.map((u) => u.id)
  const body = draft.value.map((u, i) => ({
    id: ids[i], title: titleOf(u).trim(), material_id: u.deck.material.id, first_page: u.first, last_page: u.last,
  }))
  try {
    await b.api.saveSlideUnits(courseId, body)
    await navigateTo(`/learn/${courseId}/review`)
  } catch (e) {
    b.flash('error', apiError(e, 'Could not save the units.'))
  } finally {
    saving.value = false
  }
}
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <StepShell
      :course-id="courseId" step="units" mode="slides"
      title="Cut your slides into units"
      subtitle="Learners finish one unit before the next opens."
      :loading="loading || decksLoading" :load-error="loadError || decksError" :notice="notice" @dismiss-notice="notice = null"
      :back-to="`/learn/${courseId}/upload`"
      next-label="Save units" :next-busy="saving" :next-disabled="!draft.length || saving"
      :next-hint="!decks.length ? 'Upload a PowerPoint file first.' : ''"
      @next="save">
      <div v-if="!decks.length" class="ff-group p-8 text-center">
        <p class="text-[17px] font-semibold">No slides yet</p>
        <p class="mt-1 text-[15px] text-muted-foreground">Upload a PowerPoint file to cut it into units.</p>
        <NuxtLink :to="`/learn/${courseId}/upload`"><Button size="lg" variant="tinted" class="mt-5">Upload slides</Button></NuxtLink>
      </div>

      <div v-else class="space-y-10">
        <section v-for="d in decks" :key="d.material.id" class="space-y-3">
          <!-- The deck -->
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
            <div class="min-w-0 flex-1 basis-48">
              <h2 class="truncate text-[17px] font-semibold" :title="d.material.title">{{ d.material.title }}</h2>
              <p class="text-[13px] text-muted-foreground">{{ plural(d.pages.length, 'slide') }} · {{ plural(d.starts.length, 'unit') }}</p>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <button v-if="hasSections(d)" type="button" class="ff-pill-sm" @click="useSections(d)">Use sections</button>
              <button type="button" class="ff-pill-sm inline-flex items-center gap-1" :disabled="suggesting !== null" @click="suggest(d)">
                <Loader2 v-if="suggesting === d.material.id" class="h-3.5 w-3.5 animate-spin" /><Sparkles v-else class="h-3.5 w-3.5" />Suggest with AI
              </button>
              <NuxtLink :to="`/learn/${courseId}/slides/${d.material.id}`" class="ff-icon-btn" :aria-label="`Preview ${d.material.title}`" title="Preview slides"><Eye class="h-[18px] w-[18px]" /></NuxtLink>
            </div>
          </div>

          <!-- One card per unit -->
          <div v-for="u in unitsOf(d)" :key="u.first" class="ff-group">
            <div class="flex items-center gap-3 px-4 py-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-[15px] font-semibold tabular-nums text-primary">{{ unitNumber(u) }}</span>
              <div class="min-w-0 flex-1">
                <input :value="titleOf(u)" maxlength="255" :aria-label="`Title of unit ${unitNumber(u)}`"
                  class="w-full rounded-lg bg-transparent px-1.5 py-0.5 -mx-1.5 text-[15px] font-semibold outline-none transition-colors hover:bg-foreground/[0.04] focus:bg-foreground/[0.05] focus:ring-4 focus:ring-primary/15"
                  @input="setTitle(u, ($event.target as HTMLInputElement).value)">
                <p class="text-[13px] text-muted-foreground">{{ rangeLabel(u) }}</p>
              </div>
              <button v-if="u.first !== 1" type="button" class="ff-icon-btn" :aria-label="`Join unit ${unitNumber(u)} with the unit before`" title="Join with the unit before" @click="join(d, u.first)"><Merge class="h-[18px] w-[18px]" /></button>
            </div>
            <ol class="border-t border-border/60" style="--ff-inset: 3.25rem">
              <li v-for="(p, i) in u.slides" :key="p.number" class="ff-item flex items-center gap-3 py-2.5 pl-4 pr-2" :class="{ 'opacity-55': p.hidden }">
                <span class="w-6 shrink-0 text-right text-[13px] font-semibold tabular-nums text-muted-foreground">{{ p.number }}</span>
                <span class="min-w-0 flex-1 truncate text-[15px]" :class="{ 'italic text-muted-foreground': !p.title }" :title="p.title">{{ p.title || 'No title' }}</span>
                <EyeOff v-if="p.hidden" class="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Hidden slide" />
                <Shapes v-if="p.has_diagram" class="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Has a diagram" />
                <button v-if="i > 0" type="button" class="ff-icon-btn" :aria-label="`Start a new unit at slide ${p.number}`" title="Start a new unit here" @click="split(d, p.number)"><Scissors class="h-[18px] w-[18px]" /></button>
                <span v-else class="w-9 shrink-0" aria-hidden="true" />
              </li>
            </ol>
          </div>
        </section>
        <p class="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[13px] text-muted-foreground">
          <span class="inline-flex items-center gap-1.5"><Scissors class="h-3.5 w-3.5" />new unit from this slide</span>
          <span class="inline-flex items-center gap-1.5"><Merge class="h-3.5 w-3.5" />join with the unit before</span>
          <span class="inline-flex items-center gap-1.5"><EyeOff class="h-3.5 w-3.5" />hidden, learners skip it</span>
          <span class="inline-flex items-center gap-1.5"><Shapes class="h-3.5 w-3.5" />diagram, opens the original</span>
        </p>
      </div>
    </StepShell>
  </NuxtLayout>
</template>
