<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, CheckCircle2, Circle, Square, CheckSquare } from 'lucide-vue-next'
import { QUESTION_KINDS, type Question, type QuestionKind } from '~/composables/learn/useLearn'

// Write or edit one question (F2.10). Emits the fields to save.
const props = defineProps<{ question?: Question | null; busy?: boolean }>()
const emit = defineEmits<{ save: [Partial<Question>]; cancel: [] }>()

const q = props.question
const kind = ref<QuestionKind>(q?.kind ?? 'mcq')
const prompt = ref(q?.prompt ?? '')
const options = ref<string[]>(q && q.options.length && q.kind !== 'truefalse' ? [...q.options] : ['', '', '', ''])
const correct = ref<number>(q?.correct ?? 0)
const corrects = ref<number[]>(q?.corrects?.length ? [...q.corrects] : [])
const guide = ref(q?.answer_guide ?? '')
const concept = ref(q?.concept ?? '')

const picks = computed(() => kind.value === 'mcq' || kind.value === 'multi')
const written = computed(() => kind.value === 'short' || kind.value === 'explain')
const toggleCorrect = (i: number) => {
  corrects.value = corrects.value.includes(i) ? corrects.value.filter((x) => x !== i) : [...corrects.value, i].sort((a, b) => a - b)
}
const removeOption = (i: number) => {
  options.value.splice(i, 1)
  if (correct.value >= options.value.length) correct.value = 0
  corrects.value = corrects.value.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))
}

const error = ref('')
const submit = () => {
  error.value = ''
  const body: Partial<Question> = { kind: kind.value, prompt: prompt.value.trim(), answer_guide: guide.value.trim(), concept: concept.value.trim() }
  if (!body.prompt) return (error.value = 'Write the question.')
  if (picks.value) {
    const opts = options.value.map((o) => o.trim())
    if (opts.some((o) => !o)) return (error.value = 'Fill in every option, or remove the empty ones.')
    body.options = opts
    if (kind.value === 'mcq') body.correct = correct.value
    else {
      if (!corrects.value.length) return (error.value = 'Mark at least one correct option.')
      body.corrects = corrects.value
    }
  } else if (kind.value === 'truefalse') {
    body.options = ['True', 'False']
    body.correct = correct.value === 1 ? 1 : 0
  } else if (!body.answer_guide) {
    return (error.value = 'Add what a full-mark answer contains, so it can be marked.')
  }
  emit('save', body)
}
</script>

<template>
  <form class="space-y-4 p-4" @submit.prevent="submit">
    <div class="ff-segment flex-wrap" role="group" aria-label="Question type">
      <button v-for="k in QUESTION_KINDS" :key="k.v" type="button" :aria-pressed="kind === k.v" @click="kind = k.v">{{ k.label }}</button>
    </div>
    <div>
      <label class="ff-label" for="q-prompt">{{ kind === 'truefalse' ? 'Statement' : 'Question' }}</label>
      <textarea id="q-prompt" v-model="prompt" rows="3" class="ff-field" :placeholder="kind === 'truefalse' ? 'e.g. Every recursive function needs a base case.' : 'e.g. What does a base case do?'" />
    </div>

    <div v-if="picks">
      <p class="ff-label">Options · {{ kind === 'mcq' ? 'tap the right one' : 'tap every right one' }}</p>
      <ul class="space-y-2">
        <li v-for="(_, i) in options" :key="i" class="flex items-center gap-2">
          <button type="button" class="ff-icon-btn" :aria-label="`Option ${i + 1} is correct`"
            :class="(kind === 'mcq' ? correct === i : corrects.includes(i)) ? 'text-primary' : 'text-foreground/30'"
            @click="kind === 'mcq' ? (correct = i) : toggleCorrect(i)">
            <template v-if="kind === 'mcq'"><CheckCircle2 v-if="correct === i" class="h-5 w-5" /><Circle v-else class="h-5 w-5" /></template>
            <template v-else><CheckSquare v-if="corrects.includes(i)" class="h-5 w-5" /><Square v-else class="h-5 w-5" /></template>
          </button>
          <Input v-model="options[i]" class="ff-field" :placeholder="`Option ${String.fromCharCode(65 + i)}`" :aria-label="`Option ${i + 1}`" />
          <button v-if="options.length > 2" type="button" class="ff-icon-btn" :aria-label="`Remove option ${i + 1}`" @click="removeOption(i)"><X class="h-[18px] w-[18px]" /></button>
        </li>
      </ul>
      <button v-if="options.length < 6" type="button" class="ff-pill-sm mt-2" @click="options.push('')"><Plus class="mr-1 inline h-3.5 w-3.5" />Add option</button>
    </div>

    <div v-else-if="kind === 'truefalse'" class="ff-segment" role="group" aria-label="The statement is">
      <button type="button" :aria-pressed="correct !== 1" @click="correct = 0">True</button>
      <button type="button" :aria-pressed="correct === 1" @click="correct = 1">False</button>
    </div>

    <div>
      <label class="ff-label" for="q-guide">{{ written ? 'What a full-mark answer contains' : 'Why this is the answer · optional' }}</label>
      <textarea id="q-guide" v-model="guide" rows="2" class="ff-field" :placeholder="written ? '- key point one\n- key point two' : 'Shown with the answer'" />
    </div>
    <div>
      <label class="ff-label" for="q-concept">Concept · optional</label>
      <Input id="q-concept" v-model="concept" class="ff-field" maxlength="255" placeholder="e.g. Base case" />
    </div>
    <p v-if="error" role="alert" class="text-[15px] text-destructive">{{ error }}</p>
    <div class="flex justify-end gap-2">
      <Button size="lg" type="button" variant="gray" @click="emit('cancel')">Cancel</Button>
      <Button size="lg" type="submit" variant="tinted" :disabled="busy">{{ busy ? 'Saving…' : 'Save question' }}</Button>
    </div>
  </form>
</template>
