<script setup lang="ts">
import type { LessonQuestion } from '~/interfaces/lesson-quiz';

/**
 * @module components/course-material/quiz/QuizMcqStep
 * Renders one MCQ step. Dumb: the parent owns the selected value.
 */

const props = defineProps<{
  question: LessonQuestion;
  positionLabel: string;   // e.g. "Question 1 of 3"
  selected: string;        // the currently-selected option text
}>();

const emit = defineEmits<{
  (e: 'update:selected', value: string): void;
}>();

const select = (option: string) => emit('update:selected', option);

const letterFor = (idx: number) => String.fromCharCode(65 + idx); // 0 → 'A'
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wider text-primary">
        Multiple choice · {{ positionLabel }}
      </p>
      <h3 class="text-base font-semibold leading-snug text-card-foreground sm:text-lg">
        {{ question.prompt }}
      </h3>
    </header>

    <ul class="space-y-2">
      <li v-for="(option, idx) in question.options ?? []" :key="idx">
        <button
          type="button"
          class="group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all"
          :class="
            selected === option
              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
              : 'border-border/60 hover:border-border hover:bg-muted/40'
          "
          @click="select(option)"
        >
          <span
            class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors"
            :class="
              selected === option
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground group-hover:bg-muted/70'
            "
          >
            {{ letterFor(idx) }}
          </span>
          <span
            class="text-sm leading-relaxed"
            :class="
              selected === option
                ? 'font-medium text-card-foreground'
                : 'text-card-foreground/90'
            "
          >
            {{ option }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
