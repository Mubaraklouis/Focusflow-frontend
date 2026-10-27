<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div v-if="profile?.role !== 'admin'" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center space-y-4">
        <ShieldAlert class="w-16 h-16 mx-auto text-destructive" />
        <h1 class="text-2xl font-bold text-foreground">Access Denied</h1>
        <p class="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    </div>

    <div v-else class="mx-auto max-w-3xl px-4 pt-6 pb-24 sm:pt-10">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">Institutions</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">
          Anyone can create an institution. On the Institution plan, its owners and lecturers get the Pro limits; students keep their own plan.
        </p>
      </header>
      <p v-if="notice" role="status" class="mb-4 rounded-2xl bg-green-500/10 p-3.5 text-[15px] text-green-700 dark:text-green-400">{{ notice }}</p>
      <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>
      <div v-if="loading" class="h-40 animate-pulse rounded-2xl bg-muted" />
      <div v-else-if="!rows.length" class="ff-group p-8 text-center text-[15px] text-muted-foreground">No institutions yet.</div>
      <ul v-else class="ff-group">
        <li v-for="r in rows" :key="r.id" class="ff-item flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <span class="min-w-0 flex-1 basis-56">
            <NuxtLink :to="`/institutions/${r.id}`" class="block truncate text-[15px] font-medium hover:underline">{{ r.name }}</NuxtLink>
            <span class="block truncate text-[13px] text-muted-foreground">
              {{ r.owner || 'no owner' }} · {{ r.members }} {{ r.members === 1 ? 'member' : 'members' }} · {{ r.courses }} {{ r.courses === 1 ? 'course' : 'courses' }}
            </span>
          </span>
          <div class="ff-segment" role="group" :aria-label="`Plan for ${r.name}`">
            <button type="button" :aria-pressed="r.plan === 'free'" @click="setPlan(r, 'free')">Free</button>
            <button type="button" :aria-pressed="r.plan === 'institution'" @click="setPlan(r, 'institution')">Institution</button>
          </div>
        </li>
      </ul>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ShieldAlert } from 'lucide-vue-next'
import { useProfile } from '~/composables/Profile'
import { apiError, type AdminInstitution, type InstitutionPlan } from '~/composables/learn/useLearn'

// One job: put institutions on the paid plan or back to free.
definePageMeta({ layout: false, middleware: ['auth'] })
useHead({ title: 'Institutions · Admin - FocusFlow' })
const breadcrumbs = [{ label: 'Home', to: '/' }, { label: 'Admin', to: '/admin' }, { label: 'Institutions' }]

const { profile } = useProfile()
const rows = ref<AdminInstitution[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')

const load = async () => {
  try {
    rows.value = (await $fetch<{ data: AdminInstitution[] }>('/api/admin/institutions')).data
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const setPlan = async (r: AdminInstitution, plan: InstitutionPlan) => {
  if (r.plan === plan) return
  error.value = ''
  try {
    await $fetch(`/api/admin/institutions/${r.id}/plan`, { method: 'PUT', body: { plan } })
    r.plan = plan
    notice.value = `${r.name} is on the ${plan === 'institution' ? 'Institution' : 'Free'} plan.`
    setTimeout(() => (notice.value = ''), 3000)
  } catch (e) {
    error.value = apiError(e)
  }
}
</script>
