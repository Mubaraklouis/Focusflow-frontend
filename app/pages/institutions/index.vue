<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, ChevronRight } from 'lucide-vue-next'
import { useLearn, apiError, type Institution } from '~/composables/learn/useLearn'

// One job: open an institution I belong to, or create one (F4.3).
definePageMeta({ layout: false, middleware: ['auth'] })
useHead({ title: 'Institutions - FocusFlow' })
const breadcrumbs = [{ title: 'Institutions', href: '/institutions', current: true }]

const api = useLearn()
const list = ref<Institution[]>([])
const loading = ref(true)
const error = ref('')
const name = ref('')
const creating = ref(false)

onMounted(async () => {
  try {
    list.value = await api.institutions()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
})
const create = async () => {
  if (!name.value.trim()) return
  creating.value = true
  try {
    const res = await api.createInstitution(name.value.trim())
    await navigateTo(`/institutions/${res.data.id}`)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:pt-10">
      <header class="mb-6">
        <h1 class="text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">Institutions</h1>
        <p class="mt-1 text-[15px] text-muted-foreground">Your university, school or company. Like an organisation: owners, lecturers and students share its courses.</p>
      </header>
      <p v-if="error" role="alert" class="mb-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>
      <div v-if="loading" class="ff-group" aria-busy="true"><div class="ff-item px-4 py-4"><div class="h-4 animate-pulse rounded bg-muted" /></div></div>
      <ul v-else-if="list.length" class="ff-group mb-8">
        <li v-for="i in list" :key="i.id" class="ff-item">
          <NuxtLink :to="`/institutions/${i.id}`" class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03]">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary"><Building2 class="h-[18px] w-[18px]" /></span>
            <span class="min-w-0 flex-1"><span class="block truncate text-[15px] font-medium">{{ i.name }}</span><span class="text-[13px] text-muted-foreground">{{ ({ owner: 'Owner', lecturer: 'Lecturer', student: 'Student' } as Record<string, string>)[i.role || ''] || i.role }} · {{ i.plan === 'institution' ? 'Institution plan' : 'Free plan' }}</span></span>
            <ChevronRight class="h-4 w-4 text-muted-foreground" />
          </NuxtLink>
        </li>
      </ul>
      <div v-else class="ff-group mb-8 p-8 text-center text-[15px] text-muted-foreground">You are not in an institution yet. An owner can add you by email, or create one below and become its owner.</div>

      <form class="ff-group space-y-3 p-4" @submit.prevent="create">
        <label for="inst-name" class="ff-label">Create an institution</label>
        <p class="text-[13px] text-muted-foreground">You become its owner and can add lecturers and students by email. It starts on the Free plan; ask FocusFlow for the Institution plan to give your owners and lecturers the Pro limits.</p>
        <Input id="inst-name" v-model="name" class="ff-field" maxlength="255" placeholder="e.g. University of Rwanda, School of ICT" />
        <div class="flex justify-end"><Button size="lg" type="submit" variant="tinted" :disabled="creating || !name.trim()">{{ creating ? 'Creating…' : 'Create' }}</Button></div>
      </form>
    </div>
  </NuxtLayout>
</template>
