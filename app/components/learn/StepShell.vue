<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Check, X, Loader2 } from 'lucide-vue-next'
import { buildSteps, type BuildStep } from '~/composables/learn/useCourseBuilder'

// The frame of every course-building step: step indicator at the top, one
// column of content, and Back / Skip / Next in the same place on every step
// (a sticky bar on phones). See .claude/skills/ui-design-principles.
const props = defineProps<{
  courseId: number
  step: BuildStep
  /** the course's build mode: slides courses have a Units step instead of Organise */
  mode?: string
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

const steps = computed(() => buildSteps(props.mode))
const current = computed(() => steps.value.findIndex((s) => s.key === props.step))
const stepTo = (key: string) => `/learn/${props.courseId}/${key}`
const onNext = () => {
  if (props.nextTo) navigateTo(props.nextTo)
  else emit('next')
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 pt-6 pb-32 sm:pt-10 sm:pb-12">
    <!-- 1 · 2 · 3 as a segmented control -->
    <nav aria-label="Course building steps" class="mb-8 flex justify-center">
      <ol class="inline-flex rounded-full bg-foreground/[0.05] p-1 text-[13px] font-medium">
        <li v-for="(s, i) in steps" :key="s.key">
          <NuxtLink v-if="i < current" :to="stepTo(s.key)"
            class="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <Check class="h-3.5 w-3.5 text-primary" /><span class="hidden sm:inline">{{ s.label }}</span>
          </NuxtLink>
          <span v-else-if="i > current" class="flex items-center gap-1.5 px-3.5 py-1.5 text-muted-foreground/70">
            <span class="tabular-nums">{{ i + 1 }}</span><span class="hidden sm:inline">{{ s.label }}</span>
          </span>
          <span v-else aria-current="step" class="flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-foreground shadow-sm">
            <span class="tabular-nums text-primary">{{ i + 1 }}</span>{{ s.label }}
          </span>
        </li>
      </ol>
    </nav>

    <header class="mb-7">
      <h1 class="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px]">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-[15px] text-muted-foreground">{{ subtitle }}</p>
    </header>

    <div v-if="notice" role="status" class="mb-6 flex items-start gap-2 rounded-2xl p-3.5 text-[15px]"
      :class="notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'">
      <AlertCircle v-if="notice.kind === 'error'" class="mt-0.5 h-[18px] w-[18px] shrink-0" /><CheckCircle2 v-else class="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <span class="flex-1">{{ notice.text }}</span>
      <button type="button" class="opacity-60 hover:opacity-100" aria-label="Dismiss" @click="emit('dismiss-notice')"><X class="h-[18px] w-[18px]" /></button>
    </div>

    <div v-if="loading" class="ff-group" aria-busy="true">
      <div v-for="i in 3" :key="i" class="ff-item flex items-center gap-3 px-4 py-3.5">
        <div class="h-9 w-9 animate-pulse rounded-[10px] bg-muted" /><div class="h-4 flex-1 animate-pulse rounded bg-muted" />
      </div>
    </div>
    <div v-else-if="loadError" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">
      {{ loadError }} <NuxtLink to="/learn" class="ml-2 underline">Back to my courses</NuxtLink>
    </div>
    <slot v-else />

    <!-- Back · Skip · Next: same place on every step; frosted bar on phones -->
    <div v-if="!loading && !loadError"
      class="fixed inset-x-0 bottom-0 z-10 border-t border-border/60 bg-background/75 backdrop-blur-xl sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
      <div class="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 sm:px-0 sm:py-0">
        <NuxtLink v-if="backTo" :to="backTo"><Button size="lg" variant="gray" type="button">{{ backLabel || 'Back' }}</Button></NuxtLink>
        <div class="ml-auto flex items-center gap-2">
          <NuxtLink v-if="skipTo" :to="skipTo"><Button size="lg" variant="gray" type="button">{{ skipLabel || 'Skip' }}</Button></NuxtLink>
          <slot name="next">
            <Button size="lg" type="button" :disabled="nextDisabled || nextBusy" @click="onNext">
              <Loader2 v-if="nextBusy" class="mr-2 h-4 w-4 animate-spin" />{{ nextLabel || 'Next' }}
            </Button>
          </slot>
        </div>
      </div>
      <p v-if="nextHint" class="mx-auto max-w-2xl px-4 pb-3 text-right text-[13px] text-muted-foreground sm:px-0 sm:pb-0 sm:pt-2">{{ nextHint }}</p>
    </div>
  </div>
</template>
