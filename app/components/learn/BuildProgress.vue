<script setup lang="ts">
import { Loader2, CheckCircle2, Clock } from 'lucide-vue-next'
import type { BuildProgress } from '~/composables/learn/useLearn'

// "Generating your course… 62%": the AI builds the course in the background.
defineProps<{ progress?: BuildProgress | null; compact?: boolean }>()
</script>

<template>
  <template v-if="progress">
    <!-- Compact: on course cards -->
    <div v-if="compact && (progress.active || progress.later)" class="mt-3">
      <div class="flex items-center justify-between text-xs">
        <span class="flex items-center gap-1 text-primary font-medium">
          <Loader2 v-if="progress.active" class="h-3 w-3 animate-spin" /><Clock v-else class="h-3 w-3" />
          {{ progress.active ? 'Generating your course' : 'More content later' }}
        </span>
        <span v-if="progress.active" class="text-muted-foreground">{{ progress.percent }}%</span>
      </div>
      <div v-if="progress.active" class="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div class="h-full bg-primary transition-all duration-700" :style="{ width: progress.percent + '%' }" />
      </div>
    </div>

    <!-- Full: on the course builder -->
    <div v-else-if="!compact && progress.active" class="rounded-lg border border-primary/30 bg-primary/5 p-5" aria-live="polite">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold flex items-center gap-2"><Loader2 class="h-5 w-5 animate-spin text-primary" />Generating your course…</h2>
        <span class="text-2xl font-bold text-primary tabular-nums">{{ progress.percent }}%</span>
      </div>
      <div class="mt-3 h-2.5 rounded-full bg-muted overflow-hidden" role="progressbar" :aria-valuenow="progress.percent" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full bg-primary transition-all duration-700" :style="{ width: progress.percent + '%' }" />
      </div>
      <p class="mt-2 text-sm text-foreground">{{ progress.label }}</p>
      <p class="mt-1 text-xs text-muted-foreground">You can leave this page: the AI keeps working, and your units appear here when they are ready.</p>
    </div>
    <div v-else-if="!compact && progress.stage === 'ready' && (progress.later || progress.more)" class="rounded-lg border border-border bg-card p-4 flex items-start gap-3 text-sm">
      <CheckCircle2 class="h-5 w-5 text-green-600 shrink-0" />
      <p>{{ progress.label }}.</p>
    </div>
  </template>
</template>
