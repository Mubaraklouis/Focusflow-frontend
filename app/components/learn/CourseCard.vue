<script setup lang="ts">
import { computed } from 'vue'
import type { LearnCourse } from '~/composables/learn/useLearn'

// The course card used on Discover and My learning: cover, category, title,
// description, then a footer with progress (or a short meta line) and one
// action. The whole card is the link, so the action is styled, not a button.
const props = defineProps<{
  course: LearnCourse
  to: string
  /** card image when the course has no uploaded thumbnail */
  cover?: string
  /** 0–100 when the viewer is taking the course */
  progress?: number | null
  /** shown instead of progress, e.g. "11 units · Free" */
  meta?: string
  action: string
}>()

const image = computed(() => props.course.course_thumb || props.cover || '')
// No image: a soft colour picked from the course id, with its first letter
const hue = computed(() => (props.course.course_id * 47) % 360)
const letter = computed(() => props.course.course_title.trim().charAt(0).toUpperCase() || '·')
const R = 16, C = 2 * Math.PI * R
</script>

<template>
  <NuxtLink :to="to"
    class="ff-group group flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
    <div class="p-2.5 pb-0">
      <div class="relative aspect-video overflow-hidden rounded-xl"
        :style="image ? undefined : { background: `linear-gradient(135deg, hsl(${hue} 75% 60% / 0.22), hsl(${(hue + 40) % 360} 75% 60% / 0.12))` }">
        <img v-if="image" :src="image" :alt="''" loading="lazy" class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]">
        <span v-else class="absolute inset-0 flex items-center justify-center text-5xl font-bold" :style="{ color: `hsl(${hue} 55% 50%)` }" aria-hidden="true">{{ letter }}</span>
      </div>
    </div>

    <div class="flex flex-1 flex-col px-4 pb-4 pt-3.5">
      <span v-if="course.category?.category_name" class="mb-1 text-[12px] font-medium text-primary">{{ course.category.category_name }}</span>
      <h3 class="line-clamp-2 text-[17px] font-semibold leading-snug text-foreground">{{ course.course_title }}</h3>
      <p v-if="course.course_description" class="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{{ course.course_description }}</p>
      <slot />

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3.5" :class="course.course_description ? 'mt-4' : 'mt-3'">
        <span v-if="progress != null" class="flex items-center gap-2 text-[13px] text-muted-foreground">
          <!-- Progress ring, as on the old cards -->
          <svg class="h-9 w-9 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" :r="R" fill="none" stroke-width="4" class="stroke-foreground/[0.08]" />
            <circle cx="20" cy="20" :r="R" fill="none" stroke-width="4" stroke-linecap="round" class="stroke-primary transition-all"
              :stroke-dasharray="C" :stroke-dashoffset="C - (C * progress) / 100" />
          </svg>
          <span><span class="font-semibold tabular-nums text-foreground">{{ progress }}%</span> done</span>
        </span>
        <span v-else class="text-[13px] text-muted-foreground">{{ meta }}</span>
        <span class="shrink-0 rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">{{ action }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
