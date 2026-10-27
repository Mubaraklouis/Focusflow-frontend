<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useLearn, apiError, type InviteInfo } from '~/composables/learn/useLearn'

// One job: join a course from an invite link (F4.1). Signed-out visitors go
// to login first and come back here.
definePageMeta({ layout: false, middleware: ['auth'] })
const code = String(useRoute().params.code || '')
const api = useLearn()
const info = ref<InviteInfo | null>(null)
const error = ref('')
const joining = ref(false)
useHead(() => ({ title: info.value ? `Join ${info.value.course_title} - FocusFlow` : 'Join a course - FocusFlow' }))

onMounted(async () => {
  try {
    info.value = await api.inviteInfo(code)
    if (info.value.enrolled || info.value.is_creator) await navigateTo(`/learn/${info.value.course_id}`, { replace: true })
  } catch (e) {
    error.value = apiError(e, 'This invite link does not work any more. Ask for a new one.')
  }
})
const join = async () => {
  joining.value = true
  error.value = ''
  try {
    const res = await api.joinByInvite(code)
    await navigateTo(`/learn/${res.data.course_id}`)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="[{ title: 'Join a course', href: `/join/${code}`, current: true }]">
    <div class="mx-auto max-w-md px-4 pt-12 pb-24">
      <div v-if="!info && !error" class="h-48 animate-pulse rounded-2xl bg-muted" />
      <div v-else-if="info" class="ff-group p-6 text-center">
        <p class="text-[13px] font-medium text-muted-foreground">{{ info.creator_name }} invited you to</p>
        <h1 class="mt-1 text-[26px] font-bold leading-tight tracking-tight">{{ info.course_title }}</h1>
        <p v-if="info.course_description" class="mt-2 text-[15px] text-muted-foreground">{{ info.course_description }}</p>
        <p class="mt-2 text-[13px] text-muted-foreground">{{ info.units }} unit{{ info.units === 1 ? '' : 's' }} · Free</p>
        <p v-if="error" role="alert" class="mt-4 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">{{ error }}</p>
        <Button size="lg" class="mt-6 w-full" :disabled="joining || !info.published" @click="join">{{ !info.published ? 'Not open yet' : joining ? 'Joining…' : 'Join course' }}</Button>
      </div>
      <p v-else role="alert" class="rounded-2xl bg-destructive/10 p-4 text-center text-[15px] text-destructive">{{ error }}</p>
    </div>
  </NuxtLayout>
</template>
