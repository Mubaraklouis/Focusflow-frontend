<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  SkipForward,
  X,
} from 'lucide-vue-next';
import { useLessonQuiz } from '~/composables/course-material/useLessonQuiz';
import QuizMcqStep from '~/components/course-material/quiz/QuizMcqStep.vue';
import QuizWritingStep from '~/components/course-material/quiz/QuizWritingStep.vue';
import QuizReflectionStep from '~/components/course-material/quiz/QuizReflectionStep.vue';

/**
 * @module components/course-material/LessonQuizDialog
 *
 * US-026 — distraction-free, irreversible 7-step quiz modal.
 *
 *   1..3  MCQ        (locked once Next is pressed)
 *   4..6  Writing    (locked once Next is pressed)
 *   7     Reflection (US-001 takeaway)
 *
 * After step 7 submits, the dialog closes and the composable navigates the
 * router to /courses/quiz/<attemptId>, where evaluation runs asynchronously
 * on the backend and the page polls for results. No more in-modal
 * evaluating / results screens.
 *
 * Visual design notes:
 *   - Generous whitespace, single-purpose body per step.
 *   - Hairline progress bar matches the detail-page chrome.
 *   - Footer copy is one line of plain English ("Answers can't be changed").
 *   - "Try again" / "Continue with takeaway" only appear on the unavailable
 *     state, never as accidental escape hatches mid-flow.
 */

type QuizComposable = ReturnType<typeof useLessonQuiz>;

const props = defineProps<{ quiz: QuizComposable }>();

const emit = defineEmits<{
  /** Learner explicitly chose to skip the quiz and use the takeaway flow. */
  (e: 'fallback-requested'): void;
}>();

const {
  isOpen,
  lessonTitle,
  dbVideoId,
  currentStep,
  progressPercent,
  totalSteps,
  answers,
  takeaway,
  error,
  unavailable,
  unavailableReason,
  isLoadingQuestions,
  isSubmitting,
  currentQuestion,
  isMcqStep,
  isWritingStep,
  isTakeawayStep,
  canAdvance,
  primaryLabel,
  next,
  submit,
  retry,
  close,
  setAnswer,
} = props.quiz;

const showConfirmClose = ref<boolean>(false);

const isRetryable = computed(() => {
  const r = unavailableReason.value;
  return r === 'service_busy' || r === 'generation_failed' || r === null;
});

const requestClose = () => {
  if (isLoadingQuestions.value || unavailable.value) {
    finaliseClose();
    return;
  }
  showConfirmClose.value = true;
};

const finaliseClose = () => {
  showConfirmClose.value = false;
  close();
};

const requestFallback = () => {
  close();
  emit('fallback-requested');
};

const onPrimary = () => {
  if (isSubmitting.value) return;
  if (isTakeawayStep.value) {
    submit();
    return;
  }
  next();
};

const positionLabel = (q: typeof currentQuestion.value) => {
  if (!q) return '';
  if (q.question_type === 'mcq') return `Question ${q.position} of 3`;
  return `Prompt ${q.position - 3} of 3`;
};

const currentAnswer = () => answers.value[currentStep.value] ?? '';
</script>

<template>
  <Dialog :open="isOpen" @update:open="(v) => (v ? null : requestClose())">
    <DialogContent class="overflow-hidden p-0 sm:max-w-2xl">
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="px-6 pb-4 pt-5">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Lesson quiz
            </p>
            <DialogTitle class="mt-0.5 line-clamp-1 text-lg font-semibold leading-tight">
              {{ lessonTitle || 'Lesson quiz' }}
            </DialogTitle>
            <DialogDescription class="mt-0.5 text-xs leading-relaxed">
              Three multiple-choice, three short answers, one reflection.
              Answers can't be changed once submitted.
            </DialogDescription>
          </div>
          <DialogClose
            class="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </DialogClose>
        </div>

        <!-- Hairline progress bar -->
        <div class="mt-5 flex items-center gap-3">
          <div class="h-0.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <span class="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {{ currentStep }} / {{ totalSteps }}
          </span>
        </div>
      </div>

      <!-- Subtle divider -->
      <div class="mx-6 border-b border-border/40 dark:border-white/[0.06]" />

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div class="min-h-[320px] px-6 py-6">
        <!-- Loading questions -->
        <div
          v-if="isLoadingQuestions"
          class="flex flex-col items-center justify-center gap-4 py-10 text-center"
        >
          <div class="relative">
            <div class="h-12 w-12 rounded-full bg-primary/10" />
            <Loader2 class="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
          </div>
          <div class="max-w-sm space-y-1">
            <p class="text-sm font-medium text-card-foreground">
              Loading your quiz…
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">
              Questions are usually pre-generated while you're watching — this
              should be instant.
            </p>
          </div>
        </div>

        <!-- Unavailable: clear cause, Retry + Continue-with-takeaway -->
        <div
          v-else-if="unavailable"
          class="flex flex-col items-center justify-center gap-5 py-8 text-center"
        >
          <div class="rounded-full bg-destructive/10 p-3">
            <AlertTriangle class="h-5 w-5 text-destructive" />
          </div>
          <div class="max-w-md space-y-1.5">
            <p class="text-sm font-medium text-card-foreground">
              Quiz unavailable for this lesson
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">
              {{ error || 'We could not generate a quiz for this lesson.' }}
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Button v-if="isRetryable" variant="outline" class="gap-2" @click="retry">
              <RefreshCw class="h-4 w-4" />
              Try again
            </Button>
            <Button class="gap-2" @click="requestFallback">
              <SkipForward class="h-4 w-4" />
              Continue with takeaway only
            </Button>
          </div>
        </div>

        <!-- Generic error (non-503) -->
        <div
          v-else-if="error"
          class="rounded-lg bg-destructive/5 p-4 text-sm text-destructive"
        >
          {{ error }}
        </div>

        <!-- Steps 1..6 (questions) -->
        <QuizMcqStep
          v-else-if="isMcqStep && currentQuestion"
          :question="currentQuestion"
          :position-label="positionLabel(currentQuestion)"
          :selected="currentAnswer()"
          @update:selected="(value) => setAnswer(currentStep, value)"
        />

        <QuizWritingStep
          v-else-if="isWritingStep && currentQuestion"
          :question="currentQuestion"
          :position-label="positionLabel(currentQuestion)"
          :body="currentAnswer()"
          @update:body="(value) => setAnswer(currentStep, value)"
        />

        <!-- Step 7 (takeaway) -->
        <QuizReflectionStep
          v-else-if="isTakeawayStep"
          :body="takeaway"
          :db-video-id="dbVideoId"
          :lesson-title="lessonTitle"
          @update:body="(value) => (takeaway = value)"
        />
      </div>

      <!-- ── Footer ─────────────────────────────────────────────────────── -->
      <div
        v-if="!isLoadingQuestions && !unavailable"
        class="flex items-center justify-between gap-3 border-t border-border/40 bg-muted/30 px-6 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
      >
        <p class="text-[11px] uppercase tracking-wider text-muted-foreground">
          Answers can't be changed once submitted
        </p>

        <Button
          :disabled="!canAdvance || isSubmitting"
          class="gap-2"
          @click="onPrimary"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <CheckCircle2 v-else-if="isTakeawayStep" class="h-4 w-4" />
          <ArrowRight v-else class="h-4 w-4" />
          <span>{{ isSubmitting ? 'Submitting…' : primaryLabel }}</span>
        </Button>
      </div>
    </DialogContent>

    <!-- Confirm-discard sub-dialog -->
    <Dialog :open="showConfirmClose" @update:open="(v) => (showConfirmClose = v)">
      <DialogContent class="p-6 sm:max-w-md">
        <DialogTitle>Discard quiz progress?</DialogTitle>
        <DialogDescription class="mt-2 text-sm">
          Your in-progress answers will be lost. The lesson will not be marked
          complete.
        </DialogDescription>
        <div class="mt-5 flex justify-end gap-2">
          <Button variant="ghost" @click="showConfirmClose = false">
            Keep going
          </Button>
          <Button variant="destructive" @click="finaliseClose">
            Discard and close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </Dialog>
</template>
