<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

// One PDF page drawn with pdf.js (F3.2), as wide as the reading column.
// The document is loaded once per material and shared between pages.
const props = defineProps<{ materialId: number; page: number }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const box = ref<HTMLDivElement | null>(null)
const error = ref('')
const loading = ref(true)

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<any> }
const docs: Map<number, Promise<PdfDoc>> = (globalThis as any).__ffPdfDocs ??= new Map()

async function loadDoc(id: number): Promise<PdfDoc> {
  if (!docs.has(id)) {
    docs.set(id, (async () => {
      const pdfjs = await import('pdfjs-dist')
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs.getDocument({ url: `/api/learn/materials/${id}/file`, withCredentials: true }).promise as Promise<PdfDoc>
    })())
  }
  return docs.get(id)!
}

let task: { cancel: () => void } | null = null
async function draw() {
  if (!canvas.value || !box.value) return
  loading.value = true
  error.value = ''
  try {
    const doc = await loadDoc(props.materialId)
    const page = await doc.getPage(props.page)
    const width = box.value.clientWidth || 600
    const base = page.getViewport({ scale: 1 })
    const scale = width / base.width
    const ratio = window.devicePixelRatio || 1
    const vp = page.getViewport({ scale: scale * ratio })
    const c = canvas.value
    c.width = vp.width
    c.height = vp.height
    c.style.width = `${width}px`
    c.style.height = `${vp.height / ratio}px`
    task?.cancel()
    task = page.render({ canvasContext: c.getContext('2d')!, viewport: vp })
    await (task as any).promise
  } catch (e: any) {
    if (e?.name !== 'RenderingCancelledException') error.value = 'This page could not be shown.'
  } finally {
    loading.value = false
  }
}
onMounted(draw)
watch(() => [props.materialId, props.page], draw)
let resizeTimer: ReturnType<typeof setTimeout> | undefined
const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(draw, 200) }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => { window.removeEventListener('resize', onResize); task?.cancel() })
</script>

<template>
  <div ref="box" class="relative w-full overflow-hidden rounded-2xl border border-border/70 bg-white" :class="loading ? 'min-h-[240px]' : ''">
    <div v-if="loading" class="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
    <canvas ref="canvas" :aria-label="`Page ${page}`" role="img" class="block" />
    <p v-if="error" class="p-4 text-[15px] text-destructive">{{ error }}</p>
  </div>
</template>
