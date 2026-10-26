<script setup lang="ts">
import type { ConceptSource } from '~/composables/learn/useLearn'

defineProps<{ sources: ConceptSource[]; label?: string }>()

const verb = { pdf: 'Read', slides: 'See', video: 'Watch', link: 'Open' } as const
</script>

<template>
  <!-- Text-only pills: the verb says what kind of source it is -->
  <div v-if="sources.length" class="flex flex-wrap items-center gap-2">
    <span v-if="label" class="text-[13px] font-medium text-muted-foreground">{{ label }}</span>
    <a v-for="(s, i) in sources" :key="i" :href="s.url" target="_blank" rel="noopener noreferrer"
      class="inline-flex rounded-full bg-foreground/[0.05] px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-primary/10 hover:text-primary">
      <span>{{ verb[s.kind] }} <span class="font-medium">{{ s.title }}</span><template v-if="s.hint">, {{ s.hint }}</template></span>
    </a>
  </div>
</template>
