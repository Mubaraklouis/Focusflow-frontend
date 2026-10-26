<script setup lang="ts">
import type { MaterialKind } from '~/composables/learn/useLearn'
import { kindIcon } from '~/composables/learn/useCourseBuilder'

// A tinted rounded square with the material's icon (like the iOS Settings list).
// Tints live here, not in the composable, so Tailwind sees them.
defineProps<{ kind: MaterialKind }>()
const tint: Record<MaterialKind, string> = {
  pdf: 'bg-red-500/10 text-red-600 dark:text-red-400',
  slides: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  video: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  link: 'bg-green-500/10 text-green-700 dark:text-green-400',
}
</script>

<template>
  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" :class="tint[kind]" aria-hidden="true">
    <component :is="kindIcon[kind]" class="h-[18px] w-[18px]" />
  </span>
</template>
