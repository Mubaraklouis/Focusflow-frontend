<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-vue-next'
import { partlyRead, clock, type Material } from '~/composables/learn/useLearn'

// One line saying where a material is: reading, ready, waiting or failed
// (with the reason), and the action that helps (Retry, Continue, Read now).
const props = defineProps<{ material: Material }>()
const emit = defineEmits<{ retry: [] }>()

const m = computed(() => props.material)
const isVideo = computed(() => m.value.kind === 'video')
const partText = computed(() => {
  if (m.value.total_seconds && m.value.read_seconds && m.value.read_seconds < m.value.total_seconds)
    return `${clock(m.value.read_seconds)} of ${clock(m.value.total_seconds)} watched`
  if (m.value.total_pages && m.value.read_pages && m.value.read_pages < m.value.total_pages)
    return `Pages 1–${m.value.read_pages} of ${m.value.total_pages} read`
  return ''
})
const concepts = computed(() => m.value.digest?.concepts?.length ?? 0)
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
    <template v-if="m.status === 'processing'">
      <Loader2 class="h-3.5 w-3.5 animate-spin text-primary" />
      <span class="text-muted-foreground">{{ isVideo ? 'Watching…' : 'Reading…' }}</span>
    </template>
    <template v-else-if="m.status === 'paused'">
      <Clock class="h-3.5 w-3.5 text-muted-foreground" />
      <span class="text-muted-foreground">Waiting for the AI. This continues automatically.</span>
      <button type="button" class="text-primary hover:underline" @click="emit('retry')">Read now</button>
    </template>
    <template v-else-if="m.status === 'failed'">
      <AlertCircle class="h-3.5 w-3.5 text-destructive" />
      <span class="text-destructive">{{ m.error || 'Could not be read.' }}</span>
      <button v-if="m.kind !== 'link'" type="button" class="text-primary hover:underline" @click="emit('retry')">Retry</button>
    </template>
    <template v-else-if="m.reading">
      <Loader2 class="h-3.5 w-3.5 animate-spin text-primary" />
      <span class="text-muted-foreground">{{ partText || 'Ready' }} · {{ isVideo ? 'watching the rest…' : 'reading the rest…' }}</span>
    </template>
    <template v-else-if="partlyRead(m)">
      <Clock class="h-3.5 w-3.5 text-muted-foreground" />
      <span class="text-muted-foreground">{{ partText }}<template v-if="m.paused">. The rest continues automatically.</template></span>
      <button type="button" class="text-primary hover:underline" @click="emit('retry')">{{ isVideo ? 'Continue watching' : 'Continue reading' }}</button>
    </template>
    <template v-else>
      <CheckCircle2 class="h-3.5 w-3.5 text-green-700 dark:text-green-400" />
      <span class="text-muted-foreground">Ready<template v-if="concepts && m.kind !== 'link'"> · {{ concepts }} concepts found</template></span>
    </template>
  </p>
</template>
