<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useHead } from '#imports';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Loader2,
  PlayCircle,
  RefreshCw,
  Trophy,
  XCircle,
} from 'lucide-vue-next';
import { useProfile } from '~/composables/Profile';
import { useDashboardSummary } from '~/composables/dashboard/useDashboardSummary';
import StatCard from '~/components/dashboard/StatCard.vue';
import type {
  DashboardAttemptCard,
  DashboardLessonCard,
  DashboardWeakLesson,
} from '~/interfaces/dashboard';

useHead({ title: 'Dashboard · FocusFlow' });

definePageMeta({
  layout: false,
  middleware: ['auth'],
});

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'Dashboard', href: '/dashboard', current: true },
];

const { profile } = useProfile();
const { summary, isLoading, error, load } = useDashboardSummary();

const userId = computed<number | null>(() => {
  const id = profile.value?.id;
  if (typeof id === 'number') return id;
  if (typeof id === 'string' && id && !isNaN(Number(id))) return Number(id);
  return null;
});

// The profile composable hydrates asynchronously — poll a few times for
// it to land, then fetch. Avoids a flash of empty-state on first mount.
onMounted(() => {
  if (userId.value) {
    load(userId.value);
    return;
  }
  const interval = setInterval(() => {
    if (userId.value) {
      clearInterval(interval);
      load(userId.value!);
    }
  }, 50);
  setTimeout(() => clearInterval(interval), 3_000);
});

const refresh = () => {
  if (userId.value) load(userId.value);
};

const firstName = computed(() => {
  const name = profile.value?.name?.trim() || '';
  return name.split(/\s+/)[0] || 'there';
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 5) return 'Welcome back';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
});

const thumbFor = (youtubeId: string) =>
  youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg` : '';

const lessonHref = (l: DashboardLessonCard | DashboardWeakLesson) =>
  `/courses/detail?id=${l.course_id}`;

const attemptHref = (a: DashboardAttemptCard) => `/courses/quiz/${a.attempt_id}`;

const reflectionHref = (l: DashboardWeakLesson) =>
  `/courses/reflection/${l.video_id}?title=${encodeURIComponent(l.lesson_title)}&back=${encodeURIComponent('/dashboard')}`;

const scoreTone = (score: number) => {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-primary';
  return 'text-red-600 dark:text-red-400';
};

const attemptIcon = (a: DashboardAttemptCard) => {
  if (a.status === 'evaluating') return Loader2;
  if (a.status === 'failed') return XCircle;
  if (a.total_score >= 85) return Trophy;
  return CheckCircle2;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const stats = computed(() => summary.value?.stats);
const continueLearning = computed(() => summary.value?.continue_learning ?? []);
const lessonsToReview = computed(() => summary.value?.lessons_to_review ?? []);
const recentAttempts = computed(() => summary.value?.recent_attempts ?? []);

const hasAnyData = computed(() => {
  if (!stats.value) return false;
  return (
    stats.value.courses_count > 0 ||
    stats.value.lessons_completed_count > 0 ||
    continueLearning.value.length > 0 ||
    recentAttempts.value.length > 0
  );
});
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto max-w-6xl px-4 py-8">
      <!-- ─── Greeting + refresh ─────────────────────────────────────── -->
      <header class="mb-8 flex items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {{ greeting }}, {{ firstName }}
          </h1>
          <p class="mt-1.5 text-sm text-muted-foreground">
            Here's where you stand with your learning today.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="gap-1.5 text-muted-foreground hover:text-foreground"
          :disabled="isLoading"
          @click="refresh"
        >
          <RefreshCw class="h-4 w-4" :class="isLoading ? 'animate-spin' : ''" />
          <span class="hidden sm:inline">Refresh</span>
        </Button>
      </header>

      <!-- ─── Loading state ──────────────────────────────────────────── -->
      <div
        v-if="isLoading && !summary"
        class="rounded-xl bg-card p-8 text-center ring-1 ring-border"
      >
        <Loader2 class="mx-auto h-5 w-5 animate-spin text-primary" />
        <p class="mt-3 text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>

      <!-- ─── Error state ────────────────────────────────────────────── -->
      <div
        v-else-if="error"
        class="rounded-xl bg-destructive/5 p-6 text-sm text-destructive ring-1 ring-destructive/30"
      >
        <p class="font-medium">{{ error }}</p>
        <Button variant="outline" class="mt-4 gap-2" @click="refresh">
          <RefreshCw class="h-4 w-4" />
          Try again
        </Button>
      </div>

      <!-- ─── Empty state ────────────────────────────────────────────── -->
      <div
        v-else-if="summary && !hasAnyData"
        class="rounded-xl bg-card p-12 text-center ring-1 ring-border"
      >
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BookOpen class="h-5 w-5 text-primary" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-card-foreground">
          You haven't started any lessons yet
        </h2>
        <p class="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Create your first course, add a YouTube video, and your stats will start
          showing up here.
        </p>
        <NuxtLink to="/courses" class="mt-5 inline-block">
          <Button class="gap-2">
            Browse courses
            <ArrowRight class="h-4 w-4" />
          </Button>
        </NuxtLink>
      </div>

      <!-- ─── Populated state ────────────────────────────────────────── -->
      <template v-else-if="summary">
        <!-- Stats strip -->
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Courses"
            :value="stats?.courses_count ?? 0"
            hint="In progress"
            :icon="BookOpen"
            tone="text-primary"
          />
          <StatCard
            label="Lessons done"
            :value="stats?.lessons_completed_count ?? 0"
            hint="All-time"
            :icon="CheckCircle2"
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Avg quiz score"
            :value="`${Math.round(stats?.average_quiz_score ?? 0)}%`"
            hint="Across attempts"
            :icon="Trophy"
            :tone="scoreTone(stats?.average_quiz_score ?? 0)"
          />
          <StatCard
            label="Streak"
            :value="`${stats?.current_streak_days ?? 0}d`"
            :hint="(stats?.current_streak_days ?? 0) > 0 ? 'Keep it going' : 'Take a quiz today'"
            :icon="Flame"
            tone="text-orange-500 dark:text-orange-400"
          />
        </section>

        <!-- Continue learning -->
        <section class="mt-10">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold tracking-tight text-foreground">
              Continue learning
            </h2>
            <NuxtLink
              to="/courses"
              class="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              All courses
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
          <div
            v-if="continueLearning.length === 0"
            class="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground"
          >
            Nothing in progress. Add a lesson and start a quiz to see picks here.
          </div>
          <ul v-else class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <li v-for="card in continueLearning" :key="card.video_id">
              <NuxtLink
                :to="lessonHref(card)"
                class="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
              >
                <span class="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    v-if="card.youtube_id"
                    :src="thumbFor(card.youtube_id)"
                    :alt="card.lesson_title"
                    class="h-full w-full object-cover"
                  >
                  <span class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <PlayCircle class="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-card-foreground">
                    {{ card.lesson_title }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Resume · {{ formatDate(card.last_touched) }}
                  </p>
                </div>
                <ArrowRight class="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Two rails: weak lessons + recent attempts -->
        <div class="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <!-- Improve with reflection -->
          <section>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold tracking-tight text-foreground">
                Improve with reflection
              </h2>
            </div>
            <div
              v-if="lessonsToReview.length === 0"
              class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"
            >
              <CheckCircle2 class="h-5 w-5 text-emerald-500" />
              <p class="text-sm text-muted-foreground">No weak spots right now. Nice work.</p>
            </div>
            <ul v-else class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <li v-for="lesson in lessonsToReview" :key="lesson.video_id">
                <NuxtLink
                  :to="reflectionHref(lesson)"
                  class="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
                >
                  <span
                    class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xs font-bold text-red-600 dark:text-red-400"
                  >
                    {{ Math.round(lesson.score) }}%
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-card-foreground">
                      {{ lesson.lesson_title }}
                    </p>
                    <p class="text-xs text-muted-foreground">Reflect to improve</p>
                  </div>
                  <ArrowRight class="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                </NuxtLink>
              </li>
            </ul>
          </section>

          <!-- Recent attempts -->
          <section>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold tracking-tight text-foreground">
                Recent attempts
              </h2>
              <NuxtLink
                to="/quizzes"
                class="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                All quizzes
                <ArrowRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
            <div
              v-if="recentAttempts.length === 0"
              class="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground"
            >
              No quizzes submitted yet.
            </div>
            <ul v-else class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <li v-for="a in recentAttempts" :key="a.attempt_id">
                <NuxtLink
                  :to="attemptHref(a)"
                  class="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
                >
                  <span
                    class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
                    :class="scoreTone(a.total_score)"
                  >
                    <component
                      :is="attemptIcon(a)"
                      class="h-4 w-4"
                      :class="a.status === 'evaluating' ? 'animate-spin' : ''"
                    />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-card-foreground">
                      {{ a.lesson_title || `Lesson ${a.video_id}` }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ formatDate(a.created_at) }}
                    </p>
                  </div>
                  <span
                    v-if="a.status === 'completed'"
                    class="flex-shrink-0 text-sm font-semibold tabular-nums"
                    :class="scoreTone(a.total_score)"
                  >
                    {{ Math.round(a.total_score) }}%
                  </span>
                  <span
                    v-else
                    class="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize"
                    :class="a.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'"
                  >
                    {{ a.status }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
