<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { FileText, Presentation, Link2, ExternalLink, CheckCircle2, ArrowLeft, ArrowRight, Trophy, Lock, Telescope } from 'lucide-vue-next'
import { useLearn, apiError, kindLabel, type Unit, type CreatorView, type LearnerView } from '~/composables/learn/useLearn'
import { renderMarkdown } from '~/utils/markdown'
import ConceptSources from '~/components/learn/ConceptSources.vue'

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
const index = computed(() => (outline.value?.units ?? []).findIndex((u) => u.id === unitId.value))
const prev = computed(() => (index.value > 0 ? outline.value!.units[index.value - 1] : null))
const next = computed(() => (outline.value && index.value >= 0 ? outline.value.units[index.value + 1] ?? null : null))

useHead(() => ({ title: `${unit.value?.title || 'Unit'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: outline.value?.course.course_title || 'Course', href: `/learn/${courseId}` },
  { title: unit.value?.title || 'Unit', href: route.fullPath, current: true },
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

const videos = computed(() => (unit.value?.materials ?? []).filter((m) => m.kind === 'video' && m.youtube_id))
const docs = computed(() => (unit.value?.materials ?? []).filter((m) => m.kind !== 'video'))
const docIcon = { pdf: FileText, slides: Presentation, link: Link2, video: Link2 } as const
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <NuxtLink :to="`/learn/${courseId}`" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft class="h-4 w-4" /> Course outline
      </NuxtLink>

      <div v-if="loading" class="space-y-4 animate-pulse">
        <div class="h-9 w-2/3 rounded bg-muted/60" /><div class="aspect-video rounded-lg bg-muted/60" /><div class="h-40 rounded-lg bg-muted/60" />
      </div>

      <div v-else-if="locked" class="rounded-lg border border-border bg-card p-8 text-center">
        <Lock class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p class="font-medium">This unit is locked.</p>
        <p class="text-sm text-muted-foreground mt-1">Finish the previous unit to open it.</p>
        <NuxtLink :to="`/learn/${courseId}`"><Button class="mt-4" variant="outline">Back to the outline</Button></NuxtLink>
      </div>

      <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-lg">{{ error }}</div>

      <article v-else-if="unit">
        <p class="text-sm text-primary font-medium">Unit {{ index + 1 }} of {{ outline?.units.length }}</p>
        <h1 class="text-3xl font-bold text-foreground mt-1 mb-6">{{ unit.title }}</h1>

        <div v-for="v in videos" :key="v.id" class="mb-6">
          <div class="aspect-video overflow-hidden rounded-lg border border-border bg-black">
            <iframe class="h-full w-full" :src="`https://www.youtube-nocookie.com/embed/${v.youtube_id}`" :title="v.title"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" />
          </div>
          <p class="text-sm text-muted-foreground mt-2">{{ v.title }}</p>
        </div>

        <div v-if="unit.body" class="md-content" v-html="renderMarkdown(unit.body)" />

        <!-- Concepts: each explained, with where to check it in the sources -->
        <section v-if="unit.concepts?.length" class="mt-8 space-y-5">
          <h2 class="text-lg font-semibold">Key concepts</h2>
          <div v-for="(c, i) in unit.concepts" :key="c.id" :id="`concept-${c.id}`"
            class="rounded-lg border border-border bg-card p-5">
            <h3 class="font-semibold text-foreground flex items-baseline gap-2">
              <span class="text-primary text-sm">{{ i + 1 }}.</span>{{ c.title }}
            </h3>
            <div v-if="c.explanation" class="md-content mt-2 text-[0.95rem]" v-html="renderMarkdown(c.explanation)" />
            <div v-if="c.sources.length" class="mt-4 border-t border-border pt-3">
              <p class="text-xs text-muted-foreground mb-2">Want to understand this better? Check the source:</p>
              <ConceptSources :sources="c.sources" />
            </div>
            <div v-if="c.references?.length" class="mt-4 border-t border-border pt-3">
              <p class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Telescope class="h-3.5 w-3.5" />Expand your knowledge</p>
              <ul class="space-y-1.5">
                <li v-for="r in c.references" :key="r.url">
                  <a :href="r.url" target="_blank" rel="noopener noreferrer nofollow" class="group block rounded-md px-2 py-1.5 -mx-2 hover:bg-accent">
                    <span class="text-sm font-medium text-primary group-hover:underline">{{ r.title }}</span>
                    <span class="text-xs text-muted-foreground"> · {{ r.site }}</span>
                    <span v-if="r.why" class="block text-xs text-muted-foreground">{{ r.why }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section v-if="docs.length" class="mt-8">
          <h2 class="text-lg font-semibold mb-3">All materials for this unit</h2>
          <ul class="space-y-2">
            <li v-for="m in docs" :key="m.id">
              <a :href="m.url" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors">
                <component :is="docIcon[m.kind]" class="h-5 w-5 text-muted-foreground" />
                <span class="flex-1 font-medium">{{ m.title }}</span>
                <span class="text-xs text-muted-foreground">{{ kindLabel[m.kind] }}</span>
                <ExternalLink class="h-4 w-4 text-muted-foreground" />
              </a>
            </li>
          </ul>
        </section>

        <div v-if="courseDone" class="mt-10 rounded-lg border border-green-500/40 bg-green-500/10 p-6 text-center">
          <Trophy class="h-10 w-10 mx-auto text-green-600 mb-2" />
          <p class="text-lg font-semibold">You finished the course!</p>
          <NuxtLink :to="`/learn/${courseId}`"><Button class="mt-4" variant="outline">Back to the course</Button></NuxtLink>
        </div>

        <div v-else class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <NuxtLink v-if="prev" :to="`/learn/${courseId}/unit/${prev.id}`"><Button variant="outline" class="max-w-[16rem]" :title="prev.title"><ArrowLeft class="h-4 w-4 mr-1 shrink-0" /><span class="truncate">{{ prev.title }}</span></Button></NuxtLink>
          <span v-else />
          <template v-if="!isCreator">
            <span v-if="unit.completed" class="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 class="h-4 w-4" /> Finished
              <NuxtLink v-if="next" :to="`/learn/${courseId}/unit/${next.id}`"><Button class="ml-2">Next unit<ArrowRight class="h-4 w-4 ml-1" /></Button></NuxtLink>
            </span>
            <Button v-else :disabled="completing" @click="complete">
              <CheckCircle2 class="h-4 w-4 mr-2" />{{ completing ? 'Saving…' : next ? 'Mark as done and continue' : 'Mark as done' }}
            </Button>
          </template>
          <NuxtLink v-else-if="next" :to="`/learn/${courseId}/unit/${next.id}`"><Button variant="outline">Next unit<ArrowRight class="h-4 w-4 ml-1" /></Button></NuxtLink>
        </div>
      </article>
    </div>
  </NuxtLayout>
</template>
