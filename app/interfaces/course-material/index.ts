/**
 * @module interfaces/course-material
 * Shared types for the course material detail experience.
 */

/**
 * Lesson resource item (e.g. PDF, link, worksheet).
 */
export interface CourseMaterialResource {
  id: number | string;
  title: string;
  url?: string;
  type?: string;
}

/**
 * Lesson model used by the course material UI.
 */
export interface CourseMaterialLesson {
  id: number | string;
  /** Internal DB primary key (CourseMaterial.video_id). Required to call
   * the takeaway/active-recall endpoints in the Course Material Service. */
  dbVideoId: number | null;
  title: string;
  videoId: string;
  duration: string;
  completed: boolean;
  description?: string;
  resources: CourseMaterialResource[];
}

/**
 * Module model used by the course material UI.
 */
export interface CourseMaterialModule {
  id: number | string;
  title: string;
  completed: boolean;
  lessons: CourseMaterialLesson[];
}

/**
 * Course detail model used by the course material UI.
 */
export interface CourseMaterialCourse {
  id: number | string;
  title: string;
  description: string;
  thumbnail?: string;
  progress: number;
  modules: CourseMaterialModule[];
}

/**
 * Active tab names in the detail view.
 */
export type CourseMaterialTab = 'playlist' | 'description' | 'resources';

/**
 * Active video metadata shown in the player panel.
 */
export interface CurrentVideoState {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  module: string;
  /** YouTube video description for the currently selected lesson. */
  description: string;
}
