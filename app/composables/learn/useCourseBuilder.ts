import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { FileText, Presentation, PlayCircle, Link2 } from 'lucide-vue-next'
import { useLearn, apiError, type CreatorView, type Material, type MaterialKind } from '~/composables/learn/useLearn'

/** The three steps of building a course (StepShell shows them). */
export const BUILD_STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'organise', label: 'Organise' },
  { key: 'review', label: 'Review' },
] as const
export type BuildStep = (typeof BUILD_STEPS)[number]['key']

export const kindIcon: Record<MaterialKind, any> = { pdf: FileText, slides: Presentation, video: PlayCircle, link: Link2 }
/** ids with the item at index moved by delta (-1 up, +1 down); null at the ends. */
export function moved(ids: number[], index: number, delta: number): number[] | null {
  const j = index + delta
  if (j < 0 || j >= ids.length) return null
  const out = [...ids]
  const [item] = out.splice(index, 1)
  out.splice(j, 0, item as number)
  return out
}

export const sizeLabel = (b?: number) => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`) : '')

/**
 * Loads a course for its creator and keeps it fresh while the AI works.
 * Each step page calls this once; actions reload the course after they run.
 */
export function useCourseBuilder(courseId: number) {
  const api = useLearn()
  const view = ref<CreatorView | null>(null)
  const loading = ref(true)
  const loadError = ref('')
  const notice = ref<{ kind: 'error' | 'ok'; text: string } | null>(null)

  const course = computed(() => view.value?.course)
  const materials = computed(() => view.value?.materials ?? [])
  const units = computed(() => view.value?.units ?? [])
  const limits = computed(() => view.value?.limits)
  const progress = computed(() => view.value?.progress ?? null)
  const isPublished = computed(() => course.value?.course_status === 'published')

  const flash = (kind: 'error' | 'ok', text: string) => {
    notice.value = { kind, text }
    if (kind === 'ok') setTimeout(() => { if (notice.value?.text === text) notice.value = null }, 4000)
  }

  const load = async (quiet = false) => {
    if (!quiet) loading.value = true
    try {
      const v = await api.course(courseId)
      if (v.role !== 'creator') {
        await navigateTo(`/learn/${courseId}`)
        return
      }
      view.value = v
      loadError.value = ''
    } catch (e) {
      if (!quiet) loadError.value = apiError(e, 'Could not load this course.')
    } finally {
      loading.value = false
    }
  }

  /** Runs an action, then reloads; errors are shown as a notice. */
  const run = async (action: () => Promise<unknown>, ok?: string) => {
    try {
      await action()
      await load(true)
      if (ok) flash('ok', ok)
      return true
    } catch (e) {
      flash('error', apiError(e))
      return false
    }
  }

  // Refresh every 3 s while the AI is reading, organising or searching
  const busy = computed(() =>
    materials.value.some((m) => m.status === 'processing' || m.reading) || course.value?.organise_status === 'processing' ||
    course.value?.references_status === 'processing' || !!progress.value?.active)
  let poll: ReturnType<typeof setInterval> | undefined
  watch(busy, (b) => {
    clearInterval(poll)
    if (b) poll = setInterval(() => load(true), 3000)
  })
  onMounted(() => load())
  onBeforeUnmount(() => clearInterval(poll))

  // ── organising ──────────────────────────────────────────────────────────
  const readyCount = computed(() => materials.value.filter((m) => m.status === 'ready').length)
  const runsLeft = computed(() => Math.max(0, (limits.value?.organise_runs_per_course ?? 0) - (course.value?.organise_runs ?? 0)))
  const aiBlocked = computed(() =>
    view.value?.ai_allowance && !view.value.ai_allowance.can_use_ai ? view.value.ai_allowance.message || 'Your AI allowance is used up for now.' : '')
  /** Why "Organise" can't run now ('' when it can). */
  const organiseBlocked = computed(() => {
    if (isPublished.value && units.value.length) return 'Move the course back to draft to organise it again.'
    if (materials.value.some((m) => m.status === 'processing')) return 'Wait until every material has been read.'
    if (!readyCount.value) return 'Add at least one material first.'
    if (!runsLeft.value) return 'You have used all AI organise runs for this course. You can still edit units by hand.'
    if (aiBlocked.value) return aiBlocked.value
    return ''
  })

  const removeMaterial = async (m: Material) => {
    if (!confirm(`Remove "${m.title}" from this course?`)) return
    await run(() => api.deleteMaterial(m.id))
  }
  const retry = (m: Material) => run(() => api.retryMaterial(m.id))

  return {
    api, view, loading, loadError, notice, flash, load, run,
    course, materials, units, limits, progress, isPublished, busy,
    readyCount, runsLeft, aiBlocked, organiseBlocked,
    removeMaterial, retry,
  }
}
