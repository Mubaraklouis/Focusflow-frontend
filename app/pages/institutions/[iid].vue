<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, LogOut } from 'lucide-vue-next'
import { useLearn, apiError, type InstitutionView, type InstitutionMember, type OrgRole } from '~/composables/learn/useLearn'
import FfSwitch from '~/components/learn/quiz/FfSwitch.vue'

// One job: run the institution, like a GitHub organisation. Owners manage
// people (owners, lecturers, students), results access and the consent
// text; lecturers see everyone and add courses; students see the courses
// and their teachers. Anyone but the last owner can leave (F4.3, F4.4).
definePageMeta({ layout: false, middleware: ['auth'] })

const iid = Number(useRoute().params.iid)
const api = useLearn()
const v = ref<InstitutionView | null>(null)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const isOwner = computed(() => v.value?.role === 'owner')
const roleNames: Record<OrgRole, string> = { owner: 'Owner', lecturer: 'Lecturer', student: 'Student' }
const youAre: Record<OrgRole, string> = { owner: 'You are an owner', lecturer: 'You are a lecturer', student: 'You are a student' }
const filter = ref<OrgRole | 'all'>('all')
const shown = computed(() => (v.value?.members ?? []).filter((m) => filter.value === 'all' || m.role === filter.value))
const total = computed(() => Object.values(v.value?.counts ?? {}).reduce((a, b) => a + b, 0))

useHead(() => ({ title: `${v.value?.institution.name || 'Institution'} - FocusFlow` }))
const breadcrumbs = computed(() => [
  { title: 'Institutions', href: '/institutions' },
  { title: v.value?.institution.name || 'Institution', href: `/institutions/${iid}`, current: true },
])
const flash = (t: string) => { notice.value = t; setTimeout(() => { if (notice.value === t) notice.value = '' }, 3000) }

const load = async () => {
  try {
    v.value = await api.institution(iid)
    consent.value = v.value.consent_text
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const email = ref('')
const role = ref<OrgRole>('student')
const add = async () => {
  if (!email.value.trim()) return
  try {
    await api.addMember(iid, email.value.trim(), role.value)
    email.value = ''
    await load()
    flash('Added. They get an email.')
  } catch (e) {
    error.value = apiError(e)
  }
}
const setRole = async (m: InstitutionMember, r: OrgRole) => {
  if (m.role === r) return
  error.value = ''
  try {
    await api.setMemberRole(iid, m.id, r)
    await load()
    flash(`${m.name || m.email} is now ${r === 'owner' ? 'an owner' : `a ${r}`}.`)
  } catch (e) {
    error.value = apiError(e)
  }
}
const leave = async () => {
  if (!confirm(`Leave ${v.value?.institution.name}? You keep your account and courses you joined.`)) return
  error.value = ''
  try {
    await api.leaveInstitution(iid)
    await navigateTo('/institutions')
  } catch (e) {
    error.value = apiError(e)
  }
}
const remove = async (mid: number, who: string) => {
  if (!confirm(`Remove ${who} from the institution?`)) return
  try {
    await api.removeMember(iid, mid)
    await load()
  } catch (e) {
    error.value = apiError(e)
  }
}
const approve = async (cid: number, on: boolean) => {
  try {
    await api.approveResults(iid, cid, on)
    await load()
  } catch (e) {
    error.value = apiError(e)
  }
}
const consent = ref('')
const saveConsent = async () => {
  try {
    await api.updateInstitution(iid, { consent_text: consent.value })
    flash('Consent text saved.')
  } catch (e) {
    error.value = apiError(e)
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:pt-10">
      <div v-if="loading" class="h-40 animate-pulse rounded-2xl bg-muted" />
      <p v-else-if="!v" role="alert" class="rounded-2xl bg-destructive/10 p-4 text-[15px] text-destructive">{{ error }}</p>
      <template v-else>
        <header class="mb-6">
          <p class="text-[13px] font-medium text-muted-foreground">{{ youAre[v.role] }} · {{ v.institution.plan === 'institution' ? 'Institution plan' : 'Free plan' }}</p>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 class="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">{{ v.institution.name }}</h1>
            <button type="button" class="ff-pill-sm flex items-center gap-1.5" @click="leave"><LogOut class="h-3.5 w-3.5" />Leave</button>
          </div>
          <p class="mt-1 text-[13px] text-muted-foreground">
            {{ v.counts.owner }} {{ v.counts.owner === 1 ? 'owner' : 'owners' }} · {{ v.counts.lecturer }} {{ v.counts.lecturer === 1 ? 'lecturer' : 'lecturers' }} · {{ v.counts.student }} {{ v.counts.student === 1 ? 'student' : 'students' }}
          </p>
        </header>
        <p v-if="notice" role="status" class="mb-4 rounded-2xl bg-green-500/10 p-3.5 text-[15px] text-green-700 dark:text-green-400">{{ notice }}</p>
        <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>

        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Courses</h2>
          <div v-if="!v.courses.length" class="ff-group p-6 text-center text-[15px] text-muted-foreground">No courses yet.<template v-if="v.role !== 'student'"> Owners and lecturers add a course on its Class page.</template></div>
          <ul v-else class="ff-group">
            <li v-for="c in v.courses" :key="c.course_id" class="ff-item flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span class="min-w-0 flex-1 basis-48">
                <NuxtLink :to="`/learn/${c.course_id}`" class="block truncate text-[15px] font-medium hover:underline">{{ c.title }}</NuxtLink>
                <span class="text-[13px] text-muted-foreground">{{ c.lecturer }} · {{ c.learners }} learner{{ c.learners === 1 ? '' : 's' }}</span>
              </span>
              <span v-if="v.role !== 'student'" class="flex items-center gap-2 text-[13px] text-muted-foreground">
                Results access
                <FfSwitch :model-value="!!c.results_approved_at" label="Approve results access" :disabled="!isOwner" @update:model-value="(on) => approve(c.course_id, on)" />
              </span>
              <NuxtLink v-else :to="`/learn/${c.course_id}`" class="ff-pill-sm">Open</NuxtLink>
            </li>
          </ul>
          <p v-if="v.role !== 'student'" class="mt-2 px-1 text-[13px] text-muted-foreground">Everyone in the institution can open these courses. Results access lets the lecturer see class results for learners who agreed.</p>
        </section>

        <section class="mb-8">
          <div class="mb-2 flex flex-wrap items-center gap-2 px-1">
            <h2 class="flex-1 text-[17px] font-semibold">{{ v.role === 'student' ? 'Owners and lecturers' : 'People' }}</h2>
            <div v-if="v.role !== 'student'" class="ff-segment" role="group" aria-label="Show">
              <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">All {{ total }}</button>
              <button v-for="r in (['owner', 'lecturer', 'student'] as OrgRole[])" :key="r" type="button" :aria-pressed="filter === r" @click="filter = r">{{ roleNames[r] }}s</button>
            </div>
          </div>
          <div v-if="!shown.length" class="ff-group p-6 text-center text-[15px] text-muted-foreground">Nobody here yet.</div>
          <ul v-else class="ff-group">
            <li v-for="m in shown" :key="m.id" class="ff-item flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <span class="min-w-0 flex-1 basis-48">
                <span class="block truncate text-[15px] font-medium">{{ m.name || m.email }}<span v-if="m.id === v.my_member_id" class="font-normal text-muted-foreground"> (you)</span></span>
                <span class="block truncate text-[13px] text-muted-foreground">
                  <template v-if="!isOwner || m.id === v.my_member_id">{{ roleNames[m.role] }}</template><template v-if="m.name && m.email"><template v-if="!isOwner || m.id === v.my_member_id"> · </template>{{ m.email }}</template><template v-if="!m.user_id"> · not signed up yet</template>
                </span>
              </span>
              <div v-if="isOwner && m.id !== v.my_member_id" class="ml-auto flex shrink-0 items-center gap-1">
                <select :value="m.role" class="h-9 w-32 rounded-[10px] border-0 bg-foreground/[0.05] px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40" :aria-label="`Role of ${m.name || m.email}`" @change="setRole(m, ($event.target as HTMLSelectElement).value as OrgRole)">
                  <option value="owner">Owner</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="student">Student</option>
                </select>
                <button type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Remove ${m.email}`" title="Remove" @click="remove(m.id, m.name || m.email)"><Trash2 class="h-[18px] w-[18px]" /></button>
              </div>
            </li>
          </ul>
          <form v-if="isOwner" class="mt-3 flex flex-wrap gap-2" @submit.prevent="add">
            <Input v-model="email" type="email" class="ff-field min-w-0 flex-1 basis-56" placeholder="Email address" aria-label="Email address" />
            <div class="ff-segment" role="group" aria-label="Role">
              <button v-for="r in (['student', 'lecturer', 'owner'] as OrgRole[])" :key="r" type="button" :aria-pressed="role === r" @click="role = r">{{ roleNames[r] }}</button>
            </div>
            <Button size="lg" type="submit" variant="tinted" :disabled="!email.trim()">Add</Button>
          </form>
          <p v-if="isOwner" class="mt-2 px-1 text-[13px] text-muted-foreground">
            People keep their own Free or Pro account. Owners manage people and results access; lecturers add courses and see everyone; students open the institution's courses.
          </p>
        </section>

        <section v-if="v.role !== 'student'">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">What learners agree to</h2>
          <textarea v-model="consent" rows="6" class="ff-field" :disabled="!isOwner" aria-label="Consent text" />
          <div v-if="isOwner" class="mt-2 flex justify-end"><Button size="lg" variant="gray" @click="saveConsent">Save text</Button></div>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
