<script setup lang="ts">
import { computed } from 'vue';
import { TAKEAWAY_MIN_CHARS, TAKEAWAY_MAX_CHARS } from '~/interfaces/lesson-quiz';

/**
 * @module components/course-material/quiz/QuizReflectionStep
 * Step 7 — the US-001 active-recall reflection. Identical validation
 * rules to the standalone LessonCompletionDialog (30..1000 chars).
 *
 * Accepts optional `dbVideoId` + `lessonTitle` so the footer link to the
 * full Feynman reflection page can be built correctly.
 */

const props = defineProps<{
  body: string;
  /** Internal DB video_id — used to build the Feynman deep-link. */
  dbVideoId?: number | null;
  /** Lesson display title passed to the reflection page via query param. */
  lessonTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'update:body', value: string): void;
}>();

const feynmanHref = computed(() => {
  if (!props.dbVideoId) return null;
  const params = new URLSearchParams();
  if (props.lessonTitle) params.set('title', props.lessonTitle);
  return `/courses/reflection/${props.dbVideoId}?${params.toString()}`;
});

const trimmedLength = computed(() => props.body.trim().length);

const hint = computed(() => {
  if (trimmedLength.value < TAKEAWAY_MIN_CHARS) {
    return `${TAKEAWAY_MIN_CHARS - trimmedLength.value} more characters required`;
  }
  if (trimmedLength.value > TAKEAWAY_MAX_CHARS) {
    return `${trimmedLength.value - TAKEAWAY_MAX_CHARS} over the limit`;
  }
  return `${trimmedLength.value} / ${TAKEAWAY_MAX_CHARS}`;
});

const isInvalid = computed(
  () =>
    props.body.length > 0 &&
    (trimmedLength.value < TAKEAWAY_MIN_CHARS || trimmedLength.value > TAKEAWAY_MAX_CHARS),
);

const onInput = (event: Event) => {
  emit('update:body', (event.target as HTMLTextAreaElement).value);
};
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Active recall reflection
      </p>
      <h3 class="text-base font-semibold leading-snug text-card-foreground sm:text-lg">
        Summarise the key point of this lesson in your own words.
      </h3>
      <p class="text-sm text-muted-foreground">
        One or two sentences retrieved from memory — this is what consolidates the
        learning.
      </p>
    </header>

    <div>
      <label class="sr-only" for="takeaway-body">Your takeaway</label>
      <textarea
        id="takeaway-body"
        :value="body"
        rows="5"
        placeholder="The key idea I want to remember is…"
        class="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
        @input="onInput"
      />
      <div class="mt-1.5 flex items-center justify-between text-xs">
        <span :class="isInvalid ? 'text-destructive' : 'text-muted-foreground'">
          {{ hint }}
        </span>
        <span class="text-muted-foreground">
          min {{ TAKEAWAY_MIN_CHARS }} / max {{ TAKEAWAY_MAX_CHARS }} chars
        </span>
      </div>
    </div>

    <!-- Feynman deep-link footer -->
    <p v-if="feynmanHref" class="text-xs text-muted-foreground">
      Want deeper feedback?
      <a
        :href="feynmanHref"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-primary hover:underline"
      >
        Open the full Feynman reflection page →
      </a>
    </p>
  </div>
</template>
