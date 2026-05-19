<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2, XCircle, BookOpenCheck, Trophy } from 'lucide-vue-next';
import type { LessonQuestion, QuizAttempt } from '~/interfaces/lesson-quiz';

/**
 * @module components/course-material/quiz/QuizResultsStep
 * Step 9 — the final summary. Lists each of the 6 graded answers with
 * Gemini's feedback for writing items. Score banner at the top.
 */

const props = defineProps<{
  attempt: QuizAttempt;
  questions: LessonQuestion[];
}>();

const orderedAnswers = computed(() => {
  // Render in question position order (matches the order the learner took).
  const byQId = new Map<number, LessonQuestion>(props.questions.map((q) => [q.id, q]));
  return [...props.attempt.answers]
    .map((a) => ({ a, q: byQId.get(a.question_id) }))
    .filter((pair): pair is { a: typeof pair.a; q: LessonQuestion } => !!pair.q)
    .sort((x, y) => x.q.position - y.q.position);
});

const scoreColor = (score: number) => {
  if (score >= 0.85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 0.5) return 'text-primary';
  return 'text-destructive';
};

const totalBadgeTone = computed(() => {
  const t = props.attempt.total_score;
  if (t >= 85) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (t >= 50) return 'bg-primary/10 text-primary';
  return 'bg-destructive/10 text-destructive';
});
</script>

<template>
  <div class="space-y-5">
    <!-- Banner -->
    <div
      class="flex items-center gap-4 rounded-xl px-4 py-4"
      :class="totalBadgeTone"
    >
      <Trophy class="h-8 w-8 flex-shrink-0" />
      <div class="flex-1">
        <p class="text-xs font-semibold uppercase tracking-wider opacity-80">
          Your score
        </p>
        <p class="text-2xl font-bold leading-tight">{{ Math.round(attempt.total_score) }}%</p>
      </div>
      <div class="text-right text-xs">
        <div>MCQ {{ Math.round(attempt.mcq_score) }}%</div>
        <div>Writing {{ Math.round(attempt.writing_score) }}%</div>
      </div>
    </div>

    <!-- Per-question summary -->
    <div class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Question breakdown
      </p>

      <article
        v-for="(pair, idx) in orderedAnswers"
        :key="pair.a.id"
        class="rounded-lg border border-border/60 p-3"
      >
        <header class="flex items-start gap-2">
          <span class="mt-0.5">
            <CheckCircle2
              v-if="pair.a.is_correct === true || pair.a.score >= 0.85"
              class="h-4 w-4 text-emerald-500"
            />
            <XCircle
              v-else-if="pair.a.is_correct === false || pair.a.score < 0.3"
              class="h-4 w-4 text-destructive"
            />
            <BookOpenCheck
              v-else
              class="h-4 w-4 text-primary"
            />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {{ pair.q.question_type === 'mcq' ? 'Multiple choice' : 'Short answer' }} ·
              Q{{ idx + 1 }}
            </p>
            <p class="mt-0.5 text-sm font-medium leading-snug text-card-foreground">
              {{ pair.q.prompt }}
            </p>
          </div>
          <span class="text-sm font-semibold" :class="scoreColor(pair.a.score)">
            {{ Math.round(pair.a.score * 100) }}%
          </span>
        </header>

        <div class="mt-2 space-y-1.5 pl-6 text-sm">
          <p class="text-muted-foreground">
            <span class="font-medium text-card-foreground/80">Your answer:</span>
            {{ pair.a.answer || '—' }}
          </p>
          <p v-if="pair.a.feedback" class="text-card-foreground/80">
            <span class="font-medium text-primary">Feedback:</span>
            {{ pair.a.feedback }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>
