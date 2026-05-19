<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useHead, useRoute } from '#imports';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Trophy,
  XCircle,
} from 'lucide-vue-next';
import { useQuizAttempt } from '~/composables/course-material/useQuizAttempt';
import type { QuizAnswer } from '~/interfaces/lesson-quiz';

/**
 * @module pages/courses/quiz/[attemptId]
 *
 * Standalone results page for a quiz attempt. Polls the backend until the
 * grading goroutine flips the attempt to `completed` (or `failed`).
 *
 * Three visual states:
 *   - evaluating: friendly progress card + skeleton score banner
 *   - completed : score banner + per-question breakdown
 *   - failed    : explanation + path back to the lesson
 *
 * The page is bookmarkable. Closing the tab and coming back later just
 * shows the cached results — no second submission needed.
 */

useHead({ title: 'Quiz results · FocusFlow' });
definePageMeta({
  layout: false,
  middleware: ['auth'],
});

const route = useRoute();
const attemptId = Number(route.params.attemptId);

const { attempt, error, isPolling, start } = useQuizAttempt(attemptId);

onMounted(() => {
  if (!Number.isFinite(attemptId) || attemptId <= 0) return;
  start();
});

const breadcrumbs = computed(() => [
  { title: 'Home', href: '/' },
  { title: 'Courses', href: '/courses' },
  { title: 'Quiz results', href: route.fullPath, current: true },
]);

const backToLessonHref = computed(() => {
  // course_id is the field that drives the /courses/detail page; video_id
  // is the lesson PK, not the course PK. Earlier code mixed them up.
  const courseId = attempt.value?.course_id;
  return courseId ? `/courses/detail?id=${courseId}` : '/courses';
});

const status = computed(() => attempt.value?.status ?? 'evaluating');
const isEvaluating = computed(() => status.value === 'evaluating');
const isCompleted = computed(() => status.value === 'completed');
const isFailed = computed(() => status.value === 'failed');

/**
 * Score-band accent colour. Used by the icon chip and the small "Quiz
 * results" eyebrow label only — the hero body stays neutral so text
 * contrast doesn't fight the score tone.
 */
const accentText = computed(() => {
  const t = attempt.value?.total_score ?? 0;
  if (t >= 85) return 'text-emerald-700 dark:text-emerald-300';
  if (t >= 50) return 'text-primary';
  return 'text-destructive';
});

const heading = computed(() => {
  if (isFailed.value) return 'Grading failed';
  if (isEvaluating.value) return 'Evaluating your answers…';
  const t = attempt.value?.total_score ?? 0;
  if (t >= 85) return 'Excellent work';
  if (t >= 50) return 'Nice attempt';
  return 'Room to grow';
});

const subheading = computed(() => {
  if (isFailed.value) {
    return attempt.value?.error_message || 'We could not finish grading this attempt.';
  }
  if (isEvaluating.value) {
    return 'You can leave this page — your results will be waiting when you return.';
  }
  return 'Here is the breakdown of your answers and where to focus next.';
});

// Order answers by question position when the attempt's question list is
// not eager-loaded; for now we keep insertion order from the backend,
// which already matches.
const orderedAnswers = computed<QuizAnswer[]>(() => {
  return attempt.value?.answers ?? [];
});

const answerIcon = (a: QuizAnswer) => {
  if (a.is_correct === true || a.score >= 0.85) return CheckCircle2;
  if (a.is_correct === false || a.score < 0.3) return XCircle;
  return BookOpenCheck;
};

const answerTone = (a: QuizAnswer) => {
  if (a.is_correct === true || a.score >= 0.85) return 'text-emerald-500';
  if (a.is_correct === false || a.score < 0.3) return 'text-destructive';
  return 'text-primary';
};

const answerType = (a: QuizAnswer) =>
  a.is_correct === null || a.is_correct === undefined ? 'Short answer' : 'Multiple choice';

const isUserChoice = (a: QuizAnswer, opt: string) => {
  const raw = (a.answer || '').trim();
  if (!raw) return false;
  // Backend accepts letter ("A"), index ("0"), or full text.
  if (raw === opt) return true;
  if (a.question_options) {
    if (raw.length === 1) {
      const idx = raw.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
      return a.question_options[idx] === opt;
    }
    if (/^\d+$/.test(raw)) {
      return a.question_options[Number(raw)] === opt;
    }
  }
  return false;
};

const optionTone = (a: QuizAnswer, opt: string) => {
  const correct = opt === a.correct_option;
  const chosen = isUserChoice(a, opt);
  if (correct && chosen) {
    return 'border-emerald-500/70 bg-emerald-500/15 dark:bg-emerald-500/20 text-card-foreground';
  }
  if (correct) {
    return 'border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-500/15 text-card-foreground';
  }
  if (chosen) {
    return 'border-destructive/60 bg-destructive/10 dark:bg-destructive/15 text-card-foreground';
  }
  return 'border-border bg-background text-card-foreground/80';
};

const optionBadgeTone = (a: QuizAnswer, opt: string) => {
  const correct = opt === a.correct_option;
  const chosen = isUserChoice(a, opt);
  if (correct) return 'bg-emerald-500 text-white';
  if (chosen) return 'bg-destructive text-destructive-foreground';
  return 'bg-muted text-muted-foreground';
};

</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto max-w-3xl px-4 py-6">
      <!-- Back link -->
      <NuxtLink :to="backToLessonHref">
        <Button
          variant="ghost"
          size="sm"
          class="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to lesson
        </Button>
      </NuxtLink>

      <!-- Error (network / not found) -->
      <div
        v-if="error"
        class="mt-6 rounded-xl bg-destructive/5 p-6 text-sm text-destructive"
      >
        <p class="font-medium">{{ error }}</p>
      </div>

      <!-- Hero — flat card, high contrast. Score tone lives only in the
           icon chip + the small eyebrow label, not the whole panel. -->
      <div
        v-else
        class="mt-6 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
      >
        <div class="p-6 sm:p-8">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border"
              :class="accentText"
            >
              <Loader2 v-if="isEvaluating" class="h-5 w-5 animate-spin" />
              <Trophy v-else-if="isCompleted" class="h-5 w-5" />
              <XCircle v-else class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="text-[11px] font-semibold uppercase tracking-wider"
                :class="accentText"
              >
                Quiz results
              </p>
              <h1 class="mt-0.5 text-2xl font-bold leading-tight text-card-foreground sm:text-3xl">
                {{ heading }}
              </h1>
              <p class="mt-1 max-w-prose text-sm leading-relaxed text-card-foreground/80">
                {{ subheading }}
              </p>
            </div>
          </div>

          <!-- Score row — solid cards inside the tinted hero so numbers are legible -->
          <div class="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            <div class="rounded-xl bg-background p-3 ring-1 ring-border">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </p>
              <p
                v-if="isEvaluating"
                class="mt-1 text-2xl font-bold text-muted-foreground/40"
              >
                —
              </p>
              <p v-else class="mt-1 text-2xl font-bold text-foreground" :class="accentText">
                {{ Math.round(attempt?.total_score ?? 0) }}%
              </p>
            </div>
            <div class="rounded-xl bg-background p-3 ring-1 ring-border">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                MCQ
              </p>
              <p class="mt-1 text-2xl font-bold text-foreground">
                {{ Math.round(attempt?.mcq_score ?? 0) }}%
              </p>
            </div>
            <div class="rounded-xl bg-background p-3 ring-1 ring-border">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Writing
              </p>
              <p
                v-if="isEvaluating"
                class="mt-1 text-2xl font-bold text-muted-foreground/40"
              >
                —
              </p>
              <p v-else class="mt-1 text-2xl font-bold text-foreground">
                {{ Math.round(attempt?.writing_score ?? 0) }}%
              </p>
            </div>
          </div>

          <!-- Evaluating helper bar -->
          <div
            v-if="isEvaluating"
            class="mt-5 flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground ring-1 ring-border"
          >
            <Clock class="h-3.5 w-3.5" />
            <span>
              Writing answers are being graded. Usually under 15 seconds.
            </span>
          </div>
        </div>
      </div>

      <!-- Failed → retry CTA -->
      <div
        v-if="isFailed"
        class="mt-6 rounded-xl bg-card p-5 ring-1 ring-border shadow-sm"
      >
        <p class="text-sm text-card-foreground">
          The MCQ portion of your score is still accurate — only the writing-answer
          grading failed. You can retry the quiz from the lesson page.
        </p>
        <div class="mt-4 flex gap-2">
          <NuxtLink :to="backToLessonHref">
            <Button variant="outline" class="gap-2">
              <RefreshCw class="h-4 w-4" />
              Back to lesson
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Per-question breakdown -->
      <section v-if="attempt" class="mt-6 space-y-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Question breakdown
        </h2>

        <article
          v-for="(a, idx) in orderedAnswers"
          :key="a.id"
          class="rounded-xl bg-card p-4 ring-1 ring-border shadow-sm transition-shadow hover:shadow"
        >
          <header class="flex items-start gap-3">
            <component
              :is="answerIcon(a)"
              class="mt-0.5 h-4 w-4 flex-shrink-0"
              :class="answerTone(a)"
            />
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {{ answerType(a) }} · Q{{ idx + 1 }}
              </p>
              <p
                v-if="isEvaluating && answerType(a) === 'Short answer'"
                class="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Loader2 class="h-3 w-3 animate-spin" />
                Grading…
              </p>
              <p v-else class="mt-1 text-sm font-semibold" :class="answerTone(a)">
                {{ Math.round(a.score * 100) }}%
              </p>
            </div>
          </header>

          <!-- Question prompt (newly surfaced for context) -->
          <p
            v-if="a.question_prompt"
            class="mt-2 pl-7 text-sm font-medium leading-snug text-card-foreground"
          >
            {{ a.question_prompt }}
          </p>

          <!-- MCQ: render option grid with user + correct highlighted -->
          <ul
            v-if="a.question_type === 'mcq' && a.question_options?.length"
            class="mt-3 space-y-1.5 pl-7 text-sm"
          >
            <li
              v-for="(opt, idx) in a.question_options"
              :key="idx"
              class="flex items-start gap-2 rounded-md border px-2.5 py-2"
              :class="optionTone(a, opt)"
            >
              <span
                class="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                :class="optionBadgeTone(a, opt)"
              >
                {{ String.fromCharCode(65 + idx) }}
              </span>
              <span class="min-w-0 flex-1 text-sm leading-relaxed">
                {{ opt }}
              </span>
              <span v-if="isUserChoice(a, opt)" class="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider opacity-70">
                Your answer
              </span>
              <span v-else-if="opt === a.correct_option" class="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Correct
              </span>
            </li>
          </ul>

          <!-- Writing: user answer + feedback -->
          <div v-else class="mt-3 space-y-3 pl-7 text-sm">
            <div class="rounded-lg bg-background p-3 ring-1 ring-border">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your answer
              </p>
              <p class="mt-1 leading-relaxed text-card-foreground">
                {{ a.answer || '—' }}
              </p>
            </div>
            <div
              v-if="a.feedback && a.feedback !== 'Evaluating…'"
              class="rounded-lg bg-emerald-500/5 p-3 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10"
            >
              <p class="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Feedback
              </p>
              <p class="mt-1 leading-relaxed text-card-foreground">
                {{ a.feedback }}
              </p>
            </div>
          </div>
        </article>
      </section>

      <!-- Footer CTA when completed -->
      <div
        v-if="isCompleted"
        class="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-sm text-muted-foreground">
          Lesson marked complete. Keep the streak going.
        </p>
        <NuxtLink :to="backToLessonHref">
          <Button class="gap-2">
            Continue learning
            <ArrowLeft class="h-4 w-4 rotate-180" />
          </Button>
        </NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>
