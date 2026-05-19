/**
 * @module interfaces/reflection
 * Shared types and constants for the Feynman-technique reflection feature.
 */

/**
 * Grading state of a reflection. Reflections are inserted with
 * status="evaluating" the moment the learner submits; a background job on
 * the backend flips status to "completed" (or "failed") when Gemini returns.
 */
export type ReflectionStatus = 'evaluating' | 'completed' | 'failed';

/**
 * A single Feynman reflection as returned by the course-material service.
 *
 * Score / strengths / gaps / suggested_next_focus / mastered are only populated
 * once status === 'completed'. For 'evaluating' or 'failed' rows the score
 * is 0 and the arrays are empty; the UI should branch on `status` instead
 * of those values.
 */
export interface Reflection {
  id: number;
  video_id: number;
  user_id: number;
  /** The learner's explanation text. */
  body: string;
  /** Grading state — see ReflectionStatus. */
  status: ReflectionStatus;
  /** AI-generated score 0–100. Only meaningful when status === 'completed'. */
  score: number;
  /** Things the learner explained well. Empty until status === 'completed'. */
  strengths: string[];
  /** Concepts that need more work. Empty until status === 'completed'. */
  gaps: string[];
  /** One-sentence next-focus suggestion from the AI. */
  suggested_next_focus: string;
  /** True when score >= MASTERY_THRESHOLD. */
  mastered: boolean;
  word_count: number;
  /** Populated when status === 'failed'. */
  error_message?: string;
  created_at: string;
  /** ISO timestamp when grading finished. Null while evaluating. */
  evaluated_at?: string | null;
}

/**
 * Typed error thrown by submitReflection when the AI service is down.
 */
export interface ReflectionServiceUnavailableError extends Error {
  code: 'service_unavailable';
}

export const REFLECTION_MIN_CHARS = 30;
export const REFLECTION_MAX_CHARS = 3000;
export const MASTERY_THRESHOLD = 85;
