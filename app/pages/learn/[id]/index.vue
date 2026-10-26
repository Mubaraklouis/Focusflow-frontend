<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLearn, apiError, type CreatorView, type LearnerView, type Unit } from '~/composables/learn/useLearn'

definePageMeta({ layout: false, middleware: ['auth'] })

const route = useRoute()
const courseId = Number(route.params.id)
const api = useLearn()

const view = ref<LearnerView | CreatorView | null>(null)
const loading = ref(true)
const error = ref('')
const joining = ref(false)

const course = computed(() => view.value?.course)
const learner = computed(() => (view.value?.role === 'learner' ? (view.value as LearnerView) : null))
const units = computed(() => view.value?.units ?? [])
const pct = computed(() => (learner.value?.total_units ? Math.round((learner.value.completed_units / learner.value.total_units) * 100) : 0))
const finished = computed(() => !!learner.value && learner.value.total_units > 0 && learner.value.completed_units >= learner.value.total_units)
const nextUnit = computed(() => units.value.find((u) => !u.locked && !u.completed))

// Units, a page at a time; opens on the page with the learner's next unit
const PER_PAGE = 8
const page = ref(0)
const pages = computed(() => Math.max(1, Math.ceil(units.value.length / PER_PAGE)))
const shown = computed(() => units.value.slice(page.value * PER_PAGE, (page.value + 1) * PER_PAGE))
watch(view, () => {
  const at = nextUnit.value ? units.value.indexOf(nextUnit.value) : 0
  page.value = Math.floor(Math.max(0, at) / PER_PAGE)
})
const NuxtLink = resolveComponent('NuxtLink')
const conceptsIn = (u: Unit) => u.concept_names?.length ?? u.concepts?.length ?? 0
const slidesIn = (u: Unit) => (u.slides ?? []).reduce((n, r) => n + (r.count ?? r.last_page - r.first_page + 1), 0)
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

useHead(() => ({ title: `${course.value?.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'Home', href: '/' },
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course_title || 'Course', href: `/learn/${courseId}`, current: true },
])

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    view.value = await api.course(courseId)
  } catch (e) {
    error.value = apiError(e, 'This course is not available.')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const join = async () => {
  joining.value = true
  try {
    await api.join(courseId)
    await load()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <!-- One job: see the units and start learning -->
    <div class="mx-auto max-w-2xl px-4 pt-8 pb-16 sm:pt-12">
      <div v-if="loading" class="space-y-4" aria-busy="true">
        <div class="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div class="h-4 w-full animate-pulse rounded bg-muted" />
        <div class="ff-group mt-8 h-24 animate-pulse" />
        <div class="ff-group h-64 animate-pulse" />
      </div>
      <div v-else-if="error" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
        {{ error }} <NuxtLink to="/courses" class="ml-2 underline">Discover courses</NuxtLink>
      </div>

      <template v-else-if="view && course">
        <header>
          <p v-if="course.category?.category_name" class="text-[13px] font-medium text-primary">{{ course.category.category_name }}</p>
          <h1 class="mt-1 text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">{{ course.course_title }}</h1>
          <p v-if="course.course_description" class="mt-2 line-clamp-3 whitespace-pre-line text-[15px] text-muted-foreground">{{ course.course_description }}</p>
        </header>

        <!-- The one action -->
        <section class="ff-group mt-7 p-4">
          <div v-if="view.role === 'creator'" class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[15px] font-medium">Your course</p>
              <p class="text-[13px] text-muted-foreground">{{ plural(units.length, 'unit') }} · {{ course.course_status === 'published' ? 'Live' : 'Draft' }}</p>
            </div>
            <NuxtLink :to="`/learn/${courseId}/build`"><Button size="lg">Edit course</Button></NuxtLink>
          </div>
          <div v-else-if="!learner?.enrolled" class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[15px] font-medium">{{ plural(units.length, 'unit') }} · Free</p>
              <p class="text-[13px] text-muted-foreground">Units open one at a time.</p>
            </div>
            <Button size="lg" :disabled="joining" @click="join">{{ joining ? 'Joining…' : 'Join course' }}</Button>
          </div>
          <div v-else class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[15px] font-medium">{{ finished ? 'Course finished' : `${learner.completed_units} of ${learner.total_units} units done` }}</p>
                <p v-if="nextUnit" class="line-clamp-1 text-[13px] text-muted-foreground">Next: {{ nextUnit.title }}</p>
              </div>
              <NuxtLink v-if="nextUnit" :to="`/learn/${courseId}/unit/${nextUnit.id}`">
                <Button size="lg">{{ learner.completed_units ? 'Continue' : 'Start' }}</Button>
              </NuxtLink>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: pct + '%' }" />
            </div>
          </div>
        </section>

        <!-- Units -->
        <section class="mt-8">
          <div class="mb-2 flex items-baseline justify-between px-1">
            <h2 class="text-[17px] font-semibold">Units</h2>
            <span v-if="pages > 1" class="text-[13px] tabular-nums text-muted-foreground">{{ page * PER_PAGE + 1 }}–{{ Math.min((page + 1) * PER_PAGE, units.length) }} of {{ units.length }}</span>
          </div>
          <div v-if="!units.length" class="ff-group p-8 text-center text-[15px] text-muted-foreground">No units yet.</div>
          <ol v-else class="ff-group">
            <li v-for="u in shown" :key="u.id" class="ff-item">
              <component :is="view.role === 'creator' || !u.locked ? NuxtLink : 'div'"
                :to="view.role === 'creator' || !u.locked ? `/learn/${courseId}/unit/${u.id}` : undefined"
                class="flex items-center gap-3 px-4 py-3"
                :class="view.role === 'creator' || !u.locked ? 'transition-colors hover:bg-foreground/[0.03]' : 'opacity-50'">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-semibold tabular-nums"
                  :class="u.completed ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-primary/10 text-primary'">{{ units.indexOf(u) + 1 }}</span>
                <span class="min-w-0 flex-1">
                  <span class="line-clamp-2 break-words text-[15px] font-medium">{{ u.title }}</span>
                  <span v-if="slidesIn(u)" class="text-[13px] text-muted-foreground">{{ plural(slidesIn(u), 'slide') }}</span>
                  <span v-else-if="conceptsIn(u)" class="text-[13px] text-muted-foreground">{{ plural(conceptsIn(u), 'concept') }}</span>
                </span>
                <span v-if="u.completed" class="shrink-0 text-[13px] font-medium text-green-700 dark:text-green-400">Done</span>
                <span v-else-if="u.locked && view.role !== 'creator'" class="shrink-0 text-[13px] text-muted-foreground">Locked</span>
              </component>
            </li>
          </ol>
          <p v-if="view.role === 'learner' && view.more_coming" class="mt-2 px-1 text-[13px] text-muted-foreground">More units coming.</p>

          <!-- Pages -->
          <nav v-if="pages > 1" class="mt-4 flex items-center justify-between" aria-label="Unit pages">
            <Button size="lg" variant="gray" :disabled="page === 0" @click="page--">Previous</Button>
            <span class="text-[13px] tabular-nums text-muted-foreground">Page {{ page + 1 }} of {{ pages }}</span>
            <Button size="lg" variant="gray" :disabled="page >= pages - 1" @click="page++">Next</Button>
          </nav>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
