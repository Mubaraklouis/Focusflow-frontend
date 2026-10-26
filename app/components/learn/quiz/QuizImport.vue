<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertCircle, FileUp } from 'lucide-vue-next'
import { useLearn, apiError, type ImportResult } from '~/composables/learn/useLearn'

// Import questions (F2.9): preview first, with an error per line; save only
// when every line reads.
const props = defineProps<{ unitId: number }>()
const emit = defineEmits<{ saved: [number]; close: [] }>()
const api = useLearn()

const format = ref<'csv' | 'gift' | 'aiken'>('csv')
const text = ref('')
const preview = ref<ImportResult | null>(null)
const busy = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const kindLabel: Record<string, string> = { mcq: 'One answer', multi: 'Several answers', truefalse: 'True or false', short: 'Short answer', explain: 'Written' }

const onFile = async (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (/\.xlsx?$/i.test(f.name)) {
    error.value = 'Save the spreadsheet as CSV (File › Save as › CSV), then choose that file.'
    return
  }
  if (/\.gift$/i.test(f.name)) format.value = 'gift'
  else if (/\.csv$/i.test(f.name)) format.value = 'csv'
  text.value = await f.text()
  await check()
}
const check = async () => {
  error.value = ''
  preview.value = null
  if (!text.value.trim()) return
  busy.value = true
  try {
    preview.value = (await api.importQuestions(props.unitId, format.value, text.value, false)).data
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
const save = async () => {
  busy.value = true
  try {
    const res = await api.importQuestions(props.unitId, format.value, text.value, true)
    emit('saved', res.data.saved)
  } catch (e: any) {
    if (e?.data?.data?.errors) preview.value = e.data.data
    else error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="ff-segment" role="group" aria-label="File format">
      <button type="button" :aria-pressed="format === 'csv'" @click="format = 'csv'; check()">CSV</button>
      <button type="button" :aria-pressed="format === 'gift'" @click="format = 'gift'; check()">Moodle GIFT</button>
      <button type="button" :aria-pressed="format === 'aiken'" @click="format = 'aiken'; check()">Aiken</button>
    </div>
    <p class="text-[13px] text-muted-foreground">
      <template v-if="format === 'csv'">One question per row. <a href="/api/learn/quiz-template.csv" class="font-medium text-primary">Download the template</a> to see the columns.</template>
      <template v-else-if="format === 'gift'">Exported from Moodle's question bank (Export › GIFT format).</template>
      <template v-else>Question, then A. B. C. options, then ANSWER: B. A blank line between questions.</template>
    </p>
    <div class="flex flex-wrap gap-2">
      <Button size="lg" type="button" variant="tinted" @click="fileInput?.click()"><FileUp class="mr-2 h-4 w-4" />Choose a file</Button>
      <input ref="fileInput" type="file" class="hidden" accept=".csv,.txt,.gift,.xlsx,.xls,text/csv,text/plain" @change="onFile">
    </div>
    <div>
      <label class="ff-label" for="imp-text">Or paste here</label>
      <textarea id="imp-text" v-model="text" rows="6" class="ff-field font-mono text-[13px]" spellcheck="false" @blur="check" />
    </div>
    <p v-if="error" role="alert" class="text-[15px] text-destructive">{{ error }}</p>

    <div v-if="preview" class="space-y-3">
      <ul v-if="preview.errors.length" class="space-y-1 rounded-2xl bg-destructive/10 p-3.5 text-[15px] text-destructive">
        <li v-for="(er, i) in preview.errors" :key="i" class="flex gap-2"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0" /><span><b v-if="er.line">Line {{ er.line }}:</b> {{ er.message }}</span></li>
      </ul>
      <p class="px-1 text-[15px] font-medium">{{ preview.questions.length }} question{{ preview.questions.length === 1 ? '' : 's' }} ready<template v-if="preview.errors.length"> · fix the lines above to import</template></p>
      <ol v-if="preview.questions.length" class="ff-group max-h-72 overflow-y-auto">
        <li v-for="(q, i) in preview.questions" :key="i" class="ff-item px-4 py-2.5">
          <p class="line-clamp-2 text-[15px]">{{ q.prompt }}</p>
          <p class="text-[13px] text-muted-foreground">{{ kindLabel[q.kind] }}<template v-if="q.options.length"> · {{ q.options.length }} options</template></p>
        </li>
      </ol>
    </div>
    <div class="flex justify-end gap-2">
      <Button size="lg" type="button" variant="gray" @click="emit('close')">Cancel</Button>
      <Button size="lg" type="button" variant="tinted" :disabled="busy || !preview || !!preview.errors.length || !preview.questions.length" @click="save">
        {{ busy ? 'Working…' : `Import ${preview?.questions.length || ''} questions` }}
      </Button>
    </div>
  </div>
</template>
