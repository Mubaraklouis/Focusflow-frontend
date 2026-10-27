/**
 * Course builder and learner flow (FEATURES.md step 1).
 * Calls go through /api/learn/** (server/api/learn); file uploads go
 * straight to the FocusFlow API with a short-lived signed token.
 */

export type MaterialKind = 'pdf' | 'slides' | 'video' | 'link'
export type JobStatus = 'idle' | 'processing' | 'ready' | 'failed'

export interface Digest {
  summary: string
  topics: string[] | null
  key_points: string[] | null
  concepts?: { name: string; summary: string; pages: number[] | null; slides: number[] | null }[] | null
}

export interface Material {
  id: number
  course_id: number
  kind: MaterialKind
  title: string
  url: string
  youtube_id?: string
  size_bytes?: number
  status: JobStatus | 'paused'
  position?: number
  error?: string
  digest: Digest
  /** Long PDFs are read in parts: pages read so far, and whether the rest is still being read. */
  total_pages?: number
  read_pages?: number
  reading?: boolean
  /** later parts wait for the creator's AI allowance */
  paused?: boolean
  /** Long videos are watched in parts (seconds). */
  total_seconds?: number
  read_seconds?: number
  created_at: string
}

/** Slides as written (F3.1): one page per slide, the teacher's text word for word. */
export interface SlideRun { text: string; bold?: boolean; italic?: boolean; code?: boolean; link?: string }
export interface SlideLine { level: number; bullet: boolean; runs: SlideRun[] }
export interface SlideBlock {
  type: 'text' | 'code' | 'image' | 'table' | 'diagram'
  lines?: SlideLine[]
  code?: string
  src?: string
  alt?: string
  rows?: string[][]
  header?: boolean
}
export interface SlidePage {
  id: number
  material_id: number
  /** position in the presentation, from 1 */
  number: number
  title: string
  section?: string
  blocks: SlideBlock[]
  notes?: string
  hidden: boolean
  /** drawn diagram, SmartArt or chart: learners are pointed to the original slide */
  has_diagram: boolean
}

export interface AnswerIn { index: number; choice?: number | null; choices?: number[]; answer?: string }

export const QUESTION_KINDS: { v: QuestionKind; label: string }[] = [
  { v: 'mcq', label: 'One answer' }, { v: 'multi', label: 'Several answers' }, { v: 'truefalse', label: 'True or false' },
  { v: 'short', label: 'Short answer' }, { v: 'explain', label: 'Written answer' },
]
export const QUIZ_LEVELS: { v: Exclude<QuizLevel, 'custom'>; label: string; note: string }[] = [
  { v: 'practice', label: 'Practice', note: 'No timer, unlimited tries, answers shown after each question. Never blocks.' },
  { v: 'standard', label: 'Standard', note: '3 attempts, answers shown once passed or out of tries. Blocks the next unit until passed.' },
  { v: 'strict', label: 'Strict', note: 'Timer with auto-submit, 2 attempts, no going back, tab and paste tracking, you review the marks.' },
  { v: 'supervised', label: 'Supervised exam', note: 'Strict, plus an access code you give out in the room and follow-up questions on answers.' },
]

/** Seconds as m:ss or h:mm:ss. */
export const clock = (sec = 0) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** A long PDF whose reading stopped before the end (Retry continues it). */
export const partlyRead = (m: Material) =>
  m.status === 'ready' && !m.reading &&
  ((!!m.read_pages && !!m.total_pages && m.read_pages < m.total_pages) ||
   (!!m.read_seconds && !!m.total_seconds && m.read_seconds < m.total_seconds))

/** Where a concept can be checked, with a link that opens at the right place. */
export interface ConceptSource {
  material_id: number
  pages?: number[]
  slides?: number[]
  start_seconds?: number
  title: string
  kind: MaterialKind
  url: string
  hint: string
  youtube_id?: string
}

/** An outside resource to expand knowledge (found by web search). */
export interface Reference {
  title: string
  url: string
  site: string
  why: string
}

export interface Concept {
  id: number
  unit_id: number
  position: number
  title: string
  explanation: string
  sources: ConceptSource[]
  references: Reference[] | null
}

export interface Unit {
  id: number
  course_id: number
  position: number
  title: string
  body: string
  source: 'ai' | 'manual'
  locked?: boolean
  completed?: boolean
  materials?: Material[]
  concepts?: Concept[]
  concept_names?: string[]
  /** slides as written: the slide ranges this unit reads */
  slides?: SlideRange[]
  /** lesson, or quiz: a test placed anywhere in the course (F2.2) */
  kind?: 'lesson' | 'quiz'
  /** quiz: lessons it covers (empty = every lesson before it) */
  covers?: number[]
  final?: boolean
  /** practice or not-ready quizzes never block the next unit */
  optional?: boolean
  test?: TestSummary | null
}

// ── Quizzes (FEATURES.md M2) ───────────────────────────────────────────────
export type QuestionKind = 'mcq' | 'multi' | 'truefalse' | 'short' | 'explain'
export type QuizLevel = 'practice' | 'standard' | 'strict' | 'supervised' | 'custom'
export type ShowAnswers = 'after_question' | 'when_finished' | 'after_submit' | 'after_close' | 'never'
export interface Question {
  id: number
  unit_id: number
  kind: QuestionKind
  prompt: string
  options: string[]
  correct: number
  corrects?: number[]
  answer_guide: string
  concept: string
  source: 'ai' | 'edited' | 'manual'
}
export interface TestSettings {
  unit_id: number
  enabled: boolean
  questions_per_test: number
  pass_mark: number
  time_limit_minutes: number
  max_attempts: number
  teacher_review: boolean
  track_tab: boolean
  track_paste: boolean
  pool_status: JobStatus
  pool_error?: string
  pool_runs: number
  level: QuizLevel
  practice: boolean
  show_answers: ShowAnswers
  all_on_one_page: boolean
  no_back: boolean
  opens_at: string | null
  closes_at: string | null
  access_code?: string
  explain_answers: boolean
  camera: boolean
}
export interface TestSummary { enabled: boolean; questions?: number; pool_status?: string; pending_reviews?: number; passed?: boolean }
export interface CreatorTest { role: 'creator'; unit: Unit; settings: TestSettings; questions: Question[]; ai_available: boolean }
export interface LearnerSettings {
  questions: number; pass_mark: number; time_limit_minutes: number; max_attempts: number; teacher_review: boolean
  track_tab: boolean; track_paste: boolean; level: QuizLevel; practice: boolean; show_answers: ShowAnswers
  all_on_one_page: boolean; no_back: boolean; opens_at: string | null; closes_at: string | null
  needs_code: boolean; explain_answers: boolean; camera: boolean
}
export interface LearnerItem {
  kind: QuestionKind; prompt: string; options?: string[]; choice: number | null; choices?: number[]; answer: string
  mark?: number | null; feedback?: string; teacher_note?: string; correct?: number; corrects?: number[]; answer_guide?: string
}
export interface LearnerAttempt {
  id: number; unit_id: number; number: number
  status: 'in_progress' | 'marking' | 'explain' | 'review' | 'done'
  items: LearnerItem[]; started_at: string; deadline: string | null; submitted_at: string | null; auto_submitted: boolean
  score_percent: number | null; passed: boolean; pass_mark: number; track_tab: boolean; track_paste: boolean
  all_on_one_page: boolean; no_back: boolean; show_answers: ShowAnswers; camera: boolean
  followups?: { question: string; answer: string }[]; message?: string; server_time: string
}
export interface LearnerTest {
  role: 'learner'; unit: { id: number; title: string; course_id: number }; settings: LearnerSettings
  attempts: LearnerAttempt[]; can_start: boolean; reason: string; in_progress_attempt_id: number | null
}
export interface AttemptRow {
  id: number; unit_id: number; unit_title: string; learner_id: number; learner_name: string; number: number
  status: string; score_percent: number; passed: boolean; submitted_at: string | null; auto_submitted: boolean
  evidence: Record<string, number>; mark_error?: string; consistency?: string; snapshots?: number
}
export interface ImportResult { questions: Question[]; errors: { line: number; message: string }[]; saved: number }
export interface Certificate { code: string; course_id: number; learner_name: string; course_title: string; creator_name: string; final_score?: number; issued_at: string }

export interface SlideRange { material_id: number; first_page: number; last_page: number; /** slides learners see */ count?: number }
/** One deck of a unit with the slides the unit reads (hidden slides left out). */
export interface UnitDeck { material_id: number; title: string; url: string; first_page: number; last_page: number; pages: SlidePage[] }
export type BuildMode = 'ai' | 'slides'

export interface LearnCourse {
  course_id: number
  course_title: string
  course_description: string
  course_thumb: string
  course_category_id: number
  category?: { category_id: number; category_name: string }
  user_id: number
  course_visibility: 'public' | 'private'
  course_language: string
  course_status: 'draft' | 'published'
  /** slides = "use my slides as written"; ai = "let AI write lessons" */
  build_mode?: BuildMode
  published_at: string | null
  organise_status: JobStatus
  organise_error?: string
  /** The run in progress only adds units for newly read pages. */
  organise_more?: boolean
  organise_runs: number
  references_status: JobStatus
  units?: number
  learners?: number
}

export interface Limits {
  courses_per_user: number
  materials_per_course: number
  max_file_bytes: number
  organise_runs_per_course: number
}

/** A creator's AI allowance: what share is used today and this month. */
export interface AIAllowance {
  unlimited: boolean
  can_use_ai: boolean
  message?: string
  windows: { period: 'day' | 'month'; used_percent: number; resets_at: string }[]
}

/** How far the AI is with building a course in the background. */
export interface BuildProgress {
  active: boolean
  percent: number
  stage: 'reading' | 'organising' | 'adding' | 'references' | 'ready' | 'waiting' | 'failed'
  label: string
  more: boolean
  later: boolean
}

export interface CreatorView {
  role: 'creator'
  course: LearnCourse
  materials: Material[]
  units: Unit[]
  learners: number
  limits: Limits
  ai_allowance?: AIAllowance
  progress?: BuildProgress | null
}

export interface LearnerView {
  role: 'learner'
  course: LearnCourse
  units: Unit[]
  enrolled: boolean
  completed_units: number
  total_units: number
  more_coming?: boolean
  /** issued when every required unit is done (F2.6) */
  certificate?: Certificate | null
}

export interface MyLearning {
  created: LearnCourse[]
  joined: { course: LearnCourse; completed_units: number; total_units: number }[]
  limits: Limits
  can_create_course: boolean
  create_limit_reason: string
  ai_allowance?: AIAllowance
  progress?: Record<string, BuildProgress | null>
  /** card image per course id (first YouTube thumbnail) */
  covers?: Record<string, string>
}

export interface Category {
  category_id: number
  category_name: string
  description: string
}

/** The API's message from a failed $fetch, for showing to the user. */
export function apiError(e: any, fallback = 'Something went wrong. Please try again.'): string {
  return e?.data?.data?.message || e?.data?.message || e?.data?.data?.error || e?.message || fallback
}

export function useLearn() {
  const get = <T>(path: string, query?: Record<string, any>) =>
    $fetch<{ data: T }>(`/api/learn/${path}`, { query }).then((r) => r.data)
  const send = <T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: any) =>
    $fetch<{ data: T; message?: string }>(`/api/learn/${path}`, { method, body })

  return {
    me: () => get<MyLearning>('me'),
    browse: (q?: string) => get<(LearnCourse & { units: number; learners: number; cover?: string })[]>('browse', q ? { q } : undefined),
    categories: () => get<Category[]>('categories'),
    course: (id: number) => get<CreatorView | LearnerView>(`courses/${id}`),
    unit: (uid: number) => get<Unit>(`units/${uid}`),

    addLink: (id: number, body: { kind: 'video' | 'link'; url: string; title: string; note?: string }) =>
      send<Material>('POST', `courses/${id}/materials`, body),
    deleteMaterial: (mid: number) => send('DELETE', `materials/${mid}`),
    renameMaterial: (mid: number, title: string) => send<Material>('PUT', `materials/${mid}`, { title }),
    reorderMaterials: (id: number, materialIds: number[]) =>
      send<Material[]>('PUT', `courses/${id}/materials/order`, { material_ids: materialIds }),
    retryMaterial: (mid: number) => send('POST', `materials/${mid}/retry`),
    // quizzes
    test: (uid: number) => get<CreatorTest | LearnerTest>(`units/${uid}/test`),
    updateTest: (uid: number, body: Partial<Omit<TestSettings, 'opens_at' | 'closes_at'>> & { opens_at?: string; closes_at?: string; new_access_code?: boolean }) =>
      send<TestSettings>('PUT', `units/${uid}/test`, body),
    addQuestion: (uid: number, q: Partial<Question>) => send<Question>('POST', `units/${uid}/questions`, q),
    updateQuestion: (qid: number, q: Partial<Question>) => send<Question>('PUT', `questions/${qid}`, q),
    deleteQuestion: (qid: number) => send('DELETE', `questions/${qid}`),
    generateQuestions: (uid: number) => send('POST', `units/${uid}/questions/generate`),
    importQuestions: (uid: number, format: 'csv' | 'gift' | 'aiken', text: string, save: boolean) =>
      send<ImportResult>('POST', `units/${uid}/questions/import`, { format, text, save }),
    createQuiz: (id: number, body: { title?: string; after_unit_id?: number; covers?: number[]; final?: boolean; practice?: boolean }) =>
      send<Unit>('POST', `courses/${id}/quizzes`, body),
    updateQuiz: (uid: number, body: { title?: string; covers?: number[] }) => send<Unit>('PUT', `units/${uid}/quiz`, body),
    startTest: (uid: number, accessCode?: string) => send<LearnerAttempt>('POST', `units/${uid}/test/start`, accessCode ? { access_code: accessCode } : {}),
    attempt: (aid: number) => get<any>(`attempts/${aid}`),
    saveAnswers: (aid: number, answers: AnswerIn[]) => send('PUT', `attempts/${aid}/answers`, { answers }),
    submitTest: (aid: number, answers: AnswerIn[]) => send<LearnerAttempt>('POST', `attempts/${aid}/submit`, { answers }),
    logEvents: (aid: number, events: string[]) => send('POST', `attempts/${aid}/events`, { events }),
    checkAnswer: (aid: number, index: number) => send<{ index: number; correct?: number; corrects?: number[]; right?: boolean; answer_guide?: string }>('POST', `attempts/${aid}/check`, { index }),
    explain: (aid: number, answers: string[]) => send<LearnerAttempt>('POST', `attempts/${aid}/explain`, { answers }),
    courseAttempts: (id: number, status: 'review' | 'done' | 'marking' | 'all' = 'review') => get<AttemptRow[]>(`courses/${id}/attempts`, { status }),
    reviewAttempt: (aid: number, marks: { index: number; mark: number; note?: string }[]) => send('POST', `attempts/${aid}/review`, { marks }),
    certificate: (code: string) => $fetch<{ data: Certificate }>(`/api/certificates/${encodeURIComponent(code)}`).then((r) => r.data),

    slidePages: (mid: number) => get<{ material_id: number; pages: SlidePage[] }>(`materials/${mid}/pages`),
    unitPages: (uid: number) => get<UnitDeck[]>(`units/${uid}/pages`),
    setBuildMode: (id: number, mode: BuildMode) => send<LearnCourse>('PUT', `courses/${id}/build-mode`, { build_mode: mode }),
    saveSlideUnits: (id: number, units: { id?: number; title: string; material_id: number; first_page: number; last_page: number }[]) =>
      send<{ id: number; title: string; slides: SlideRange[] }[]>('PUT', `courses/${id}/slide-units`, { units }),

    organise: (id: number) => send('POST', `courses/${id}/organise`),
    addUnit: (id: number, title: string, body = '') => send<Unit>('POST', `courses/${id}/units`, { title, body }),
    updateUnit: (uid: number, body: { title?: string; body?: string; material_ids?: number[] }) =>
      send<Unit>('PUT', `units/${uid}`, body),
    deleteUnit: (uid: number) => send('DELETE', `units/${uid}`),
    reorderUnits: (id: number, unitIds: number[]) => send<Unit[]>('PUT', `courses/${id}/units/order`, { unit_ids: unitIds }),

    addConcept: (uid: number, title: string, explanation = '') =>
      send<Concept>('POST', `units/${uid}/concepts`, { title, explanation }),
    findReferences: (id: number) => send('POST', `courses/${id}/references`),
    updateConcept: (cid: number, body: { title?: string; explanation?: string; keep_reference_urls?: string[] }) =>
      send<Concept[]>('PUT', `concepts/${cid}`, body),
    deleteConcept: (cid: number) => send('DELETE', `concepts/${cid}`),
    reorderConcepts: (uid: number, conceptIds: number[]) =>
      send<Concept[]>('PUT', `units/${uid}/concepts/order`, { concept_ids: conceptIds }),

    publish: (id: number, visibility: 'public' | 'private', confirmRights: boolean) =>
      send<LearnCourse>('POST', `courses/${id}/publish`, { visibility, confirm_rights: confirmRights }),
    unpublish: (id: number) => send<LearnCourse>('POST', `courses/${id}/unpublish`),

    join: (id: number) => send('POST', `courses/${id}/join`),
    completeUnit: (uid: number) =>
      $fetch<{ completed_units: number; total_units: number; course_completed: boolean }>(`/api/learn/units/${uid}/complete`, { method: 'POST' }),

    /** Uploads a PDF or .pptx straight to the API (bypasses Vercel's body limit). */
    async uploadFile(id: number, file: File, title?: string): Promise<Material> {
      const { data: target } = await $fetch<{ data: { url: string; token: string; max_bytes: number } }>(
        `/api/learn/courses/${id}/upload-url`, { method: 'POST' })
      if (file.size > target.max_bytes) {
        throw new Error(`This file is too large. The limit is ${Math.round(target.max_bytes / 1048576)} MB.`)
      }
      const form = new FormData()
      form.append('file', file)
      if (title) form.append('title', title)
      const res = await fetch(target.url, { method: 'POST', body: form, headers: { 'X-Upload-Token': target.token } })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || 'Upload failed. Please try again.')
      return json.data as Material
    },
  }
}

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'ar', name: 'العربية' },
]

export const kindLabel: Record<MaterialKind, string> = {
  pdf: 'PDF notes',
  slides: 'Slides',
  video: 'Video',
  link: 'Web link',
}
