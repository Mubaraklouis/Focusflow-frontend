<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-vue-next'
import { useLearn, apiError, type InstitutionView } from '~/composables/learn/useLearn'
import FfSwitch from '~/components/learn/quiz/FfSwitch.vue'

// One job: run the institution — who is in it, which courses use class
// results, and what learners agree to (F4.3, F4.4).
definePageMeta({ layout: false, middleware: ['auth'] })

const iid = Number(useRoute().params.iid)
const api = useLearn()
const v = ref<InstitutionView | null>(null)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const isAdmin = computed(() => v.value?.role === 'admin')

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
const role = ref<'lecturer' | 'admin'>('lecturer')
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
          <p class="text-[13px] font-medium text-muted-foreground">{{ isAdmin ? 'You are an admin' : 'You are a lecturer' }}</p>
          <h1 class="mt-0.5 text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">{{ v.institution.name }}</h1>
        </header>
        <p v-if="notice" role="status" class="mb-4 rounded-2xl bg-green-500/10 p-3.5 text-[15px] text-green-700 dark:text-green-400">{{ notice }}</p>
        <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>

        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">Courses</h2>
          <div v-if="!v.courses.length" class="ff-group p-6 text-center text-[15px] text-muted-foreground">No courses yet. Lecturers add a course on its Class page.</div>
          <ul v-else class="ff-group">
            <li v-for="c in v.courses" :key="c.course_id" class="ff-item flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span class="min-w-0 flex-1 basis-48">
                <span class="block truncate text-[15px] font-medium">{{ c.title }}</span>
                <span class="text-[13px] text-muted-foreground">{{ c.lecturer }} · {{ c.learners }} learner{{ c.learners === 1 ? '' : 's' }}</span>
              </span>
              <span class="flex items-center gap-2 text-[13px] text-muted-foreground">
                Results access
                <FfSwitch :model-value="!!c.results_approved_at" label="Approve results access" :disabled="!isAdmin" @update:model-value="(on) => approve(c.course_id, on)" />
              </span>
            </li>
          </ul>
          <p class="mt-2 px-1 text-[13px] text-muted-foreground">Results access lets the lecturer see class results for learners who agreed.</p>
        </section>

        <section class="mb-8">
          <h2 class="mb-2 px-1 text-[17px] font-semibold">People</h2>
          <ul class="ff-group">
            <li v-for="m in v.members" :key="m.id" class="ff-item flex items-center gap-3 px-4 py-3">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[15px] font-medium">{{ m.name || m.email }}</span>
                <span class="text-[13px] text-muted-foreground">{{ m.role === 'admin' ? 'Admin' : 'Lecturer' }}<template v-if="m.name"> · {{ m.email }}</template><template v-if="!m.user_id"> · not signed up yet</template></span>
              </span>
              <button v-if="isAdmin" type="button" class="ff-icon-btn hover:text-destructive" :aria-label="`Remove ${m.email}`" @click="remove(m.id, m.name || m.email)"><Trash2 class="h-[18px] w-[18px]" /></button>
            </li>
          </ul>
          <form v-if="isAdmin" class="mt-3 flex flex-wrap gap-2" @submit.prevent="add">
            <Input v-model="email" type="email" class="ff-field min-w-0 flex-1 basis-56" placeholder="Email address" aria-label="Email address" />
            <div class="ff-segment" role="group" aria-label="Role">
              <button type="button" :aria-pressed="role === 'lecturer'" @click="role = 'lecturer'">Lecturer</button>
              <button type="button" :aria-pressed="role === 'admin'" @click="role = 'admin'">Admin</button>
            </div>
            <Button size="lg" type="submit" variant="tinted" :disabled="!email.trim()">Add</Button>
          </form>
        </section>

        <section>
          <h2 class="mb-2 px-1 text-[17px] font-semibold">What learners agree to</h2>
          <textarea v-model="consent" rows="6" class="ff-field" :disabled="!isAdmin" aria-label="Consent text" />
          <div v-if="isAdmin" class="mt-2 flex justify-end"><Button size="lg" variant="gray" @click="saveConsent">Save text</Button></div>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
