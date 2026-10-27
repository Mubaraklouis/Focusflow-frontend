<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useLearn, apiError, type Certificate } from '~/composables/learn/useLearn'

// Public: anyone with the code can check a completion certificate (F2.6).
// Printable (Print → Save as PDF).
definePageMeta({ layout: false })

const code = String(useRoute().params.code || '')
const api = useLearn()
const cert = ref<Certificate | null>(null)
const link = ref('')
const error = ref('')
const loading = ref(true)
useHead(() => ({ title: cert.value ? `Certificate · ${cert.value.course_title} - FocusFlow` : 'Certificate - FocusFlow' }))

onMounted(async () => {
  link.value = location.origin + location.pathname
  try {
    cert.value = await api.certificate(code)
  } catch (e) {
    error.value = apiError(e, 'No certificate has this code.')
  } finally {
    loading.value = false
  }
})
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' })
const share = () => navigator.clipboard?.writeText(location.href)
const print = () => window.print()
</script>

<template>
  <div class="min-h-screen bg-background px-4 py-10 text-foreground print:bg-white print:py-0">
    <div v-if="loading" class="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-muted" />
    <div v-else-if="error" class="mx-auto max-w-md rounded-2xl bg-destructive/10 p-6 text-center text-[15px] text-destructive">{{ error }}</div>
    <template v-else-if="cert">
      <article class="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-14 print:border-2 print:shadow-none">
        <p class="text-[13px] font-semibold uppercase tracking-[0.2em] text-primary">FocusFlow · Certificate of completion</p>
        <p class="mt-10 text-[15px] text-muted-foreground">This certifies that</p>
        <h1 class="mt-2 text-[34px] font-bold leading-tight tracking-tight sm:text-[44px]">{{ cert.learner_name }}</h1>
        <p class="mt-6 text-[15px] text-muted-foreground">completed the course</p>
        <h2 class="mt-2 text-[24px] font-semibold leading-snug sm:text-[28px]">{{ cert.course_title }}</h2>
        <p v-if="cert.creator_name" class="mt-2 text-[15px] text-muted-foreground">created by {{ cert.creator_name }}</p>
        <p v-if="cert.final_score != null" class="mt-6 text-[15px]">Final exam: <b>{{ cert.final_score }}%</b></p>
        <div class="mt-12 flex flex-wrap justify-between gap-4 border-t border-border pt-6 text-left text-[13px] text-muted-foreground">
          <span>Issued {{ day(cert.issued_at) }}</span>
          <span>Check at {{ link }} · code <b class="font-mono text-foreground">{{ cert.code }}</b></span>
        </div>
      </article>
      <div class="mx-auto mt-6 flex max-w-3xl justify-center gap-2 print:hidden">
        <Button size="lg" variant="gray" @click="share">Copy link</Button>
        <Button size="lg" @click="print">Print or save as PDF</Button>
      </div>
    </template>
  </div>
</template>
