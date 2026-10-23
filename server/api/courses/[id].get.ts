import { apiFetch } from '~~/server/util/api'

/**
 * GET /api/courses/:id → course detail plus its lessons, grouped into
 * modules for the normalizeCourseMaterial composable:
 *   { ...course, modules: [{ id, title, lessons: [...] }] }
 */
interface CourseMaterialRow {
  video_id: number
  course_id: string
  youtube_id: string
  title: string
  description: string
  duration: string
  lesson_id: string
  thumbnail_url: string
  completed: boolean
  module_title?: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Course id is required' })

  const course = await apiFetch<Record<string, any>>(event, `/api/course/${id}`)

  // Lessons need a signed-in user; a visitor (or a brand-new course) gets none
  let materials: CourseMaterialRow[] = []
  try {
    const res = await apiFetch<{ data: CourseMaterialRow[] }>(event, `/api/course-materials/course/${id}`)
    materials = Array.isArray(res?.data) ? res.data : []
  } catch (error: any) {
    if (error?.statusCode !== 401) console.warn('[courses/[id].get] lessons fetch failed:', error?.message)
  }
  return { ...course, modules: buildModules(materials) }
})

/** Groups lessons by module_title, or a single "Lessons" module. */
function buildModules(materials: CourseMaterialRow[]) {
  if (materials.length === 0) return []
  const buckets = new Map<string, CourseMaterialRow[]>()
  for (const m of materials) {
    const key = m.module_title?.trim() || 'Lessons'
    buckets.set(key, [...(buckets.get(key) ?? []), m])
  }
  let i = 0
  return Array.from(buckets.entries()).map(([title, lessons]) => ({
    id: `module-${i++}`,
    module_id: `module-${i}`,
    title,
    completed: lessons.length > 0 && lessons.every((l) => l.completed),
    lessons: lessons.map((l) => ({
      id: l.video_id,
      lesson_id: l.lesson_id || `lesson-${l.video_id}`,
      video_id: l.video_id,
      youtube_id: l.youtube_id,
      title: l.title,
      description: l.description,
      duration: l.duration || '0:00',
      thumbnail_url: l.thumbnail_url,
      completed: !!l.completed,
    })),
  }))
}
