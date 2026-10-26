<script setup lang="ts">
import KindTile from '~/components/learn/KindTile.vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, X } from 'lucide-vue-next'
import { useLearn, apiError, type Unit, type Concept, type Material } from '~/composables/learn/useLearn'
import { moved } from '~/composables/learn/useCourseBuilder'
import ConceptSources from '~/components/learn/ConceptSources.vue'
import { renderMarkdown } from '~/utils/markdown'

// Edits one unit: title, introduction, its concepts, and which materials it
// groups. Concept changes save on their own; the unit saves with "Save unit".
const props = defineProps<{ unit: Unit; materials: Material[] }>()
const emit = defineEmits<{ changed: []; close: []; error: [message: string]; saved: [] }>()
const api = useLearn()

const draft = ref({ title: props.unit.title, body: props.unit.body, material_ids: (props.unit.materials ?? []).map((m) => m.id) })
const preview = ref(false)
const saving = ref(false)

const act = async (action: () => Promise<unknown>) => {
  try {
    await action()
    emit('changed')
    return true
  } catch (e) {
    emit('error', apiError(e))
    return false
  }
}

const toggleMaterial = (id: number) => {
  const ids = draft.value.material_ids
  draft.value.material_ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}
const save = async () => {
  saving.value = true
  if (await act(() => api.updateUnit(props.unit.id, draft.value))) emit('saved')
  saving.value = false
}

// ── concepts ──────────────────────────────────────────────────────────────
const editingConcept = ref<number | null>(null)
const conceptDraft = ref({ title: '', explanation: '' })
const newConcept = ref('')

const startConceptEdit = (c: Concept) => {
  editingConcept.value = c.id
  conceptDraft.value = { title: c.title, explanation: c.explanation }
}
const saveConcept = async (c: Concept) => {
  if (await act(() => api.updateConcept(c.id, conceptDraft.value))) editingConcept.value = null
}
const removeConcept = (c: Concept) => confirm(`Remove the concept "${c.title}"?`) && act(() => api.deleteConcept(c.id))
const moveConcept = (index: number, delta: number) => {
  const ids = moved((props.unit.concepts ?? []).map((c) => c.id), index, delta)
  if (ids) act(() => api.reorderConcepts(props.unit.id, ids))
}
const removeReference = (c: Concept, url: string) =>
  act(() => api.updateConcept(c.id, { keep_reference_urls: (c.references ?? []).map((r) => r.url).filter((u) => u !== url) }))
const addConcept = async () => {
  const title = newConcept.value.trim()
  if (!title) return
  if (await act(() => api.addConcept(props.unit.id, title))) newConcept.value = ''
}
</script>

<template>
  <div class="space-y-6 border-t border-border/70 bg-foreground/[0.015] px-4 pb-5 pt-5">
    <div class="space-y-3">
      <Input v-model="draft.title" class="ff-field" placeholder="Unit title" maxlength="255" aria-label="Unit title" />
      <div class="ff-segment" role="group" aria-label="Introduction view">
        <button type="button" :aria-pressed="!preview" @click="preview = false">Write</button>
        <button type="button" :aria-pressed="preview" @click="preview = true">Preview</button>
      </div>
      <textarea v-if="!preview" v-model="draft.body" rows="8" aria-label="Unit introduction" class="ff-field" placeholder="Unit introduction" />
      <div v-else class="md-content min-h-32 rounded-xl bg-background p-4" v-html="renderMarkdown(draft.body)" />
    </div>

    <!-- Concepts -->
    <div>
      <h3 class="ff-label">Concepts</h3>
      <ol class="ff-group" style="--ff-inset: 2.75rem">
        <li v-for="(c, ci) in unit.concepts ?? []" :key="c.id" class="ff-item px-4 py-3">
          <div v-if="editingConcept === c.id" class="space-y-2">
            <Input v-model="conceptDraft.title" class="ff-field" maxlength="255" aria-label="Concept title" />
            <textarea v-model="conceptDraft.explanation" rows="6" aria-label="Concept explanation" class="ff-field"
              placeholder="Explain the concept (Markdown)" />
            <div class="flex justify-end gap-2">
              <Button size="lg" type="button" variant="gray" @click="editingConcept = null">Cancel</Button>
              <Button size="lg" type="button" variant="tinted" :disabled="!conceptDraft.title.trim()" @click="saveConcept(c)">Save concept</Button>
            </div>
          </div>
          <div v-else class="flex flex-wrap items-start gap-x-3 gap-y-1">
            <span class="mt-0.5 w-4 shrink-0 text-right text-[13px] font-semibold tabular-nums text-muted-foreground">{{ ci + 1 }}</span>
            <div class="min-w-0 flex-1 basis-48">
              <p class="text-[15px] font-medium">{{ c.title }}</p>
              <p class="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{{ c.explanation.replace(/[*_#`>]+/g, '') }}</p>
              <ConceptSources class="mt-2" :sources="c.sources" />
              <p v-if="!c.sources.length" class="mt-1 text-[13px] text-amber-700 dark:text-amber-400">No source linked</p>
              <div v-if="c.references?.length" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="r in c.references" :key="r.url" class="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[12px]">
                  <a :href="r.url" target="_blank" rel="noopener" class="hover:underline">{{ r.site }}</a>
                  <button type="button" class="opacity-60 hover:text-destructive hover:opacity-100" :aria-label="`Remove ${r.site}`" title="Remove this link" @click="removeReference(c, r.url)"><X class="h-3.5 w-3.5" /></button>
                </span>
              </div>
            </div>
            <div class="-my-1 ml-auto flex shrink-0 items-center">
              <button type="button" class="ff-icon-btn" :disabled="ci === 0" aria-label="Move up" title="Move up" @click="moveConcept(ci, -1)"><ChevronUp class="h-[18px] w-[18px]" /></button>
              <button type="button" class="ff-icon-btn" :disabled="ci === (unit.concepts ?? []).length - 1" aria-label="Move down" title="Move down" @click="moveConcept(ci, 1)"><ChevronDown class="h-[18px] w-[18px]" /></button>
              <button type="button" class="ff-icon-btn" aria-label="Edit concept" title="Edit" @click="startConceptEdit(c)"><Pencil class="h-[18px] w-[18px]" /></button>
              <button type="button" class="ff-icon-btn hover:text-destructive" aria-label="Remove concept" title="Remove" @click="removeConcept(c)"><Trash2 class="h-[18px] w-[18px]" /></button>
            </div>
          </div>
        </li>
      </ol>
      <form class="mt-3 flex gap-2" @submit.prevent="addConcept">
        <Input v-model="newConcept" class="ff-field" placeholder="Add a concept" maxlength="255" aria-label="New concept" />
        <Button size="lg" type="submit" variant="tinted" :disabled="!newConcept.trim()"><Plus class="mr-1 h-4 w-4" />Add</Button>
      </form>
    </div>

    <!-- Grouping: the materials this unit uses -->
    <div v-if="materials.length">
      <h3 class="ff-label">Materials in this unit</h3>
      <div class="ff-group">
        <label v-for="m in materials" :key="m.id" class="ff-item flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[15px] hover:bg-foreground/[0.03]">
          <KindTile :kind="m.kind" />
          <span class="min-w-0 flex-1 truncate">{{ m.title }}</span>
          <span v-if="draft.material_ids.includes(m.id)" class="text-[13px] tabular-nums text-muted-foreground">#{{ draft.material_ids.indexOf(m.id) + 1 }}</span>
          <input type="checkbox" class="h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" :checked="draft.material_ids.includes(m.id)" @change="toggleMaterial(m.id)">
        </label>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button size="lg" type="button" variant="gray" @click="emit('close')">Cancel</Button>
      <Button size="lg" type="button" variant="tinted" :disabled="saving || !draft.title.trim()" @click="save">{{ saving ? 'Saving…' : 'Save unit' }}</Button>
    </div>
  </div>
</template>
