<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, X } from 'lucide-vue-next'
import { useLearn, apiError, type Unit, type Concept, type Material } from '~/composables/learn/useLearn'
import { kindIcon, moved } from '~/composables/learn/useCourseBuilder'
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
  <div class="space-y-6 border-t border-border px-4 pb-5 pt-5">
    <div class="space-y-3">
      <Input class="h-11 text-base" v-model="draft.title" placeholder="Unit title" maxlength="255" aria-label="Unit title" />
      <div class="flex gap-1 text-base">
        <button type="button" class="rounded-md px-3 py-1.5" :class="!preview ? 'bg-accent font-medium' : 'text-muted-foreground'" @click="preview = false">Write</button>
        <button type="button" class="rounded-md px-3 py-1.5" :class="preview ? 'bg-accent font-medium' : 'text-muted-foreground'" @click="preview = true">Preview</button>
      </div>
      <textarea v-if="!preview" v-model="draft.body" rows="8" aria-label="Unit introduction"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Unit introduction" />
      <div v-else class="md-content min-h-32 rounded-md border border-border p-4" v-html="renderMarkdown(draft.body)" />
    </div>

    <!-- Concepts -->
    <div>
      <h3 class="mb-2 text-base font-semibold">Concepts</h3>
      <ol class="divide-y divide-border">
        <li v-for="(c, ci) in unit.concepts ?? []" :key="c.id" class="py-4">
          <div v-if="editingConcept === c.id" class="space-y-2">
            <Input class="h-11 text-base" v-model="conceptDraft.title" maxlength="255" aria-label="Concept title" />
            <textarea v-model="conceptDraft.explanation" rows="6" aria-label="Concept explanation"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Explain the concept (Markdown)" />
            <div class="flex justify-end gap-2">
              <Button size="lg" type="button" variant="outline" @click="editingConcept = null">Cancel</Button>
              <Button size="lg" type="button" variant="outline" :disabled="!conceptDraft.title.trim()" @click="saveConcept(c)">Save concept</Button>
            </div>
          </div>
          <div v-else class="flex items-start gap-2">
            <span class="mt-0.5 w-4 shrink-0 text-sm font-semibold text-muted-foreground">{{ ci + 1 }}</span>
            <div class="min-w-0 flex-1">
              <p class="text-base font-medium">{{ c.title }}</p>
              <p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{{ c.explanation }}</p>
              <ConceptSources class="mt-2" :sources="c.sources" />
              <p v-if="!c.sources.length" class="mt-1 text-sm text-amber-700 dark:text-amber-400">No source linked</p>
              <div v-if="c.references?.length" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="r in c.references" :key="r.url" class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-sm">
                  <a :href="r.url" target="_blank" rel="noopener" class="hover:underline">{{ r.site }}</a>
                  <button type="button" class="opacity-60 hover:text-destructive hover:opacity-100" :aria-label="`Remove ${r.site}`" title="Remove this link" @click="removeReference(c, r.url)"><X class="h-4 w-4" /></button>
                </span>
              </div>
            </div>
            <div class="flex shrink-0 items-center">
              <button type="button" class="rounded-md p-2 text-foreground/70 hover:bg-accent hover:text-foreground disabled:opacity-30" :disabled="ci === 0" aria-label="Move up" title="Move up" @click="moveConcept(ci, -1)"><ChevronUp class="h-5 w-5" /></button>
              <button type="button" class="rounded-md p-2 text-foreground/70 hover:bg-accent hover:text-foreground disabled:opacity-30" :disabled="ci === (unit.concepts ?? []).length - 1" aria-label="Move down" title="Move down" @click="moveConcept(ci, 1)"><ChevronDown class="h-5 w-5" /></button>
              <button type="button" class="rounded-md p-2 text-foreground/70 hover:bg-accent hover:text-foreground" aria-label="Edit concept" title="Edit" @click="startConceptEdit(c)"><Pencil class="h-5 w-5" /></button>
              <button type="button" class="rounded-md p-2 text-foreground/70 hover:bg-accent hover:text-destructive" aria-label="Remove concept" title="Remove" @click="removeConcept(c)"><Trash2 class="h-5 w-5" /></button>
            </div>
          </div>
        </li>
      </ol>
      <form class="mt-2 flex gap-2" @submit.prevent="addConcept">
        <Input class="h-11 text-base" v-model="newConcept" placeholder="Add a concept" maxlength="255" aria-label="New concept" />
        <Button size="lg" type="submit" variant="outline" :disabled="!newConcept.trim()"><Plus class="mr-1 h-5 w-5" />Add</Button>
      </form>
    </div>

    <!-- Grouping: the materials this unit uses -->
    <div v-if="materials.length">
      <h3 class="mb-2 text-base font-semibold">Materials in this unit</h3>
      <div class="grid gap-1 sm:grid-cols-2">
        <label v-for="m in materials" :key="m.id" class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-base hover:bg-accent">
          <input type="checkbox" class="accent-[hsl(var(--primary))]" :checked="draft.material_ids.includes(m.id)" @change="toggleMaterial(m.id)">
          <component :is="kindIcon[m.kind]" class="h-5 w-5 shrink-0 text-muted-foreground" />
          <span class="truncate">{{ m.title }}</span>
          <span v-if="draft.material_ids.includes(m.id)" class="ml-auto text-sm text-primary">#{{ draft.material_ids.indexOf(m.id) + 1 }}</span>
        </label>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button size="lg" type="button" variant="outline" @click="emit('close')">Cancel</Button>
      <Button size="lg" type="button" variant="outline" :disabled="saving || !draft.title.trim()" @click="save">{{ saving ? 'Saving…' : 'Save unit' }}</Button>
    </div>
  </div>
</template>
