/**
 * @module interfaces/lesson-quiz
 * Shared types for the US-026 lesson quiz feature.
 */

export type QuestionType = 'mcq' | 'writing';

/**
 * A question as the learner sees it. Critical: `correct_index` and `rubric`
 * are NEVER populated on this payload — the backend strips them in
 * QuizService.ListForTaking, and the Nitro proxy passes through verbatim.
 */
export interface LessonQuestion {
  id: number;
  video_id: number;
  position: number;
  question_type: QuestionType;
  prompt: string;
  /** MCQ only — array of 4 option strings. */
  options?: string[];
  /** Always undefined on the wire — exists so the type matches the backend struct. */
  correct_index?: number;
  /** Always empty on the wire — same reason. */
  rubric?: string;
  created_at?: string;
}

/**
 * Graded line-item returned in a quiz attempt response. The
 * `question_*` and `correct_option` fields are populated by the backend
 * AFTER an attempt is submitted (joined from `lesson_questions`); they
 * are never exposed during the take-quiz flow.
 */
export interface QuizAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer: string;
  /** MCQ only — null for writing. */
  is_correct?: boolean;
  /** 0..1 */
  score: number;
  /** Gemini-authored feedback for writing answers; empty for MCQ. */
  feedback?: string;
  // Enriched on read (only populated by the results / latest / history endpoints):
  question_prompt?: string;
  question_type?: QuestionType;
  question_options?: string[];
  /** Correct answer text for MCQ; empty for writing. */
  correct_option?: string;
}

export type AttemptStatus = 'evaluating' | 'completed' | 'failed';

/**
 * A graded attempt, returned by the submit endpoint and the polling
 * endpoint. While `status === 'evaluating'`, the writing-answer scores
 * are placeholders — the frontend should poll until `status === 'completed'`
 * (or `'failed'`).
 */
export interface QuizAttempt {
  id: number;
  video_id: number;
  user_id: number;
  takeaway_id?: number;
  set_number?: number;
  status: AttemptStatus;
  error_message?: string;
  /** All scores are on the 0..100 scale, rounded to 2dp. */
  total_score: number;
  mcq_score: number;
  writing_score: number;
  created_at: string;
  updated_at?: string;
  answers: QuizAnswer[];
  /** Enriched on read — backend joins from CourseMaterial. */
  lesson_title?: string;
  course_id?: string;
}

/**
 * Stepper position — drives which sub-component the dialog renders.
 *
 *   1..3 : MCQ           (one per step)
 *   4..6 : Writing       (one per step)
 *   7    : Takeaway      (US-001 reflection)
 *
 * After step 7 submits, the dialog closes and the learner is navigated
 * to /courses/quiz/[attemptId] where evaluation + results are surfaced
 * on a dedicated page. No more in-modal evaluating/results steps.
 */
export type QuizStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Active-recall takeaway validation rules, mirrored from the backend
 * (services.TakeawayService).
 */
export const TAKEAWAY_MIN_CHARS = 30;
export const TAKEAWAY_MAX_CHARS = 1000;

/** Minimum chars for a writing answer below which the backend auto-scores 0. */
export const WRITING_MIN_CHARS = 20;
export const WRITING_MAX_CHARS = 2000;
