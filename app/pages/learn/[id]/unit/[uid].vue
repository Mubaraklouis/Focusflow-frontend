<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLearn, apiError, kindLabel, type Unit, type Concept, type CreatorView, type LearnerView } from '~/composables/learn/useLearn'
import { renderMarkdown } from '~/utils/markdown'
import ConceptSources from '~/components/learn/ConceptSources.vue'

// A unit is read one screen at a time: intro (if any) → one concept per
// screen → end of unit (recap, materials, Mark as done). The screen is
// ?step=N so the browser's back button and reloads keep the place.
definePageMeta({ layout: false, middleware: ['auth'] })

const route = useRoute()
const courseId = Number(route.params.id)
const unitId = computed(() => Number(route.params.uid))
const api = useLearn()

const unit = ref<Unit | null>(null)
const outline = ref<LearnerView | CreatorView | null>(null)
const loading = ref(true)
const error = ref('')
const locked = ref(false)
const completing = ref(false)
const courseDone = ref(false)

const isCreator = computed(() => outline.value?.role === 'creator')
const units = computed(() => outline.value?.units ?? [])
const index = computed(() => units.value.findIndex((u) => u.id === unitId.value))
const next = computed(() => (index.value >= 0 ? units.value[index.value + 1] ?? null : null))

const videos = computed(() => (unit.value?.materials ?? []).filter((m) => m.kind === 'video' && m.youtube_id))

type Screen = { kind: 'intro' } | { kind: 'concept'; c: Concept; n: number } | { kind: 'end' }
const screens = computed<Screen[]>(() => {
  if (!unit.value) return []
  const out: Screen[] = []
  if (unit.value.body?.trim() || videos.value.length) out.push({ kind: 'intro' })
  ;(unit.value.concepts ?? []).forEach((c, i) => out.push({ kind: 'concept', c, n: i + 1 }))
  out.push({ kind: 'end' })
  return out
})
const step = computed(() => Math.min(Math.max(0, Number(route.query.step) || 0), Math.max(0, screens.value.length - 1)))
const screen = computed(() => screens.value[step.value])
const conceptCount = computed(() => unit.value?.concepts?.length ?? 0)

const go = async (n: number) => {
  await navigateTo({ query: { ...route.query, step: n || undefined } }, { replace: true })
  document.querySelector('main')?.scrollTo({ top: 0 })
}
const onKey = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement)?.closest('input, textarea, iframe')) return
  if (e.key === 'ArrowRight' && step.value < screens.value.length - 1) go(step.value + 1)
  if (e.key === 'ArrowLeft' && step.value > 0) go(step.value - 1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

useHead(() => ({ title: `${unit.value?.title || 'Unit'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: outline.value?.course.course_title || 'Course', href: `/learn/${courseId}` },
  { title: unit.value?.title || 'Unit', href: route.path, current: true },
])

const load = async () => {
  loading.value = true
  error.value = ''
  locked.value = false
  courseDone.value = false
  try {
    outline.value = await api.course(courseId)
    unit.value = await api.unit(unitId.value)
  } catch (e: any) {
    if (e?.statusCode === 403 || e?.status === 403) locked.value = true
    else error.value = apiError(e, 'This unit is not available.')
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(unitId, load)

const complete = async () => {
  completing.value = true
  try {
    const res = await api.completeUnit(unitId.value)
    if (unit.value) unit.value.completed = true
    if (res.course_completed) courseDone.value = true
    else if (next.value) await navigateTo(`/learn/${courseId}/unit/${next.value.id}`)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    completing.value = false
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <!-- Reading page: wide, calm column (Apple Notes feel) -->
    <div class="mx-auto max-w-3xl px-5 pt-6 pb-32 sm:px-8 sm:pt-10 sm:pb-16">
      <div v-if="loading" class="space-y-4" aria-busy="true">
        <div class="h-1.5 animate-pulse rounded-full bg-muted" />
        <div class="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div class="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div v-else-if="locked" class="ff-group p-8 text-center">
        <p class="text-[17px] font-semibold">This unit is locked</p>
        <p class="mt-1 text-[15px] text-muted-foreground">Finish the unit before it first.</p>
        <NuxtLink :to="`/learn/${courseId}`"><Button size="lg" variant="gray" class="mt-5">Back to course</Button></NuxtLink>
      </div>

      <div v-else-if="error" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ error }} <NuxtLink :to="`/learn/${courseId}`" class="ml-2 underline">Back to course</NuxtLink>
      </div>

      <template v-else-if="unit && screen">
        <!-- Where am I: a thin bar, one segment per screen -->
        <div class="mb-8 flex gap-1" aria-hidden="true">
          <span v-for="(_, i) in screens" :key="i" class="h-1 flex-1 rounded-full transition-colors"
            :class="i <= step ? 'bg-primary' : 'bg-foreground/[0.08]'" />
        </div>

        <!-- Intro -->
        <article v-if="screen.kind === 'intro'">
          <p class="text-[13px] font-medium text-muted-foreground">Unit {{ index + 1 }} of {{ units.length }}</p>
          <h1 class="mt-1 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{{ unit.title }}</h1>
          <div v-for="v in videos" :key="v.id" class="mt-6">
            <div class="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe class="h-full w-full" :src="`https://www.youtube-nocookie.com/embed/${v.youtube_id}`" :title="v.title"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" />
            </div>
            <p class="mt-2 px-1 text-[13px] text-muted-foreground">{{ v.title }}</p>
          </div>
          <div v-if="unit.body" class="ff-prose mt-6" v-html="renderMarkdown(unit.body)" />
        </article>

        <!-- One concept -->
        <article v-else-if="screen.kind === 'concept'">
          <p class="text-[13px] font-medium text-muted-foreground">Unit {{ index + 1 }} · Concept {{ screen.n }} of {{ conceptCount }}</p>
          <h1 class="mt-1 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{{ screen.c.title }}</h1>
          <div v-if="screen.c.explanation" class="ff-prose mt-6" v-html="renderMarkdown(screen.c.explanation)" />

          <section v-if="screen.c.sources.length" class="mt-12 border-t border-border/70 pt-6">
            <h2 class="ff-label">Check the source</h2>
            <ConceptSources :sources="screen.c.sources" />
          </section>
          <section v-if="screen.c.references?.length" class="mt-6">
            <h2 class="ff-label">Further reading</h2>
            <ul class="ff-group">
              <li v-for="r in screen.c.references" :key="r.url" class="ff-item" style="--ff-inset: 1rem">
                <a :href="r.url" target="_blank" rel="noopener noreferrer nofollow" class="block px-4 py-3 transition-colors hover:bg-foreground/[0.03]">
                  <span class="block text-[15px] font-medium text-primary">{{ r.title }}</span>
                  <span class="text-[13px] text-muted-foreground">{{ r.site }}<template v-if="r.why"> · {{ r.why }}</template></span>
                </a>
              </li>
            </ul>
          </section>
        </article>

        <!-- End of unit -->
        <article v-else>
          <p class="text-[13px] font-medium text-muted-foreground">Unit {{ index + 1 }} of {{ units.length }}</p>
          <h1 class="mt-1 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{{ courseDone ? 'You finished the course' : 'End of unit' }}</h1>
          <p class="mt-1 text-[15px] text-muted-foreground">{{ unit.title }}</p>

          <section v-if="conceptCount" class="mt-7">
            <h2 class="ff-label">You covered</h2>
            <ol class="ff-group" style="--ff-inset: 2.75rem">
              <li v-for="(c, i) in unit.concepts" :key="c.id" class="ff-item">
                <button type="button" class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
                  @click="go(screens.findIndex((s) => s.kind === 'concept' && s.c.id === c.id))">
                  <span class="w-4 shrink-0 text-right text-[13px] font-semibold tabular-nums text-muted-foreground">{{ i + 1 }}</span>
                  <span class="text-[15px]">{{ c.title }}</span>
                </button>
              </li>
            </ol>
          </section>

          <section v-if="unit.materials?.length" class="mt-6">
            <h2 class="ff-label">Materials</h2>
            <ul class="ff-group">
              <li v-for="m in unit.materials" :key="m.id" class="ff-item" style="--ff-inset: 1rem">
                <a :href="m.url" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03]">
                  <span class="min-w-0 truncate text-[15px]">{{ m.title }}</span>
                  <span class="shrink-0 text-[13px] text-muted-foreground">{{ kindLabel[m.kind] }}</span>
                </a>
              </li>
            </ul>
          </section>
        </article>

        <!-- Back · Next: same place on every screen; frosted bar on phones -->
        <div class="fixed inset-x-0 bottom-0 z-10 border-t border-border/60 bg-background/75 backdrop-blur-xl sm:static sm:mt-12 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
          <div class="mx-auto flex max-w-3xl items-center gap-2 px-5 py-3 sm:px-0 sm:py-0">
            <Button v-if="step > 0" size="lg" variant="gray" @click="go(step - 1)">Back</Button>
            <NuxtLink v-else :to="`/learn/${courseId}`"><Button size="lg" variant="gray">Course</Button></NuxtLink>
            <div class="ml-auto">
              <Button v-if="screen.kind !== 'end'" size="lg" @click="go(step + 1)">Next</Button>
              <NuxtLink v-else-if="courseDone" :to="`/learn/${courseId}`"><Button size="lg">Back to course</Button></NuxtLink>
              <Button v-else-if="!isCreator && !unit.completed" size="lg" :disabled="completing" @click="complete">
                {{ completing ? 'Saving…' : 'Mark as done' }}
              </Button>
              <NuxtLink v-else-if="next" :to="`/learn/${courseId}/unit/${next.id}`"><Button size="lg">Next unit</Button></NuxtLink>
              <NuxtLink v-else :to="`/learn/${courseId}`"><Button size="lg">Back to course</Button></NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
