<script setup lang="ts">
import { FileText, Presentation, PlayCircle, Link2, ExternalLink } from 'lucide-vue-next'
import type { ConceptSource } from '~/composables/learn/useLearn'

defineProps<{ sources: ConceptSource[]; label?: string }>()

const icons = { pdf: FileText, slides: Presentation, video: PlayCircle, link: Link2 } as const
const verb = { pdf: 'Read', slides: 'See', video: 'Watch', link: 'Open' } as const
</script>

<template>
  <div v-if="sources.length" class="flex flex-wrap items-center gap-2">
    <span v-if="label" class="text-xs font-medium text-muted-foreground">{{ label }}</span>
    <a v-for="(s, i) in sources" :key="i" :href="s.url" target="_blank" rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary/60 hover:text-primary transition-colors">
      <component :is="icons[s.kind]" class="h-3.5 w-3.5" />
      <span>{{ verb[s.kind] }} <span class="font-medium">{{ s.title }}</span><template v-if="s.hint">, {{ s.hint }}</template></span>
      <ExternalLink class="h-3 w-3 opacity-60" />
    </a>
  </div>
</template>
