/**
 * @module interfaces/dashboard
 * Shared types for the learner dashboard.
 */

import type { AttemptStatus } from '~/interfaces/lesson-quiz';

export interface DashboardStats {
  courses_count: number;
  lessons_completed_count: number;
  average_quiz_score: number;
  current_streak_days: number;
}

export interface DashboardLessonCard {
  video_id: number;
  course_id: string;
  lesson_title: string;
  youtube_id: string;
  completed: boolean;
  last_touched: string;
}

export interface DashboardWeakLesson {
  attempt_id: number;
  video_id: number;
  course_id: string;
  lesson_title: string;
  score: number;
  created_at: string;
}

export interface DashboardAttemptCard {
  attempt_id: number;
  video_id: number;
  course_id: string;
  lesson_title: string;
  status: AttemptStatus;
  total_score: number;
  created_at: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  continue_learning: DashboardLessonCard[];
  lessons_to_review: DashboardWeakLesson[];
  recent_attempts: DashboardAttemptCard[];
}
