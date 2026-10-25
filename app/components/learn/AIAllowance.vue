<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import type { AIAllowance } from '~/composables/learn/useLearn'

// How much of the creator's AI allowance is left, like a usage meter.
const props = defineProps<{ allowance?: AIAllowance | null; compact?: boolean }>()

const label = { day: 'Today', month: 'This month' } as const

const refills = (iso: string, period: 'day' | 'month') => {
  const ms = Date.parse(iso) - Date.now()
  if (period === 'month') return 'Refills ' + new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
  const min = Math.max(1, Math.ceil(ms / 60000))
  return 'Refills in ' + (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`)
}
const barColor = (used: number) => (used >= 100 ? 'bg-destructive' : used >= 80 ? 'bg-amber-500' : 'bg-primary')
const windows = computed(() => props.allowance?.windows ?? [])
</script>

<template>
  <div v-if="allowance && !allowance.unlimited && windows.length" class="rounded-lg border border-border bg-card p-4">
    <div class="flex items-center gap-2 mb-3">
      <Sparkles class="h-4 w-4 text-primary" />
      <h3 class="text-sm font-semibold">AI allowance</h3>
      <span v-if="!compact" class="text-xs text-muted-foreground">for reading materials, organising units, references and test questions</span>
    </div>
    <div class="grid gap-3" :class="windows.length > 1 ? 'sm:grid-cols-2' : ''">
      <div v-for="w in windows" :key="w.period">
        <div class="flex items-baseline justify-between text-xs">
          <span class="font-medium text-foreground">{{ label[w.period] }}</span>
          <span :class="w.used_percent >= 100 ? 'text-destructive font-medium' : 'text-muted-foreground'">{{ 100 - w.used_percent }}% left</span>
        </div>
        <div class="mt-1.5 h-2 rounded-full bg-muted overflow-hidden" role="progressbar" :aria-valuenow="w.used_percent" aria-valuemin="0" aria-valuemax="100" :aria-label="`${label[w.period]}: ${w.used_percent}% used`">
          <div class="h-full transition-all" :class="barColor(w.used_percent)" :style="{ width: w.used_percent + '%' }" />
        </div>
        <p class="mt-1 text-xs text-muted-foreground">{{ w.used_percent }}% used · {{ refills(w.resets_at, w.period) }}</p>
      </div>
    </div>
    <p v-if="!allowance.can_use_ai && allowance.message" class="mt-3 text-sm text-destructive">{{ allowance.message }}</p>
  </div>
</template>
