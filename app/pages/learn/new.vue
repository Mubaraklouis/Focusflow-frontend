<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLearn, apiError, LANGUAGES, type Category } from '~/composables/learn/useLearn'

useHead({ title: 'Create a course - FocusFlow' })
definePageMeta({ layout: false, middleware: ['auth'] })

const breadcrumbs = [
  { title: 'Home', href: '/' },
  { title: 'My learning', href: '/learn' },
  { title: 'Create a course', href: '/learn/new', current: true },
]

const api = useLearn()
const categories = ref<Category[]>([])
const form = ref({ title: '', description: '', category: 0, language: 'en' })
const saving = ref(false)
const error = ref('')
const limitReason = ref('')

onMounted(async () => {
  try {
    const [cats, me] = await Promise.all([api.categories(), api.me()])
    categories.value = cats
    if (cats[0]) form.value.category = cats[0].category_id
    if (!me.can_create_course) limitReason.value = me.create_limit_reason
  } catch (e) {
    error.value = apiError(e)
  }
})

const submit = async () => {
  error.value = ''
  if (!form.value.title.trim()) {
    error.value = 'Give your course a title.'
    return
  }
  saving.value = true
  try {
    const body = new FormData()
    body.append('course_title', form.value.title.trim())
    body.append('course_description', form.value.description.trim())
    body.append('course_category_id', String(form.value.category))
    body.append('course_language', form.value.language)
    body.append('course_visibility', 'private')
    const course = await $fetch<{ course_id: number }>('/api/courses', { method: 'POST', body })
    await navigateTo(`/learn/${course.course_id}/upload`)
  } catch (e) {
    error.value = apiError(e, 'Could not create the course.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <!-- One job: name the course. Materials come next, in the 1 · 2 · 3 steps. -->
    <div class="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Name your course</h1>
        <p class="mt-2 text-sm text-muted-foreground">Next you'll upload your materials, and the AI turns them into units.</p>
      </header>

      <div v-if="limitReason" class="mb-8 rounded-lg bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
        {{ limitReason }} <NuxtLink to="/learn" class="ml-1 font-medium underline">Back to my courses</NuxtLink>
      </div>

      <form class="space-y-6" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="title">Course title</Label>
          <Input id="title" v-model="form.title" placeholder="e.g. Introduction to Data Structures" maxlength="255" class="h-11 text-base" autofocus />
        </div>
        <div class="space-y-2">
          <Label for="desc">What will learners get from it? <span class="font-normal text-muted-foreground">(optional)</span></Label>
          <textarea id="desc" v-model="form.description" rows="3" maxlength="2000"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="A short description shown on the course page" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="cat">Category</Label>
            <select id="cat" v-model.number="form.category" class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option v-for="c in categories" :key="c.category_id" :value="c.category_id">{{ c.category_name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label for="lang">Language</Label>
            <select id="lang" v-model="form.language" class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option v-for="l in LANGUAGES" :key="l.code" :value="l.code">{{ l.name }}</option>
            </select>
          </div>
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <div class="flex items-center justify-between gap-2 pt-6">
          <NuxtLink to="/learn"><Button type="button" variant="ghost">Cancel</Button></NuxtLink>
          <Button type="submit" :disabled="saving || !!limitReason">{{ saving ? 'Creating…' : 'Continue to upload' }}</Button>
        </div>
      </form>
    </div>
  </NuxtLayout>
</template>
