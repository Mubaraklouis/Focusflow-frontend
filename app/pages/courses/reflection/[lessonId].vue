<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useHead, useRoute, useRouter, onBeforeRouteLeave } from '#imports';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-vue-next';
import { useProfile } from '~/composables/Profile';
import { useReflection } from '~/composables/course-material/useReflection';
import type { Reflection } from '~/interfaces/reflection';
import {
  MASTERY_THRESHOLD,
  REFLECTION_MAX_CHARS,
  REFLECTION_MIN_CHARS,
} from '~/interfaces/reflection';

/**
 * @module pages/courses/reflection/[lessonId]
 *
 * Feynman-technique reflection page. Three sections:
 *   1. Lesson header (title, course name, back link, context blurb)
 *   2. Write panel — textarea, live counter, submit → AI result card
 *   3. Progress panel — score chart, headline stats, expandable attempt history
 *
 * The AI analysis can take up to 120 seconds. The UI surfaces this with a
 * long-running progress state and does NOT timeout the fetch.
 */

useHead({ title: 'Feynman Reflection · FocusFlow' });
definePageMeta({
  layout: false,
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const { profile } = useProfile();

const lessonId = Number(route.params.lessonId);

// ── User id ───────────────────────────────────────────────────────────────────
const userId = computed<number | null>(() => {
  const id = profile.value?.id;
  if (typeof id === 'number') return id;
  if (typeof id === 'string' && id && !isNaN(Number(id))) return Number(id);
  return null;
});

// Lesson title: try to get from query, fall back to "this lesson"
const lessonTitle = computed(() =>
  typeof route.query.title === 'string' && route.query.title
    ? decodeURIComponent(route.query.title)
    : 'This lesson',
);
const courseTitle = computed(() =>
  typeof route.query.course === 'string' && route.query.course
    ? decodeURIComponent(route.query.course)
    : '',
);
const backHref = computed(() =>
  typeof route.query.back === 'string' && route.query.back
    ? route.query.back
    : '/courses',
);

// ── Reflection composable ─────────────────────────────────────────────────────
const { isSubmitting, history, latest, error: reflectionError, submitReflection, getReflectionHistory } =
  useReflection();

// ── Write modal state ─────────────────────────────────────────────────────────
// The writing prompt now lives in a modal so the page itself is dedicated to
// reading the analysis full-width.
const showWriteModal = ref<boolean>(false);
const bodyText = ref<string>('');
const lastResult = ref<Reflection | null>(null);
const submitError = ref<string | null>(null);
const masteredCelebrated = ref<boolean>(false);

const trimmedLength = computed(() => bodyText.value.trim().length);

const charCountValid = computed(
  () => trimmedLength.value >= REFLECTION_MIN_CHARS && trimmedLength.value <= REFLECTION_MAX_CHARS,
);

const charCountClass = computed(() => {
  if (trimmedLength.value === 0) return 'text-muted-foreground';
  if (trimmedLength.value < REFLECTION_MIN_CHARS || trimmedLength.value > REFLECTION_MAX_CHARS) {
    return 'text-destructive font-medium';
  }
  return 'text-muted-foreground';
});

const charHint = computed(() => {
  if (trimmedLength.value < REFLECTION_MIN_CHARS && trimmedLength.value > 0) {
    return `${REFLECTION_MIN_CHARS - trimmedLength.value} more characters needed`;
  }
  if (trimmedLength.value > REFLECTION_MAX_CHARS) {
    return `${trimmedLength.value - REFLECTION_MAX_CHARS} characters over limit`;
  }
  return `${trimmedLength.value} / ${REFLECTION_MAX_CHARS}`;
});

// Submission is async (backend returns 202 the moment we POST), so we no longer
// need a navigation guard — leaving the page is safe; the grader continues
// server-side and the user can return later to see the result.

const handleSubmit = async () => {
  if (!charCountValid.value || isSubmitting.value) return;
  if (!userId.value) {
    submitError.value = 'You must be logged in to submit a reflection.';
    return;
  }
  submitError.value = null;
  masteredCelebrated.value = false;

  try {
    // Returns immediately with status='evaluating'; the composable has
    // already appended the placeholder row to `history`.
    await submitReflection(lessonId, userId.value, bodyText.value);
    bodyText.value = '';
    showWriteModal.value = false;
    showToast('Submitted — analysis running in the background. Feel free to navigate away.');
  } catch (err: any) {
    submitError.value =
      err?.message ||
      (reflectionError.value ?? 'Something went wrong. Please try again.');
  }
};

// ── Score ring colour helpers ─────────────────────────────────────────────────
const scoreRingClass = (score: number) => {
  if (score >= MASTERY_THRESHOLD) return 'ring-emerald-500 text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'ring-amber-400 text-amber-600 dark:text-amber-400';
  return 'ring-destructive text-destructive';
};

const scoreBgClass = (score: number) => {
  if (score >= MASTERY_THRESHOLD) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (score >= 50) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-destructive/5';
};

// ── Progress panel & focused-reading dialog ──────────────────────────────────
// Clicking an attempt opens a wide focused-reading dialog. This replaces the
// old inline accordion so reading a past reflection isn't cramped into the
// progress sidebar.
// viewingAttempt is the explicitly-clicked attempt. When null, the in-page
// analysis falls back to the most-recent completed reflection so the page is
// never empty after the first graded attempt.
const viewingAttempt = ref<Reflection | null>(null);
const openAttempt = (attempt: Reflection) => {
  if (attempt.status === 'evaluating') return; // nothing to read yet
  viewingAttempt.value = attempt;
};

const latestCompleted = computed<Reflection | null>(() => {
  const done = history.value.filter((r) => r.status === 'completed');
  if (!done.length) return null;
  return [...done].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
});

// The reflection rendered in the full-page analysis area.
const selectedAttempt = computed<Reflection | null>(
  () => viewingAttempt.value ?? latestCompleted.value,
);

// Helper for the dialog: which attempt-number to label (1-based, chronological).
const attemptNumber = (attempt: Reflection): number =>
  history.value.findIndex((r) => r.id === attempt.id) + 1;

const bestScore = computed(() =>
  history.value.length ? Math.max(...history.value.map((r) => r.score)) : 0,
);
const latestScore = computed(() =>
  history.value.length ? history.value[history.value.length - 1].score : 0,
);
const masteredAttempt = computed(() => {
  const idx = history.value.findIndex((r) => r.mastered);
  return idx >= 0 ? idx + 1 : null;
});

/**
 * Gains and closures relative to the previous attempt.
 * Returns arrays of strength strings gained and gap strings closed.
 */
const deltaVsPrev = (idx: number) => {
  if (idx === 0) return { gained: [] as string[], closed: [] as string[] };
  const prev = history.value[idx - 1];
  const curr = history.value[idx];
  const gained = curr.strengths.filter((s) => !prev.strengths.includes(s));
  const closed = prev.gaps.filter((g) => !curr.gaps.includes(g));
  return { gained, closed };
};

/**
 * Hand-rolled SVG line chart.
 * x-axis: attempt number (1..n), y-axis: score (0..100).
 * Width = 100%, height = 80px viewBox.
 */
const SVG_H = 80;
const SVG_PADDING_X = 12;
const SVG_PADDING_Y = 8;

const chartPoints = computed(() => {
  const scores = history.value.map((r) => r.score);
  if (scores.length < 1) return null;

  const n = scores.length;
  // We need at least one point; if only one, place it in the centre.
  const plotW = 280 - SVG_PADDING_X * 2;
  const plotH = SVG_H - SVG_PADDING_Y * 2;

  const xs = scores.map((_, i) =>
    n === 1
      ? SVG_PADDING_X + plotW / 2
      : SVG_PADDING_X + (i / (n - 1)) * plotW,
  );
  const ys = scores.map(
    (s) => SVG_PADDING_Y + plotH - (s / 100) * plotH,
  );

  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const dots = xs.map((x, i) => ({ x, y: ys[i], score: scores[i] }));
  return { polyline, dots };
});

// ── Open the write modal (clears prior draft) ────────────────────────────────
const openWriteModal = () => {
  bodyText.value = '';
  submitError.value = null;
  showWriteModal.value = true;
};

// ── Mastered toast (client-side only) ────────────────────────────────────────
const toastMessage = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const showToast = (msg: string) => {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
};

const handleMarkMastered = () => {
  showToast('Marked as mastered');
  setTimeout(() => router.push(backHref.value), 1200);
};

// ── Initial data load ─────────────────────────────────────────────────────────
onMounted(async () => {
  if (!userId.value || !lessonId) return;
  await getReflectionHistory(lessonId, userId.value);
});

// ── Background polling for evaluating reflections ───────────────────────────
// While any row in history is still being graded by the backend goroutine,
// poll the history endpoint every 4 s. The poll auto-stops the moment every
// row is in a terminal state (completed/failed).
const POLL_INTERVAL_MS = 4000;
let pollHandle: ReturnType<typeof setInterval> | null = null;

const hasEvaluating = computed(() =>
  history.value.some((r) => r.status === 'evaluating'),
);

const startPolling = () => {
  if (pollHandle !== null || !userId.value) return;
  pollHandle = setInterval(async () => {
    if (!userId.value) return;
    const before = new Set(
      history.value
        .filter((r) => r.status === 'completed')
        .map((r) => r.id),
    );
    await getReflectionHistory(lessonId, userId.value);
    // Surface the most-recent newly-completed row in the inline summary card,
    // so the user sees immediate feedback without having to click into the
    // history list.
    const newlyCompleted = history.value
      .filter((r) => r.status === 'completed' && !before.has(r.id))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
    if (newlyCompleted) {
      lastResult.value = newlyCompleted;
      masteredCelebrated.value = false;
    }
  }, POLL_INTERVAL_MS);
};

const stopPolling = () => {
  if (pollHandle !== null) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
};

watch(hasEvaluating, (evaluating) => {
  if (evaluating) startPolling();
  else stopPolling();
});

onUnmounted(stopPolling);

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};
</script>

<template>
  <NuxtLayout name="app-layout">
    <!-- Toast -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition-all duration-200 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="container mx-auto max-w-7xl px-4 py-6">

      <!-- ── 1. Lesson header ──────────────────────────────────────────────── -->
      <div class="mb-4">
        <NuxtLink :to="backHref">
          <Button
            variant="ghost"
            size="sm"
            class="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft class="h-4 w-4" />
            Back to lesson
          </Button>
        </NuxtLink>
      </div>

      <header
        class="mb-6 overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-sm"
      >
        <div class="flex items-start gap-4 px-6 py-6">
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
            <BookOpen class="h-6 w-6 text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <span>Feynman reflection</span>
              <template v-if="courseTitle">
                <span class="text-muted-foreground/40">/</span>
                <span class="truncate normal-case tracking-normal text-muted-foreground">
                  {{ courseTitle }}
                </span>
              </template>
            </p>
            <h1 class="mt-1 text-xl font-bold leading-snug text-foreground sm:text-2xl">
              {{ lessonTitle }}
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explain this lesson in your own words. We'll grade your understanding,
              highlight what you nailed, and show you exactly what to focus on next.
            </p>
          </div>
        </div>
      </header>

      <!-- ── Main layout: 60/40 on desktop, stacked on mobile ─────────────── -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">

        <!-- ── 2. Analysis (full page, lg: 3/5) ──────────────────────────── -->
        <section class="lg:col-span-3">

          <!-- Empty state: no reflections at all -->
          <div
            v-if="!history.length"
            class="flex flex-col items-center justify-center gap-4 rounded-xl bg-card px-6 py-20 text-center ring-1 ring-border shadow-sm"
          >
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-card-foreground">No reflections yet</h2>
              <p class="mt-1 max-w-sm text-sm text-muted-foreground">
                Explain this lesson in your own words. We'll grade your understanding and show you exactly what to focus on next.
              </p>
            </div>
            <Button class="gap-2" @click="openWriteModal">
              <BookOpen class="h-4 w-4" />
              Write your first reflection
            </Button>
          </div>

          <!-- Nothing graded yet, but first reflection is being analyzed -->
          <div
            v-else-if="!selectedAttempt"
            class="flex flex-col items-center justify-center gap-3 rounded-xl bg-card px-6 py-20 text-center ring-1 ring-border shadow-sm"
          >
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
            <h2 class="text-base font-semibold text-card-foreground">
              Analyzing your reflection…
            </h2>
            <p class="max-w-sm text-sm text-muted-foreground">
              This runs in the background and can take up to 2 minutes. You can leave this page — your result will be waiting when you come back.
            </p>
          </div>

          <!-- Selected attempt analysis — full-width reading view -->
          <div
            v-else
            class="overflow-hidden rounded-xl bg-card ring-2 shadow-sm"
            :class="selectedAttempt.status === 'completed' && selectedAttempt.mastered ? 'ring-emerald-500' : 'ring-border'"
          >
            <!-- Header bar -->
            <div class="flex items-start justify-between gap-4 border-b border-border/40 px-6 py-4">
              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Attempt {{ attemptNumber(selectedAttempt) }} of {{ history.length }} ·
                  {{ formatDate(selectedAttempt.created_at) }}
                </p>
                <h2 class="mt-1 text-lg font-semibold text-card-foreground sm:text-xl">
                  {{ selectedAttempt.status === 'completed'
                      ? (selectedAttempt.score >= MASTERY_THRESHOLD ? 'Mastered' : selectedAttempt.score >= 50 ? 'Progressing' : 'Needs work')
                      : 'Analysis failed' }}
                </h2>
              </div>
              <div
                v-if="selectedAttempt.status === 'completed'"
                class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold ring-4"
                :class="[scoreRingClass(selectedAttempt.score), scoreBgClass(selectedAttempt.score)]"
              >
                {{ selectedAttempt.score }}
              </div>
              <div
                v-else
                class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/30"
              >
                <AlertTriangle class="h-6 w-6 text-destructive" />
              </div>
            </div>

            <!-- Failed state -->
            <div v-if="selectedAttempt.status === 'failed'" class="space-y-5 p-6">
              <div class="flex items-start gap-3 rounded-lg bg-destructive/5 p-4 ring-1 ring-destructive/20">
                <AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <p class="text-sm text-card-foreground">
                  {{ selectedAttempt.error_message || 'We could not grade this reflection. Your text is saved below — feel free to write a new one.' }}
                </p>
              </div>
              <div class="rounded-xl bg-muted/30 p-5 ring-1 ring-border/40">
                <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Your explanation
                </p>
                <p class="whitespace-pre-line text-base leading-7 text-card-foreground">
                  {{ selectedAttempt.body }}
                </p>
              </div>
              <Button class="gap-2" @click="openWriteModal">
                <BookOpen class="h-4 w-4" />
                Write another reflection
              </Button>
            </div>

            <!-- Completed state — comfortable reading layout -->
            <div v-else class="space-y-6 p-6 sm:p-8">
              <!-- Mastery banner + CTA -->
              <div
                v-if="selectedAttempt.mastered"
                class="flex flex-col gap-3 rounded-lg bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <p class="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <Trophy class="h-4 w-4 flex-shrink-0" />
                  You explained this clearly enough to teach it.
                </p>
                <div
                  v-if="selectedAttempt.id === latestCompleted?.id && !masteredCelebrated"
                  class="flex gap-2"
                >
                  <Button size="sm" class="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" @click="handleMarkMastered">
                    <Trophy class="h-4 w-4" />
                    Mark as mastered
                  </Button>
                  <Button size="sm" variant="outline" @click="masteredCelebrated = true">
                    Keep refining
                  </Button>
                </div>
              </div>

              <!-- Explanation text — the centrepiece -->
              <section>
                <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Your explanation · {{ selectedAttempt.word_count }} words
                </p>
                <p class="whitespace-pre-line text-base leading-7 text-card-foreground">
                  {{ selectedAttempt.body }}
                </p>
              </section>

              <!-- Delta vs previous attempt -->
              <section
                v-if="attemptNumber(selectedAttempt) > 1 &&
                  (deltaVsPrev(attemptNumber(selectedAttempt) - 1).gained.length ||
                   deltaVsPrev(attemptNumber(selectedAttempt) - 1).closed.length)"
              >
                <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Improvement since attempt {{ attemptNumber(selectedAttempt) - 1 }}
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="(g, i) in deltaVsPrev(attemptNumber(selectedAttempt) - 1).gained"
                    :key="`g${i}`"
                    class="flex items-start gap-2.5 text-sm leading-6 text-card-foreground"
                  >
                    <CheckCircle2 class="mt-1 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span><span class="font-medium text-emerald-600 dark:text-emerald-400">New strength:</span> {{ g }}</span>
                  </li>
                  <li
                    v-for="(c, i) in deltaVsPrev(attemptNumber(selectedAttempt) - 1).closed"
                    :key="`c${i}`"
                    class="flex items-start gap-2.5 text-sm leading-6 text-card-foreground"
                  >
                    <Target class="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                    <span><span class="font-medium text-primary">Gap closed:</span> {{ c }}</span>
                  </li>
                </ul>
              </section>

              <!-- Strengths -->
              <section v-if="selectedAttempt.strengths.length">
                <h3 class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  What you got right
                </h3>
                <ul class="space-y-2">
                  <li
                    v-for="(s, i) in selectedAttempt.strengths"
                    :key="i"
                    class="flex items-start gap-2.5 text-sm leading-6 text-card-foreground"
                  >
                    <CheckCircle2 class="mt-1 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {{ s }}
                  </li>
                </ul>
              </section>

              <!-- Gaps -->
              <section v-if="selectedAttempt.gaps.length">
                <h3 class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <Target class="h-3.5 w-3.5" />
                  What to revisit
                </h3>
                <ul class="space-y-2">
                  <li
                    v-for="(g, i) in selectedAttempt.gaps"
                    :key="i"
                    class="flex items-start gap-2.5 text-sm leading-6 text-card-foreground"
                  >
                    <span class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                    {{ g }}
                  </li>
                </ul>
              </section>

              <!-- Next focus -->
              <section
                v-if="selectedAttempt.suggested_next_focus"
                class="rounded-xl bg-primary/5 p-4 text-sm leading-6 ring-1 ring-primary/15"
              >
                <span class="font-semibold text-primary">Focus next on: </span>
                {{ selectedAttempt.suggested_next_focus }}
              </section>

              <!-- Footer CTAs -->
              <div class="flex flex-wrap gap-2 border-t border-border/40 pt-5">
                <Button class="gap-2" @click="openWriteModal">
                  <BookOpen class="h-4 w-4" />
                  Write another reflection
                </Button>
                <NuxtLink :to="backHref">
                  <Button variant="outline" class="gap-2">
                    <ArrowLeft class="h-4 w-4" />
                    Back to lesson
                  </Button>
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>

        <!-- ── 3. Progress panel (lg: 2/5) ───────────────────────────────── -->
        <aside class="space-y-4 lg:col-span-2">

          <!-- Primary write CTA -->
          <Button class="w-full gap-2" size="lg" @click="openWriteModal">
            <BookOpen class="h-4 w-4" />
            {{ history.length ? 'Write another reflection' : 'Write a reflection' }}
          </Button>

          <div class="rounded-xl bg-card p-5 ring-1 ring-border shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-card-foreground">Your progress</h2>
            </div>

            <!-- Empty state -->
            <div
              v-if="!history.length"
              class="flex flex-col items-center justify-center gap-3 py-8 text-center"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Sparkles class="h-5 w-5 text-muted-foreground" />
              </div>
              <p class="text-sm text-muted-foreground">
                No reflections yet — use the button above.
              </p>
            </div>

            <template v-else>
              <!-- Mastered pill -->
              <div
                v-if="masteredAttempt"
                class="mb-4 flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
              >
                <Trophy class="h-3.5 w-3.5" />
                Mastered at attempt {{ masteredAttempt }}
              </div>

              <!-- Headline stats -->
              <div class="mb-4 grid grid-cols-3 gap-2 text-center">
                <div class="rounded-lg bg-muted/40 px-2 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Latest</p>
                  <p class="mt-0.5 text-xl font-bold text-foreground">{{ latestScore }}</p>
                </div>
                <div class="rounded-lg bg-muted/40 px-2 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Best</p>
                  <p class="mt-0.5 text-xl font-bold text-foreground">{{ bestScore }}</p>
                </div>
                <div class="rounded-lg bg-muted/40 px-2 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Attempts</p>
                  <p class="mt-0.5 text-xl font-bold text-foreground">{{ history.length }}</p>
                </div>
              </div>

              <!-- SVG score-over-time chart -->
              <div v-if="chartPoints" class="mb-5 overflow-hidden rounded-lg bg-muted/30 px-2 py-2 ring-1 ring-border/40">
                <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Score over time
                </p>
                <svg
                  viewBox="0 0 280 80"
                  class="w-full"
                  role="img"
                  aria-label="Score over time chart"
                >
                  <!-- Grid lines at 25, 50, 75 -->
                  <line
                    v-for="pct in [25, 50, 75]"
                    :key="pct"
                    x1="12" :x2="268"
                    :y1="SVG_PADDING_Y + (SVG_H - SVG_PADDING_Y * 2) - (pct / 100) * (SVG_H - SVG_PADDING_Y * 2)"
                    :y2="SVG_PADDING_Y + (SVG_H - SVG_PADDING_Y * 2) - (pct / 100) * (SVG_H - SVG_PADDING_Y * 2)"
                    class="stroke-border/50"
                    stroke-width="0.5"
                    stroke-dasharray="4 3"
                  />
                  <!-- Mastery threshold line -->
                  <line
                    x1="12" x2="268"
                    :y1="SVG_PADDING_Y + (SVG_H - SVG_PADDING_Y * 2) - (MASTERY_THRESHOLD / 100) * (SVG_H - SVG_PADDING_Y * 2)"
                    :y2="SVG_PADDING_Y + (SVG_H - SVG_PADDING_Y * 2) - (MASTERY_THRESHOLD / 100) * (SVG_H - SVG_PADDING_Y * 2)"
                    class="stroke-emerald-500/50"
                    stroke-width="0.75"
                    stroke-dasharray="3 2"
                  />
                  <!-- Polyline -->
                  <polyline
                    :points="chartPoints.polyline"
                    fill="none"
                    class="stroke-primary"
                    stroke-width="2"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                  <!-- Dots -->
                  <circle
                    v-for="(dot, i) in chartPoints.dots"
                    :key="i"
                    :cx="dot.x"
                    :cy="dot.y"
                    r="3"
                    class="fill-background stroke-primary"
                    stroke-width="2"
                  />
                </svg>
              </div>

              <!-- Attempt history list — click an attempt to open it in the
                   focused reading dialog at the bottom of the page. -->
              <div class="space-y-2">
                <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Attempt history
                </h3>
                <div
                  v-for="(attempt, idx) in [...history].reverse()"
                  :key="attempt.id"
                  class="overflow-hidden rounded-lg ring-1 ring-border/60"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                    :disabled="attempt.status === 'evaluating'"
                    @click="openAttempt(attempt)"
                  >
                    <!-- Score badge / status indicator -->
                    <span
                      v-if="attempt.status === 'completed'"
                      class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2"
                      :class="scoreRingClass(attempt.score)"
                    >
                      {{ attempt.score }}
                    </span>
                    <span
                      v-else-if="attempt.status === 'evaluating'"
                      class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30"
                    >
                      <Loader2 class="h-3.5 w-3.5 animate-spin text-primary" />
                    </span>
                    <span
                      v-else
                      class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/30"
                    >
                      <AlertTriangle class="h-3.5 w-3.5 text-destructive" />
                    </span>

                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-medium text-card-foreground">
                        Attempt {{ history.length - idx }}
                        <span
                          v-if="attempt.status === 'evaluating'"
                          class="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                        >
                          Analyzing…
                        </span>
                        <span
                          v-else-if="attempt.status === 'failed'"
                          class="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                        >
                          Failed
                        </span>
                        <span
                          v-else-if="attempt.mastered"
                          class="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          <Trophy class="h-2.5 w-2.5" /> mastered
                        </span>
                      </p>
                      <p class="truncate text-[11px] text-muted-foreground">
                        {{ formatDate(attempt.created_at) }} · {{ attempt.word_count }} words
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </aside>
      </div>
    </div>

    <!-- ── Write reflection modal ───────────────────────────────────────────
         The writing prompt lives here so the page itself stays dedicated to
         reading the analysis. Submitting is async — the modal closes
         immediately and grading continues in the background. -->
    <Dialog :open="showWriteModal" @update:open="(v) => (showWriteModal = v)">
      <DialogContent class="w-[95vw] p-0 sm:max-w-2xl">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-border/40 px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen class="h-4 w-4 text-primary" />
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Feynman technique
              </p>
              <DialogTitle class="text-base font-semibold leading-tight text-card-foreground">
                Explain {{ lessonTitle }}
              </DialogTitle>
            </div>
          </div>
          <DialogClose
            class="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </DialogClose>
        </div>

        <div class="p-6">
          <label class="sr-only" for="reflection-body">Your explanation</label>
          <textarea
            id="reflection-body"
            v-model="bodyText"
            rows="10"
            :disabled="isSubmitting"
            placeholder="Imagine you're teaching this to a friend who hasn't seen the video. Explain it step by step in your own words…"
            class="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
          />

          <!-- Counter + hint row -->
          <div class="mt-1.5 flex items-center justify-between text-xs">
            <span :class="charCountClass">{{ charHint }}</span>
            <span class="text-muted-foreground/60">
              min {{ REFLECTION_MIN_CHARS }} · max {{ REFLECTION_MAX_CHARS }}
            </span>
          </div>

          <!-- Submit error -->
          <div
            v-if="submitError"
            class="mt-3 flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2.5 text-xs text-destructive ring-1 ring-destructive/20"
          >
            <AlertTriangle class="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{{ submitError }}</span>
          </div>

          <!-- Footer -->
          <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose as-child>
              <Button variant="ghost" :disabled="isSubmitting">Cancel</Button>
            </DialogClose>
            <Button
              :disabled="!charCountValid || isSubmitting"
              class="gap-2"
              @click="handleSubmit"
            >
              <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
              <Sparkles v-else class="h-4 w-4" />
              <span>{{ isSubmitting ? 'Submitting…' : 'Submit for analysis' }}</span>
            </Button>
          </div>

          <p class="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Analysis runs in the background and can take up to 2 minutes. You can close this and keep using the app — your result appears here when it's ready.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  </NuxtLayout>
</template>
