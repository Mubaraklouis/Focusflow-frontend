/**
 * @module composables/course-material/useCleanDescription
 *
 * Pure helpers that strip the promotional noise out of YouTube video
 * descriptions before they're surfaced inside the FocusFlow player.
 *
 * What we strip:
 *   - Bare URLs (http/https/www)
 *   - Affiliate / shortener lines (bit.ly, lnk.to, linktr.ee, …)
 *   - Social-handle lines ("Twitter:", "Instagram:", "LinkedIn:", …)
 *   - "Subscribe" / "Follow" prompt lines
 *   - Channel ASCII separators ("▬▬▬", "━━━", "===", "***")
 *   - Multiple consecutive blank lines (collapsed to one)
 *
 * What we keep:
 *   - Plain prose (the actual lesson summary)
 *   - Timestamp lines (e.g. "0:00 - Intro") — these are useful for learners
 *   - Bullet/numbered list lines
 *
 * This is intentionally conservative: false positives mean we lose useful
 * content, which is worse than leaving a stray URL behind.
 */

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

// Lines we drop wholesale. Order matters — the most specific patterns first.
const NOISE_LINE_PATTERNS: RegExp[] = [
  /^[\s•►▶▸▪▫]*(subscribe|follow|like and subscribe|hit (?:the )?like|smash that like)/i,
  /^[\s•►▶▸▪▫]*(twitter|instagram|tiktok|linkedin|facebook|github|patreon|discord|telegram|threads)\s*[:|]/i,
  /^[\s•►▶▸▪▫]*(check out|join|support|sponsor|sponsored by|partner)\b/i,
  /^[\s•►▶▸▪▫]*(my (?:gear|setup|equipment|kit)|gear\s*[:|]|equipment\s*[:|])/i,
  /^[\s•►▶▸▪▫]*(promo|coupon|discount|code|use code)\s*[:|]/i,
  /^[\s•►▶▸▪▫]*(legal notice|disclaimer|copyright|trademark|all rights reserved)/i,
  /^[\s•►▶▸▪▫]*#\w+(\s+#\w+)*\s*$/, // pure-hashtag lines
];

// Separator-only lines (e.g. "▬▬▬▬▬▬", "===", "***").
const SEPARATOR_PATTERN = /^[\s]*([-=▬━─*•·]\s*){3,}[\s]*$/;

// Timestamp pattern we keep ("0:00", "12:34", "1:23:45").
const TIMESTAMP_PATTERN = /^\s*[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?[\s\-—–]/;

/**
 * Return true if a line should be dropped.
 */
const isNoise = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed === '') return false; // we collapse blanks elsewhere

  // Always keep timestamps even if they happen to contain a URL.
  if (TIMESTAMP_PATTERN.test(trimmed)) return false;

  if (SEPARATOR_PATTERN.test(trimmed)) return true;
  for (const pattern of NOISE_LINE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return false;
};

/**
 * Strip every URL from a line. If the line is then empty, return null so
 * the caller drops it.
 */
const stripUrls = (line: string): string | null => {
  const stripped = line.replace(URL_PATTERN, '').replace(/\s+/g, ' ').trim();
  return stripped === '' ? null : stripped;
};

/**
 * Clean a YouTube description into something pleasant to read inside
 * FocusFlow's distraction-free player.
 */
export const cleanDescription = (raw: string | null | undefined): string => {
  if (!raw) return '';

  const lines = raw.split(/\r?\n/);
  const kept: string[] = [];

  for (const line of lines) {
    if (isNoise(line)) continue;

    // For timestamp lines we keep URLs intact (some channels link the chapter
    // to a longer video). For everything else, strip URLs.
    const trimmed = line.trim();
    const out = TIMESTAMP_PATTERN.test(trimmed) ? trimmed : stripUrls(line);

    if (out === null) continue;
    kept.push(out);
  }

  // Collapse consecutive blank lines to a single blank line.
  const collapsed: string[] = [];
  let lastBlank = false;
  for (const line of kept) {
    const isBlank = line.trim() === '';
    if (isBlank && lastBlank) continue;
    collapsed.push(line);
    lastBlank = isBlank;
  }

  // Trim leading/trailing blank lines.
  while (collapsed.length && collapsed[0]!.trim() === '') collapsed.shift();
  while (collapsed.length && collapsed[collapsed.length - 1]!.trim() === '') collapsed.pop();

  return collapsed.join('\n');
};

/** Approx character budget for the collapsed preview state. */
export const DESCRIPTION_PREVIEW_CHARS = 280;

/**
 * Return a preview slice plus a flag indicating whether more remains.
 * Cuts at the nearest sentence end (`.`, `?`, `!`) or whitespace inside
 * the budget window to avoid awkward mid-word truncation.
 */
export const previewDescription = (
  cleaned: string,
  maxChars: number = DESCRIPTION_PREVIEW_CHARS,
): { preview: string; hasMore: boolean } => {
  if (!cleaned) return { preview: '', hasMore: false };
  if (cleaned.length <= maxChars) return { preview: cleaned, hasMore: false };

  // Try to cut at the last sentence end in the window.
  const window = cleaned.slice(0, maxChars);
  const sentenceEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('? '),
    window.lastIndexOf('! '),
    window.lastIndexOf('.\n'),
  );
  if (sentenceEnd >= Math.floor(maxChars * 0.6)) {
    return { preview: window.slice(0, sentenceEnd + 1).trim() + '…', hasMore: true };
  }

  // Otherwise cut at the last whitespace.
  const lastSpace = window.lastIndexOf(' ');
  const cut = lastSpace > 0 ? lastSpace : maxChars;
  return { preview: window.slice(0, cut).trim() + '…', hasMore: true };
};
