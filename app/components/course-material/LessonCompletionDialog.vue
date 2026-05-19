<script setup lang="ts">
import { computed } from 'vue';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-vue-next';

/**
 * @module components/course-material/LessonCompletionDialog
 * US-001 active-recall gate. Presents a modal asking the learner to write a
 * short takeaway in their own words before a lesson is marked complete.
 * Re-opened on a completed lesson, the dialog shows the prior takeaway in
 * read-only mode.
 */

const props = defineProps<{
  open: boolean;
  /** Display title of the lesson, e.g. "Goroutines and Channels". */
  lessonTitle: string;
  /** Currently bound textarea value. */
  body: string;
  /** Whether the textarea passes the min/max length validation. */
  isValid: boolean;
  /** Counter / "N more characters required" hint shown under the textarea. */
  hint: string;
  /** True while the POST is in flight. */
  isSubmitting: boolean;
  /** Read-only mode for previously completed lessons. */
  isReadOnly: boolean;
  /** Server / validation error message. */
  error: string | null;
  /** Minimum required characters (surfaced in helper text). */
  minChars: number;
  /** Maximum allowed characters (surfaced in helper text). */
  maxChars: number;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:body', value: string): void;
  (e: 'submit'): void;
}>();

const handleOpenChange = (value: boolean) => {
  emit('update:open', value);
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:body', target.value);
};

const handleSubmit = () => {
  if (!props.isValid || props.isSubmitting || props.isReadOnly) return;
  emit('submit');
};

const headerLabel = computed(() =>
  props.isReadOnly ? 'Your previous takeaway' : 'Active recall',
);
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="p-6 sm:max-w-xl">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Sparkles class="h-4 w-4 text-primary" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-primary">
              {{ headerLabel }}
            </p>
            <DialogTitle class="text-lg leading-tight">
              {{ lessonTitle || 'This lesson' }}
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

      <!-- Prompt -->
      <DialogDescription class="mt-4 text-sm">
        <template v-if="isReadOnly">
          You completed this lesson earlier. Here is the takeaway you wrote then.
          Edit the lesson from the player to revise.
        </template>
        <template v-else>
          Before marking this lesson complete, summarise the key point of this
          lesson in your own words. Even a single sentence retrieved from memory
          significantly improves long-term retention.
        </template>
      </DialogDescription>

      <!-- Textarea -->
      <div class="mt-4">
        <label class="sr-only" for="takeaway-body">Your takeaway</label>
        <textarea
          id="takeaway-body"
          :value="body"
          :disabled="isReadOnly || isSubmitting"
          rows="6"
          placeholder="In one or two sentences, what did this lesson teach you?"
          class="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
          @input="handleInput"
        />
        <div class="mt-1.5 flex items-center justify-between text-xs">
          <span
            class="text-muted-foreground"
            :class="{ 'text-destructive': !isValid && body.length > 0 && !isReadOnly }"
          >
            {{ hint }}
          </span>
          <span class="text-muted-foreground">
            min {{ minChars }} / max {{ maxChars }} chars
          </span>
        </div>

        <p
          v-if="error"
          class="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {{ error }}
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <DialogClose as-child>
          <Button variant="ghost" :disabled="isSubmitting">
            {{ isReadOnly ? 'Close' : 'Cancel' }}
          </Button>
        </DialogClose>
        <Button
          v-if="!isReadOnly"
          :disabled="!isValid || isSubmitting"
          class="gap-2"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <CheckCircle2 v-else class="h-4 w-4" />
          {{ isSubmitting ? 'Submitting…' : 'Submit and mark complete' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
