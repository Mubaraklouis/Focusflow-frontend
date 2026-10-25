<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-vue-next'
import { BUILD_STEPS, type BuildStep } from '~/composables/learn/useCourseBuilder'

// The frame of every course-building step: step indicator at the top, one
// column of content, and Back / Skip / Next in the same place on every step
// (a sticky bar on phones). See .claude/skills/ui-design-principles.
const props = defineProps<{
  courseId: number
  step: BuildStep
  title: string
  subtitle?: string
  loading?: boolean
  loadError?: string
  notice?: { kind: 'error' | 'ok'; text: string } | null
  backTo?: string
  backLabel?: string
  skipTo?: string
  skipLabel?: string
  nextTo?: string
  nextLabel?: string
  nextDisabled?: boolean
  nextBusy?: boolean
  /** Why Next is disabled, shown under the bar */
  nextHint?: string
}>()
const emit = defineEmits<{ next: []; 'dismiss-notice': [] }>()

const current = computed(() => BUILD_STEPS.findIndex((s) => s.key === props.step))
const stepTo = (key: string) => `/learn/${props.courseId}/${key}`
const onNext = () => {
  if (props.nextTo) navigateTo(props.nextTo)
  else emit('next')
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 pt-8 pb-32 sm:pt-12 sm:pb-12">
    <!-- 1 · 2 · 3 -->
    <nav aria-label="Course building steps" class="mb-10">
      <ol class="flex items-center justify-center gap-2 text-sm">
        <li v-for="(s, i) in BUILD_STEPS" :key="s.key" class="flex items-center gap-2">
          <NuxtLink v-if="i < current" :to="stepTo(s.key)" class="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{{ i + 1 }}</span>
            <span class="hidden sm:inline">{{ s.label }}</span>
          </NuxtLink>
          <span v-else class="flex items-center gap-2" :class="i === current ? 'text-foreground font-medium' : 'text-muted-foreground'" :aria-current="i === current ? 'step' : undefined">
            <span class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
              :class="i === current ? 'bg-primary text-primary-foreground' : 'border border-border'">{{ i + 1 }}</span>
            <span :class="i === current ? '' : 'hidden sm:inline'">{{ s.label }}</span>
          </span>
          <span v-if="i < BUILD_STEPS.length - 1" class="text-muted-foreground/60" aria-hidden="true">·</span>
        </li>
      </ol>
    </nav>

    <header class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
      <p v-if="subtitle" class="mt-2 text-sm text-muted-foreground">{{ subtitle }}</p>
    </header>

    <div v-if="notice" role="status" class="mb-6 flex items-start gap-2 rounded-lg p-3 text-sm"
      :class="notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'">
      <AlertCircle v-if="notice.kind === 'error'" class="mt-0.5 h-4 w-4 shrink-0" /><CheckCircle2 v-else class="mt-0.5 h-4 w-4 shrink-0" />
      <span class="flex-1">{{ notice.text }}</span>
      <button type="button" class="opacity-60 hover:opacity-100" aria-label="Dismiss" @click="emit('dismiss-notice')"><X class="h-4 w-4" /></button>
    </div>

    <div v-if="loading" class="space-y-3" aria-busy="true">
      <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-lg bg-muted" />
    </div>
    <div v-else-if="loadError" class="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
      {{ loadError }} <NuxtLink to="/learn" class="ml-2 underline">Back to my courses</NuxtLink>
    </div>
    <slot v-else />

    <!-- Back · Skip · Next: same place on every step -->
    <div v-if="!loading && !loadError"
      class="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur sm:static sm:mt-12 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
      <div class="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 sm:px-0 sm:py-0">
        <NuxtLink v-if="backTo" :to="backTo"><Button variant="ghost" type="button">{{ backLabel || 'Back' }}</Button></NuxtLink>
        <div class="ml-auto flex items-center gap-2">
          <NuxtLink v-if="skipTo" :to="skipTo"><Button variant="ghost" type="button" class="text-muted-foreground">{{ skipLabel || 'Skip' }}</Button></NuxtLink>
          <slot name="next">
            <Button type="button" :disabled="nextDisabled || nextBusy" @click="onNext">
              <Loader2 v-if="nextBusy" class="mr-2 h-4 w-4 animate-spin" />{{ nextLabel || 'Next' }}
            </Button>
          </slot>
        </div>
      </div>
      <p v-if="nextHint" class="mx-auto max-w-2xl px-4 pb-3 text-right text-xs text-muted-foreground sm:px-0 sm:pb-0 sm:pt-2">{{ nextHint }}</p>
    </div>
  </div>
</template>
