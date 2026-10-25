<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Library, Plus, Compass, PencilRuler, CheckCircle2, Globe, Lock } from 'lucide-vue-next'
import { useLearn, apiError, type MyLearning } from '~/composables/learn/useLearn'
import AIAllowance from '~/components/learn/AIAllowance.vue'

useHead({ title: 'My learning - FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'My learning', href: '/learn', current: true },
]

const api = useLearn()
const data = ref<MyLearning | null>(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    data.value = await api.me()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0)
const createdCount = computed(() => data.value?.created.length ?? 0)
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <div class="flex flex-wrap justify-between items-center gap-3 mb-8">
        <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
          <Library class="h-6 w-6" /> My learning
        </h1>
        <div class="flex gap-2">
          <NuxtLink to="/learn/browse"><Button variant="outline"><Compass class="h-4 w-4 mr-2" />Browse courses</Button></NuxtLink>
          <NuxtLink v-if="data?.can_create_course" to="/learn/new"><Button><Plus class="h-4 w-4 mr-2" />Create a course</Button></NuxtLink>
        </div>
      </div>

      <div v-if="loading" class="space-y-3 animate-pulse">
        <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-muted/60" />
      </div>
      <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-lg">
        {{ error }} <Button variant="outline" class="ml-3" @click="load">Try again</Button>
      </div>

      <template v-else-if="data">
        <!-- Courses I'm taking -->
        <section class="mb-10">
          <h2 class="text-lg font-semibold mb-3">Courses I'm taking</h2>
          <div v-if="!data.joined.length" class="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            You haven't joined a course yet.
            <NuxtLink to="/learn/browse" class="text-primary font-medium ml-1 hover:underline">Browse free courses</NuxtLink>
          </div>
          <div v-else class="grid gap-3 sm:grid-cols-2">
            <NuxtLink v-for="j in data.joined" :key="j.course.course_id" :to="`/learn/${j.course.course_id}`"
              class="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-medium text-foreground">{{ j.course.course_title }}</h3>
                <CheckCircle2 v-if="j.total_units && j.completed_units >= j.total_units" class="h-5 w-5 text-green-600 shrink-0" />
              </div>
              <div class="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full bg-primary transition-all" :style="{ width: pct(j.completed_units, j.total_units) + '%' }" />
              </div>
              <p class="mt-2 text-xs text-muted-foreground">{{ j.completed_units }} of {{ j.total_units }} units finished</p>
            </NuxtLink>
          </div>
        </section>

        <!-- Courses I created -->
        <section>
          <AIAllowance :allowance="data.ai_allowance" class="mb-4" />
          <div class="flex items-baseline justify-between mb-3">
            <h2 class="text-lg font-semibold">Courses I created</h2>
            <span class="text-xs text-muted-foreground">Free plan: {{ createdCount }} of {{ data.limits.courses_per_user }} courses</span>
          </div>
          <div v-if="!data.created.length" class="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            Turn your notes, slides and videos into a course.
            <NuxtLink to="/learn/new" class="text-primary font-medium ml-1 hover:underline">Create your first course</NuxtLink>
          </div>
          <div v-else class="grid gap-3 sm:grid-cols-2">
            <NuxtLink v-for="c in data.created" :key="c.course_id" :to="`/learn/${c.course_id}/build`"
              class="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-medium text-foreground">{{ c.course_title }}</h3>
                <PencilRuler class="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="rounded-full px-2 py-0.5" :class="c.course_status === 'published' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'">
                  {{ c.course_status === 'published' ? 'Published' : 'Draft' }}
                </span>
                <span v-if="c.course_status === 'published'" class="flex items-center gap-1 text-muted-foreground">
                  <Globe v-if="c.course_visibility === 'public'" class="h-3 w-3" /><Lock v-else class="h-3 w-3" />
                  {{ c.course_visibility === 'public' ? 'Public' : 'Private' }}
                </span>
              </div>
            </NuxtLink>
          </div>
          <p v-if="!data.can_create_course && data.create_limit_reason" class="mt-3 text-sm text-muted-foreground">{{ data.create_limit_reason }}</p>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
