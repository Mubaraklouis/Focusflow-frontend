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
}

export interface Material {
  id: number
  course_id: number
  kind: MaterialKind
  title: string
  url: string
  youtube_id?: string
  size_bytes?: number
  status: JobStatus
  error?: string
  digest: Digest
  created_at: string
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
}

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
  published_at: string | null
  organise_status: JobStatus
  organise_error?: string
  organise_runs: number
  units?: number
  learners?: number
}

export interface Limits {
  courses_per_user: number
  materials_per_course: number
  max_file_bytes: number
  organise_runs_per_course: number
}

export interface CreatorView {
  role: 'creator'
  course: LearnCourse
  materials: Material[]
  units: Unit[]
  learners: number
  limits: Limits
}

export interface LearnerView {
  role: 'learner'
  course: LearnCourse
  units: Unit[]
  enrolled: boolean
  completed_units: number
  total_units: number
}

export interface MyLearning {
  created: LearnCourse[]
  joined: { course: LearnCourse; completed_units: number; total_units: number }[]
  limits: Limits
  can_create_course: boolean
  create_limit_reason: string
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
    browse: (q?: string) => get<(LearnCourse & { units: number; learners: number })[]>('browse', q ? { q } : undefined),
    categories: () => get<Category[]>('categories'),
    course: (id: number) => get<CreatorView | LearnerView>(`courses/${id}`),
    unit: (uid: number) => get<Unit>(`units/${uid}`),

    addLink: (id: number, body: { kind: 'video' | 'link'; url: string; title: string; note?: string }) =>
      send<Material>('POST', `courses/${id}/materials`, body),
    deleteMaterial: (mid: number) => send('DELETE', `materials/${mid}`),
    retryMaterial: (mid: number) => send('POST', `materials/${mid}/retry`),

    organise: (id: number) => send('POST', `courses/${id}/organise`),
    addUnit: (id: number, title: string, body = '') => send<Unit>('POST', `courses/${id}/units`, { title, body }),
    updateUnit: (uid: number, body: { title?: string; body?: string; material_ids?: number[] }) =>
      send<Unit>('PUT', `units/${uid}`, body),
    deleteUnit: (uid: number) => send('DELETE', `units/${uid}`),
    reorderUnits: (id: number, unitIds: number[]) => send<Unit[]>('PUT', `courses/${id}/units/order`, { unit_ids: unitIds }),

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
