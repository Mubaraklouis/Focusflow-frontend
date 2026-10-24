<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, PlayCircle, PencilRuler, Trophy, Layers } from 'lucide-vue-next'
import { useLearn, apiError, type CreatorView, type LearnerView } from '~/composables/learn/useLearn'

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
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div v-if="loading" class="space-y-4 animate-pulse">
        <div class="h-10 w-2/3 rounded bg-muted/60" /><div class="h-24 rounded-lg bg-muted/60" /><div class="h-64 rounded-lg bg-muted/60" />
      </div>
      <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-lg">
        {{ error }} <NuxtLink to="/learn/browse" class="underline ml-2">Browse courses</NuxtLink>
      </div>

      <template v-else-if="view && course">
        <span v-if="course.category?.category_name" class="text-sm text-primary font-medium">{{ course.category.category_name }}</span>
        <h1 class="text-3xl font-bold text-foreground mt-1">{{ course.course_title }}</h1>
        <p v-if="course.course_description" class="mt-3 text-muted-foreground whitespace-pre-line">{{ course.course_description }}</p>

        <!-- Creator looking at their own course -->
        <div v-if="view.role === 'creator'" class="mt-6 rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-3">
          <span class="text-sm text-muted-foreground">This is your course.</span>
          <NuxtLink :to="`/learn/${courseId}/build`"><Button variant="outline"><PencilRuler class="h-4 w-4 mr-2" />Edit course</Button></NuxtLink>
        </div>

        <!-- Learner progress / join -->
        <div v-else class="mt-6 rounded-lg border border-border bg-card p-5">
          <template v-if="!learner?.enrolled">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-medium flex items-center gap-2"><Layers class="h-4 w-4" />{{ units.length }} units · Free</p>
                <p class="text-sm text-muted-foreground mt-1">Join to start. Each unit opens when you finish the one before it.</p>
              </div>
              <Button :disabled="joining" @click="join">{{ joining ? 'Joining…' : 'Join course' }}</Button>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-3 mb-2">
              <p class="font-medium">{{ learner.completed_units }} of {{ learner.total_units }} units finished</p>
              <NuxtLink v-if="nextUnit" :to="`/learn/${courseId}/unit/${nextUnit.id}`">
                <Button><PlayCircle class="h-4 w-4 mr-2" />{{ learner.completed_units ? 'Continue' : 'Start' }}</Button>
              </NuxtLink>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary transition-all" :style="{ width: pct + '%' }" /></div>
            <p v-if="finished" class="mt-3 flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
              <Trophy class="h-5 w-5" /> You finished this course!
            </p>
          </template>
        </div>

        <!-- Outline -->
        <h2 class="text-lg font-semibold mt-8 mb-3">Course outline</h2>
        <ol class="space-y-2">
          <li v-for="(u, i) in units" :key="u.id">
            <NuxtLink v-if="view.role === 'creator' || !u.locked" :to="`/learn/${courseId}/unit/${u.id}`"
              class="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
              <CheckCircle2 v-if="u.completed" class="h-5 w-5 text-green-600 shrink-0" />
              <span v-else class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">{{ i + 1 }}</span>
              <span class="font-medium">{{ u.title }}</span>
            </NuxtLink>
            <div v-else class="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground">
              <Lock class="h-5 w-5 shrink-0" />
              <span>{{ u.title }}</span>
              <span class="ml-auto text-xs">{{ learner?.enrolled ? 'Finish the previous unit' : 'Join to unlock' }}</span>
            </div>
          </li>
        </ol>
      </template>
    </div>
  </NuxtLayout>
</template>
