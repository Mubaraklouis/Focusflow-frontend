import type { SlideBlock, SlideLine, SlideRun } from '~/composables/learn/useLearn'

/**
 * Slide page ↔ editable text (page editor, F3.6).
 * Text lines: two spaces per level, "- " for a bullet, **bold**, *italic*,
 * `code`, [text](https://link). Code blocks are ``` fences. Pictures, tables
 * and the diagram card are placeholder lines ([picture 1], [table 1],
 * [diagram]) so they can be moved or removed but not invented.
 */

function runToMd(r: SlideRun): string {
  let t = r.text
  if (r.code) t = '`' + t + '`'
  if (r.italic) t = '*' + t + '*'
  if (r.bold) t = '**' + t + '**'
  if (r.link) t = `[${t}](${r.link})`
  return t
}

export function blocksToText(blocks: SlideBlock[]): string {
  const out: string[] = []
  let pic = 0
  let tbl = 0
  for (const b of blocks) {
    if (b.type === 'text') {
      for (const l of b.lines ?? []) {
        const text = l.runs.map(runToMd).join('').replace(/\n/g, ' ')
        out.push('  '.repeat(l.level) + (l.bullet ? '- ' : '') + text)
      }
      out.push('')
    } else if (b.type === 'code') {
      out.push('```', b.code ?? '', '```', '')
    } else if (b.type === 'image') {
      out.push(`[picture ${++pic}]`, '')
    } else if (b.type === 'table') {
      out.push(`[table ${++tbl}]`, '')
    } else if (b.type === 'diagram') {
      out.push('[diagram]', '')
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// Inline Markdown → runs (bold, italic, code, links); anything else is text.
const INLINE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*/g
function mdToRuns(text: string, base: Partial<SlideRun> = {}): SlideRun[] {
  const runs: SlideRun[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) runs.push({ ...base, text: text.slice(last, m.index) })
    if (m[1] !== undefined) runs.push(...mdToRuns(m[1], { ...base, link: m[2] }))
    else if (m[3] !== undefined) runs.push(...mdToRuns(m[3], { ...base, bold: true }))
    else if (m[4] !== undefined) runs.push({ ...base, text: m[4], code: true })
    else if (m[5] !== undefined) runs.push(...mdToRuns(m[5], { ...base, italic: true }))
    last = m.index! + m[0].length
  }
  if (last < text.length) runs.push({ ...base, text: text.slice(last) })
  return runs.filter((r) => r.text)
}

export function textToBlocks(text: string, original: SlideBlock[]): SlideBlock[] {
  const pics = original.filter((b) => b.type === 'image')
  const tables = original.filter((b) => b.type === 'table')
  const out: SlideBlock[] = []
  let lines: SlideLine[] = []
  const flush = () => {
    if (lines.length) out.push({ type: 'text', lines })
    lines = []
  }
  const rows = text.replace(/\r\n/g, '\n').split('\n')
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.trim() === '```') {
      flush()
      const code: string[] = []
      for (i++; i < rows.length && rows[i].trim() !== '```'; i++) code.push(rows[i])
      out.push({ type: 'code', code: code.join('\n') })
      continue
    }
    const ph = row.trim().match(/^\[(picture|table) (\d+)\]$|^\[diagram\]$/)
    if (ph) {
      flush()
      if (row.trim() === '[diagram]') out.push({ type: 'diagram' })
      else {
        const b = (ph[1] === 'picture' ? pics : tables)[Number(ph[2]) - 1]
        if (b) out.push(b)
      }
      continue
    }
    if (!row.trim()) {
      flush()
      continue
    }
    const indent = row.match(/^ */)![0].length
    let body = row.trimStart()
    const bullet = /^[-*•] /.test(body)
    if (bullet) body = body.slice(2)
    lines.push({ level: Math.min(8, Math.floor(indent / 2)), bullet, runs: mdToRuns(body) })
  }
  flush()
  return out
}
