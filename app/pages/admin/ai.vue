<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div v-if="profile?.role !== 'admin'" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center space-y-4">
        <ShieldAlert class="w-16 h-16 mx-auto text-destructive" />
        <h1 class="text-2xl font-bold text-foreground">Access Denied</h1>
        <p class="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    </div>

    <div v-else class="space-y-6 p-6 max-w-5xl mx-auto">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">AI usage</h1>
          <p class="text-muted-foreground mt-1">
            Every request FocusFlow sent to each AI model today. Gemini's daily limits reset at midnight Pacific time<span v-if="data">, in {{ untilReset }}</span>.
          </p>
        </div>
        <Button variant="default" class="gap-2" :disabled="loading" @click="load">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />Refresh
        </Button>
      </div>

      <div v-if="error" class="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 flex items-center gap-3">
        <AlertCircle class="w-5 h-5" /><p>{{ error }}</p>
      </div>

      <div v-if="data" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="rounded-xl border border-border bg-card p-5">
          <h3 class="text-sm font-medium text-muted-foreground">AI spend this month</h3>
          <p class="text-2xl font-bold mt-2">${{ data.month_spend_usd.toFixed(2) }}<span v-if="data.monthly_budget_usd" class="text-base font-normal text-muted-foreground"> of ${{ data.monthly_budget_usd.toFixed(2) }} budget</span></p>
          <div v-if="data.monthly_budget_usd" class="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div class="h-full bg-primary" :style="{ width: Math.min(100, (data.month_spend_usd / data.monthly_budget_usd) * 100) + '%' }" />
          </div>
          <p class="text-xs text-muted-foreground mt-2">Estimated from token counts (free-tier calls cost nothing but are counted at paid prices).</p>
        </div>
        <div class="rounded-xl border border-border bg-card p-5">
          <h3 class="text-sm font-medium text-muted-foreground">Requests today</h3>
          <p class="text-2xl font-bold mt-2">{{ totalRequests }}</p>
          <p class="text-xs text-muted-foreground mt-2">{{ totalQuotaErrors }} refused by a provider for quota (error 429).</p>
        </div>
      </div>

      <div v-if="data && !data.models.length" class="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No AI requests yet today.
      </div>

      <div v-for="m in data?.models ?? []" :key="m.model" class="rounded-xl border border-border bg-card p-5">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold">{{ m.model }} <span class="text-sm font-normal text-muted-foreground">{{ m.provider }}</span></h2>
          <span v-if="m.today.quota_errors" class="text-xs rounded-full bg-destructive/10 text-destructive px-2 py-0.5">{{ m.today.quota_errors }} quota errors today</span>
        </div>
        <dl class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><dt class="text-muted-foreground">Requests today</dt><dd class="font-semibold">{{ m.today.requests }} <span class="font-normal text-muted-foreground">({{ m.today.ok }} ok)</span></dd></div>
          <div><dt class="text-muted-foreground">Input tokens today</dt><dd class="font-semibold">{{ n(m.today.input_tokens) }}</dd></div>
          <div><dt class="text-muted-foreground">Output tokens today</dt><dd class="font-semibold">{{ n(m.today.output_tokens) }}</dd></div>
          <div><dt class="text-muted-foreground">Last minute</dt><dd class="font-semibold">{{ m.last_minute.requests }} req · {{ n(m.last_minute.input_tokens) }} tok</dd></div>
        </dl>
        <div v-if="m.last_quota_error" class="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p class="font-medium">Last quota error {{ ago(m.last_quota_error.at) }}</p>
          <ul v-if="m.last_quota_error.limits.length" class="mt-1 list-disc pl-5">
            <li v-for="l in m.last_quota_error.limits" :key="l.metric">
              Google's limit: <strong>{{ n(l.limit) }}</strong> {{ l.metric }}<template v-if="l.limit === 0"> (this model is not included in the key's plan)</template>
            </li>
          </ul>
          <p v-else class="text-muted-foreground mt-1 break-words">{{ m.last_quota_error.message }}</p>
        </div>
      </div>

      <div v-if="data" class="rounded-xl border border-border bg-card p-5">
        <h2 class="text-lg font-semibold">Creators' AI allowance</h2>
        <p class="text-sm text-muted-foreground mt-1">
          <template v-if="data.user_daily_usd || data.user_monthly_usd">
            Each creator may use about<template v-if="data.user_daily_usd"> ${{ data.user_daily_usd.toFixed(2) }} a day</template><template v-if="data.user_daily_usd && data.user_monthly_usd"> and</template><template v-if="data.user_monthly_usd"> ${{ data.user_monthly_usd.toFixed(2) }} a month</template> of AI (days and months start at midnight UTC). Creators see it as a percentage left; admins have no limit.
          </template>
          <template v-else>No per-creator limit is set (AI_USER_DAILY_USD, AI_USER_MONTHLY_USD).</template>
        </p>
        <p v-if="!data.users.length" class="mt-3 text-sm text-muted-foreground">No creator has used AI this month.</p>
        <div v-else class="mt-3 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-left text-muted-foreground">
              <tr><th class="py-2 pr-3 font-medium">Creator</th><th class="py-2 pr-3 font-medium">Today</th><th class="py-2 pr-3 font-medium">This month</th></tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="u in data.users" :key="u.user_id">
                <td class="py-2 pr-3">{{ u.name || `User ${u.user_id}` }}</td>
                <td class="py-2 pr-3">${{ u.today_usd.toFixed(3) }}<span v-if="data.user_daily_usd" class="text-muted-foreground"> · {{ u.day_percent }}%</span></td>
                <td class="py-2 pr-3">${{ u.month_usd.toFixed(3) }}<span v-if="data.user_monthly_usd" class="text-muted-foreground"> · {{ u.month_percent }}%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-muted-foreground">
        Google does not report how much quota is left. Limits shown here come from Google's own error messages when a limit was hit; the full list is in Google AI Studio (Usage and rate limits).
      </p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useProfile } from '~/composables/Profile'
import { Button } from '@/components/ui/button'
import { ShieldAlert, RefreshCw, AlertCircle } from 'lucide-vue-next'

definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [{ label: 'Home', to: '/' }, { label: 'Admin', to: '/admin' }, { label: 'AI usage' }]

interface ModelQuota {
  provider: string
  model: string
  today: { requests: number; ok: number; quota_errors: number; input_tokens: number; output_tokens: number }
  last_minute: { requests: number; input_tokens: number }
  last_quota_error?: { at: string; limits: { metric: string; limit: number }[]; message: string }
}
interface Quota {
  day_start: string
  resets_at: string
  now: string
  models: ModelQuota[]
  month_spend_usd: number
  monthly_budget_usd: number
  user_daily_usd: number
  user_monthly_usd: number
  users: { user_id: number; name: string; today_usd: number; month_usd: number; day_percent: number; month_percent: number }[]
}

const { profile } = useProfile()
const data = ref<Quota | null>(null)
const loading = ref(false)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    data.value = (await $fetch<{ data: Quota }>('/api/admin/ai/quota')).data
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not load AI usage.'
  } finally {
    loading.value = false
  }
}

const totalRequests = computed(() => (data.value?.models ?? []).reduce((s, m) => s + m.today.requests, 0))
const totalQuotaErrors = computed(() => (data.value?.models ?? []).reduce((s, m) => s + m.today.quota_errors, 0))
const untilReset = computed(() => {
  if (!data.value) return ''
  const min = Math.max(0, Math.round((Date.parse(data.value.resets_at) - Date.parse(data.value.now)) / 60000))
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`
})
const n = (v: number) => v.toLocaleString()
const ago = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`
}

onMounted(() => { if (profile.value?.role === 'admin') load() })
watch(() => profile.value?.role, (r) => { if (r === 'admin' && !data.value) load() })
</script>
