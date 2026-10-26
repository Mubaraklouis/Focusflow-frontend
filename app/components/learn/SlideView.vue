<script setup lang="ts">
import { computed } from 'vue'
import { Shapes } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { SlidePage, SlideLine } from '~/composables/learn/useLearn'

// One slide as a reading page (F3.7): the teacher's own words, styled like
// our lessons. Diagrams point to the original slide (F3.8).
const props = defineProps<{
  page: SlidePage
  /** the original file, opened by the diagram card */
  materialUrl: string
  materialTitle: string
}>()

// Consecutive bullet lines form one list; other lines are paragraphs.
type Group = { list: true; lines: SlideLine[] } | { list: false; line: SlideLine }
const groupLines = (lines: SlideLine[] = []) => {
  const out: Group[] = []
  for (const l of lines) {
    const last = out[out.length - 1]
    if (l.bullet && last?.list) last.lines.push(l)
    else if (l.bullet) out.push({ list: true, lines: [l] })
    else out.push({ list: false, line: l })
  }
  return out
}

const markers = ['disc', 'circle', 'square']
const indent = (level: number) => ({ marginLeft: `${level * 1.4}em` })
const marker = (level: number) => ({ ...indent(level), listStyleType: markers[level % 3] })

const isPdfLike = computed(() => /\.pdf($|\?)/i.test(props.materialUrl))
</script>

<template>
  <div class="ff-prose">
    <template v-for="(b, i) in page.blocks" :key="i">
      <template v-if="b.type === 'text'">
        <template v-for="(g, j) in groupLines(b.lines)" :key="j">
          <ul v-if="g.list">
            <li v-for="(l, k) in g.lines" :key="k" :style="marker(l.level)" class="whitespace-pre-line">
              <template v-for="(r, n) in l.runs" :key="n">
                <a v-if="r.link" :href="r.link" target="_blank" rel="noopener noreferrer nofollow"
                  :class="{ 'font-semibold': r.bold, italic: r.italic }">{{ r.text }}</a>
                <code v-else-if="r.code">{{ r.text }}</code>
                <span v-else :class="{ 'font-semibold': r.bold, italic: r.italic }">{{ r.text }}</span>
              </template>
            </li>
          </ul>
          <p v-else :style="indent(g.line.level)" class="whitespace-pre-line">
            <template v-for="(r, n) in g.line.runs" :key="n">
              <a v-if="r.link" :href="r.link" target="_blank" rel="noopener noreferrer nofollow"
                :class="{ 'font-semibold': r.bold, italic: r.italic }">{{ r.text }}</a>
              <code v-else-if="r.code">{{ r.text }}</code>
              <span v-else :class="{ 'font-semibold': r.bold, italic: r.italic }">{{ r.text }}</span>
            </template>
          </p>
        </template>
      </template>

      <pre v-else-if="b.type === 'code'"><code>{{ b.code }}</code></pre>

      <figure v-else-if="b.type === 'image'">
        <img :src="b.src" :alt="b.alt || ''" loading="lazy" class="mx-auto h-auto max-h-[60vh] w-full bg-foreground/[0.03] object-contain">
        <figcaption v-if="b.alt" class="mt-2 text-center text-[13px] text-muted-foreground">{{ b.alt }}</figcaption>
      </figure>

      <div v-else-if="b.type === 'table'" class="overflow-x-auto">
        <table>
          <thead v-if="b.header && b.rows?.length">
            <tr><th v-for="(c, n) in b.rows[0]" :key="n" class="whitespace-pre-line">{{ c }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, m) in (b.header ? b.rows?.slice(1) : b.rows)" :key="m">
              <td v-for="(c, n) in row" :key="n" class="whitespace-pre-line">{{ c }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Diagram: until we can draw it here, point to the original slide -->
      <div v-else-if="b.type === 'diagram'" class="ff-group flex flex-wrap items-center gap-3 px-4 py-3.5">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary"><Shapes class="h-[18px] w-[18px]" /></span>
        <div class="min-w-0 basis-48 flex-1">
          <p class="text-[15px] font-medium leading-snug">This slide has a diagram</p>
          <p class="truncate text-[13px] leading-snug text-muted-foreground">
            {{ isPdfLike ? 'Page' : 'Slide' }} {{ page.number }} in {{ materialTitle }}
          </p>
        </div>
        <a :href="isPdfLike ? `${materialUrl}#page=${page.number}` : materialUrl" target="_blank" rel="noopener noreferrer" class="ml-auto">
          <Button size="lg" variant="tinted" tabindex="-1">{{ isPdfLike ? 'Open page' : 'Open original' }}</Button>
        </a>
      </div>
    </template>
  </div>
</template>
