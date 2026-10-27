<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, Trash2, Mail, FileUp, AlertCircle } from 'lucide-vue-next'
import { useLearn, apiError, type ClassView, type LearnerRow, type CreatorView } from '~/composables/learn/useLearn'
import FfSwitch from '~/components/learn/quiz/FfSwitch.vue'

// One job: get the class into the course — an invite link, the class list,
// and (for institutions) roster-only joining and results access (M4).
definePageMeta({ layout: false, middleware: ['auth'] })

const courseId = Number(useRoute().params.id)
const api = useLearn()
const course = ref<CreatorView | null>(null)
const v = ref<ClassView | null>(null)
const learners = ref<LearnerRow[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const flash = (t: string) => { notice.value = t; setTimeout(() => { if (notice.value === t) notice.value = '' }, 3500) }

useHead(() => ({ title: `Class · ${course.value?.course.course_title || 'Course'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'My learning', href: '/learn' },
  { title: course.value?.course.course_title || 'Course', href: `/learn/${courseId}/review` },
  { title: 'Class', href: `/learn/${courseId}/class`, current: true },
])

const load = async () => {
  try {
    const [c, cl, ls] = await Promise.all([api.course(courseId), api.classView(courseId), api.learners(courseId)])
    if (c.role !== 'creator') throw new Error('Only the course creator manages its class.')
    course.value = c
    v.value = cl
    learners.value = ls
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
const run = async (fn: () => Promise<any>, ok?: string) => {
  error.value = ''
  try {
    await fn()
    await load()
    if (ok) flash(ok)
  } catch (e) {
    error.value = apiError(e)
  }
}

// invite link
const origin = ref('')
onMounted(() => (origin.value = location.origin))
const link = computed(() => (v.value?.invite.code ? `${origin.value}/join/${v.value.invite.code}` : ''))
const copy = async () => {
  await navigator.clipboard?.writeText(link.value)
  flash('Link copied.')
}

// institution
const pickInst = (e: Event) => {
  const id = Number((e.target as HTMLSelectElement).value)
  run(() => api.updateClass(courseId, { institution_id: id }), id ? 'Added to the institution.' : 'Removed from the institution.')
}

// roster import
const rosterText = ref('')
const preview = ref<{ students: { email: string; name: string }[]; errors: { line: number; message: string }[] } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const check = async () => {
  preview.value = null
  if (!rosterText.value.trim()) return
  try {
    preview.value = (await api.importRoster(courseId, rosterText.value, false)).data
  } catch (e) {
    error.value = apiError(e)
  }
}
const onFile = async (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (/\.xlsx?$/i.test(f.name)) return (error.value = 'Save the spreadsheet as CSV first, then choose that file.')
  rosterText.value = await f.text()
  await check()
}
const saveRoster = () => run(async () => {
  const res = await api.importRoster(courseId, rosterText.value, true)
  rosterText.value = ''
  preview.value = null
  return res
}, 'Class list saved.')
const notJoined = computed(() => (v.value?.roster ?? []).filter((r) => !r.joined).length)
const isPublished = computed(() => course.value?.course.course_status === 'published')
const removeLearner = (l: LearnerRow) => {
  if (confirm(`Remove ${l.name} from the course? Their progress is kept if they join again.`)) run(() => api.removeLearner(courseId, l.user_id))
}
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:pt-10">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">Class</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">Invite learners and manage who is in the course.</p>
      </header>
      <p v-if="notice" role="status" class="mb-4 rounded-2xl bg-green-500/10 p-3.5 text-[15px] text-green-700 dark:text-green-400">{{ notice }}</p>
      <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>
      <div v-if="loading" class="h-40 animate-pulse rounded-2xl bg-muted" />

      <template v-else-if="v">
        <!-- Invite link -->
        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Invite link</h2>
          <div class="ff-group">
            <div class="ff-item flex items-center gap-3 px-4 py-3">
              <span class="min-w-0 flex-1 text-[15px]">Anyone with the link can join<template v-if="v.class?.roster_only"> (if on the class list)</template></span>
              <FfSwitch :model-value="v.invite.enabled" label="Invite link on" @update:model-value="(on) => run(() => api.updateInvite(courseId, { enabled: on }))" />
            </div>
            <div v-if="v.invite.enabled" class="ff-item flex flex-wrap items-center gap-2 px-4 py-3">
              <code class="min-w-0 flex-1 basis-56 truncate rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 text-[13px]">{{ link }}</code>
              <button type="button" class="ff-icon-btn" aria-label="Copy the link" title="Copy" @click="copy"><Copy class="h-[18px] w-[18px]" /></button>
              <button type="button" class="ff-icon-btn" aria-label="New link (the old one stops working)" title="New link" @click="run(() => api.updateInvite(courseId, { new_code: true }), 'New link made. The old one no longer works.')"><RefreshCw class="h-[18px] w-[18px]" /></button>
            </div>
          </div>
          <p v-if="!isPublished" class="mt-2 px-1 text-[13px] text-muted-foreground">Learners can join once the course is published (private is fine).</p>
        </section>

        <!-- Institution -->
        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Institution</h2>
          <div class="ff-group">
            <div class="ff-item flex flex-wrap items-center gap-3 px-4 py-3">
              <label for="inst" class="min-w-0 flex-1 basis-40 text-[15px]">Course belongs to</label>
              <select id="inst" class="ff-field w-auto" :value="v.class?.institution_id ?? 0" @change="pickInst">
                <option :value="0">No institution</option>
                <option v-for="i in v.my_institutions" :key="i.id" :value="i.id">{{ i.name }}</option>
              </select>
            </div>
            <template v-if="v.class">
              <div class="ff-item flex items-center gap-3 px-4 py-3">
                <span class="min-w-0 flex-1 text-[15px]">Only students on the class list can join</span>
                <FfSwitch :model-value="v.class.roster_only" label="Roster only" @update:model-value="(on) => run(() => api.updateClass(courseId, { roster_only: on }))" />
              </div>
              <div class="ff-item flex flex-wrap items-center gap-3 px-4 py-3 text-[15px]">
                <span class="min-w-0 flex-1 basis-48">Class results</span>
                <NuxtLink v-if="v.class.results_approved_at" :to="`/learn/${courseId}/results`"><Button size="lg" variant="tinted">Open results</Button></NuxtLink>
                <span v-else class="text-[13px] text-muted-foreground">Waiting for an admin of {{ v.institution?.name }} to approve</span>
              </div>
            </template>
          </div>
          <p v-if="!v.my_institutions.length" class="mt-2 px-1 text-[13px] text-muted-foreground">You are not in an institution. <NuxtLink to="/institutions" class="text-primary">Create or join one</NuxtLink>.</p>
          <p v-else-if="v.class" class="mt-2 px-1 text-[13px] text-muted-foreground">{{ v.consented }} learner{{ v.consented === 1 ? '' : 's' }} agreed to share results.</p>
        </section>

        <!-- Class list -->
        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Class list</h2>
          <div class="ff-group space-y-3 p-4">
            <p class="text-[13px] text-muted-foreground">One student per line: email, name, student ID (a header row is fine). Or paste just emails.</p>
            <textarea v-model="rosterText" rows="4" class="ff-field font-mono text-[13px]" placeholder="email,name,student_id&#10;sam@uni.ac.rw,Sam Student,S001" aria-label="Class list" @blur="check" />
            <div class="flex flex-wrap items-center gap-2">
              <Button size="lg" type="button" variant="gray" @click="fileInput?.click()"><FileUp class="mr-2 h-4 w-4" />Choose a CSV</Button>
              <input ref="fileInput" type="file" class="hidden" accept=".csv,.txt,text/csv,text/plain,.xlsx" @change="onFile">
              <span v-if="preview" class="text-[13px] text-muted-foreground">{{ preview.students.length }} student{{ preview.students.length === 1 ? '' : 's' }} found</span>
              <Button size="lg" type="button" variant="tinted" class="ml-auto" :disabled="!preview || !!preview.errors.length || !preview.students.length" @click="saveRoster">Add to the list</Button>
            </div>
            <ul v-if="preview?.errors.length" class="space-y-1 rounded-2xl bg-destructive/10 p-3 text-[13px] text-destructive">
              <li v-for="(e, i) in preview.errors" :key="i" class="flex gap-2"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />Line {{ e.line }}: {{ e.message }}</li>
            </ul>
          </div>
          <ul v-if="v.roster.length" class="ff-group mt-3">
            <li v-for="r in v.roster" :key="r.id" class="ff-item flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <span class="min-w-0 flex-1 basis-48">
                <span class="block truncate text-[15px]">{{ r.name || r.email }}</span>
                <span class="block truncate text-[13px] text-muted-foreground">{{ r.name ? r.email : '' }}<template v-if="r.student_id"> · {{ r.student_id }}</template></span>
              </span>
              <span class="ff-pill-sm" :class="r.joined ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''">{{ r.joined ? (r.consented ? 'Joined · agreed' : 'Joined') : r.invited_at ? 'Invited' : 'Not invited' }}</span>
              <button type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Remove ${r.email}`" @click="run(() => api.removeRoster(courseId, r.id))"><Trash2 class="h-[18px] w-[18px]" /></button>
            </li>
          </ul>
          <div v-if="v.roster.length" class="mt-3 flex flex-wrap gap-2">
            <Button size="lg" variant="tinted" :disabled="!notJoined || !isPublished" @click="run(() => api.inviteRoster(courseId), 'Invitations sent.')"><Mail class="mr-2 h-4 w-4" />Email the invite ({{ notJoined }})</Button>
          </div>
        </section>

        <!-- Learners -->
        <section>
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Learners ({{ learners.length }})</h2>
          <div v-if="!learners.length" class="ff-group p-6 text-center text-[15px] text-muted-foreground">Nobody has joined yet.</div>
          <ul v-else class="ff-group">
            <li v-for="l in learners" :key="l.user_id" class="ff-item flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <span class="min-w-0 flex-1 basis-48">
                <span class="block truncate text-[15px]">{{ l.name }}</span>
                <span class="block truncate text-[13px] text-muted-foreground">{{ l.email }} · joined {{ when(l.enrolled_at) }}</span>
              </span>
              <span class="text-[13px] tabular-nums text-muted-foreground">{{ l.completed_units }}/{{ l.total_units }} units</span>
              <button type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Remove ${l.name}`" @click="removeLearner(l)"><Trash2 class="h-[18px] w-[18px]" /></button>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
