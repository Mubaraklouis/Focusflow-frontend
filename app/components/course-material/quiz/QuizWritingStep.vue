<script setup lang="ts">
import { computed } from 'vue';
import type { LessonQuestion } from '~/interfaces/lesson-quiz';
import { WRITING_MIN_CHARS, WRITING_MAX_CHARS } from '~/interfaces/lesson-quiz';

/**
 * @module components/course-material/quiz/QuizWritingStep
 * One short-answer writing step. Same dumb pattern as the MCQ step —
 * value is owned by the parent through v-model:body.
 */

const props = defineProps<{
  question: LessonQuestion;
  positionLabel: string;
  body: string;
}>();

const emit = defineEmits<{
  (e: 'update:body', value: string): void;
}>();

const trimmedLength = computed(() => props.body.trim().length);

const hint = computed(() => {
  if (trimmedLength.value < WRITING_MIN_CHARS) {
    return `${WRITING_MIN_CHARS - trimmedLength.value} more characters required`;
  }
  if (trimmedLength.value > WRITING_MAX_CHARS) {
    return `${trimmedLength.value - WRITING_MAX_CHARS} characters over the limit`;
  }
  return `${trimmedLength.value} characters`;
});

const isOverLimit = computed(() => trimmedLength.value > WRITING_MAX_CHARS);
const isUnderLimit = computed(
  () => props.body.length > 0 && trimmedLength.value < WRITING_MIN_CHARS,
);

const onInput = (event: Event) => {
  emit('update:body', (event.target as HTMLTextAreaElement).value);
};
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wider text-primary">
        Short answer · {{ positionLabel }}
      </p>
      <h3 class="text-base font-semibold leading-snug text-card-foreground sm:text-lg">
        {{ question.prompt }}
      </h3>
    </header>

    <div>
      <label class="sr-only" for="writing-answer">Your answer</label>
      <textarea
        id="writing-answer"
        :value="body"
        rows="6"
        placeholder="Answer in your own words. One or two sentences is fine."
        class="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
        @input="onInput"
      />
      <div class="mt-1.5 flex items-center justify-between text-xs">
        <span
          :class="
            isOverLimit || isUnderLimit ? 'text-destructive' : 'text-muted-foreground'
          "
        >
          {{ hint }}
        </span>
        <span class="text-muted-foreground">min {{ WRITING_MIN_CHARS }} chars</span>
      </div>
    </div>
  </div>
</template>
