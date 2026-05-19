<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useHead } from '#imports';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  Trophy,
  XCircle,
} from 'lucide-vue-next';
import { useProfile } from '~/composables/Profile';
import type { QuizAttempt } from '~/interfaces/lesson-quiz';

/**
 * @module pages/quizzes
 * Quiz-history feed. Lists every attempt the learner has submitted, newest
 * first. Each row links to the existing `/courses/quiz/[attemptId]`
 * results page (which also exposes the retake button).
 */

useHead({ title: 'Quiz history · FocusFlow' });
definePageMeta({
  layout: false,
  middleware: ['auth'],
});

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'Quiz history', href: '/quizzes', current: true },
];

const { profile } = useProfile();
const attempts = ref<QuizAttempt[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const userId = computed<number | null>(() => {
  const id = profile.value?.id;
  if (typeof id === 'number') return id;
  if (typeof id === 'string' && id && !isNaN(Number(id))) return Number(id);
  return null;
});

const load = async () => {
  if (!userId.value) {
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    const response = await $fetch<{ data: QuizAttempt[] }>('/api/quiz-attempts', {
      params: { user_id: userId.value, limit: 50 },
    });
    attempts.value = Array.isArray(response?.data) ? response.data : [];
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Failed to load history.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Wait for the profile composable to hydrate so we know userId.
  const interval = setInterval(() => {
    if (userId.value) {
      clearInterval(interval);
      load();
    }
  }, 50);
  // Don't loop forever if the profile is genuinely empty.
  setTimeout(() => clearInterval(interval), 3_000);
});

const tone = (score: number) => {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-primary';
  return 'text-destructive';
};
const Icon = (status: QuizAttempt['status'], score: number) => {
  if (status === 'evaluating') return Loader2;
  if (status === 'failed') return XCircle;
  if (score >= 85) return Trophy;
  if (score >= 50) return BookOpenCheck;
  return CheckCircle2;
};
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto max-w-3xl px-4 py-6">
      <header class="mb-6 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quiz history
          </p>
          <h1 class="mt-0.5 text-2xl font-semibold leading-tight text-foreground">
            Your past quizzes
          </h1>
          <p class="mt-1 max-w-prose text-sm text-muted-foreground">
            Every attempt you've submitted, newest first. Click a row to see the
            full breakdown — including correct answers and feedback — and
            re-take from there.
          </p>
        </div>
      </header>

      <div
        v-if="isLoading"
        class="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground"
      >
        <Loader2 class="mx-auto h-5 w-5 animate-spin text-primary" />
        <p class="mt-3">Loading your history…</p>
      </div>

      <div
        v-else-if="error"
        class="rounded-xl bg-destructive/5 p-6 text-sm text-destructive"
      >
        {{ error }}
      </div>

      <div
        v-else-if="attempts.length === 0"
        class="rounded-xl bg-card p-12 text-center"
      >
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BookOpenCheck class="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-card-foreground">No quizzes yet</h2>
        <p class="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Finish a lesson and submit your first quiz — it'll show up here.
        </p>
        <NuxtLink to="/courses" class="mt-5 inline-block">
          <Button class="gap-2">
            Browse courses
            <ArrowRight class="h-4 w-4" />
          </Button>
        </NuxtLink>
      </div>

      <ol v-else class="space-y-2">
        <li v-for="a in attempts" :key="a.id">
          <NuxtLink
            :to="`/courses/quiz/${a.id}`"
            class="group flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-border shadow-sm transition-all hover:-translate-y-px hover:shadow"
          >
            <span
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted/60"
              :class="tone(a.total_score)"
            >
              <component
                :is="Icon(a.status, a.total_score)"
                class="h-4 w-4"
                :class="a.status === 'evaluating' ? 'animate-spin' : ''"
              />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-card-foreground">
                {{ a.lesson_title || `Lesson ${a.video_id}` }}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                <span
                  v-if="a.set_number && a.set_number > 1"
                  class="mr-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  Set {{ a.set_number }}
                </span>
                {{ formatDate(a.created_at) }}
              </p>
            </div>

            <div class="flex-shrink-0 text-right">
              <p
                v-if="a.status === 'completed'"
                class="text-base font-semibold"
                :class="tone(a.total_score)"
              >
                {{ Math.round(a.total_score) }}%
              </p>
              <p v-else-if="a.status === 'evaluating'" class="text-[11px] uppercase tracking-wider text-muted-foreground">
                Evaluating
              </p>
              <p v-else class="text-[11px] uppercase tracking-wider text-destructive">
                Failed
              </p>
              <p class="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                MCQ {{ Math.round(a.mcq_score) }}%
              </p>
            </div>

            <ArrowRight class="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
          </NuxtLink>
        </li>
      </ol>
    </div>
  </NuxtLayout>
</template>
