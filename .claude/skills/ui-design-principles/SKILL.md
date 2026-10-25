---
name: ui-design-principles
description: FocusFlow's UI standard. Use for ANY frontend UI work in this repo — building or changing a page, component, form, dialog, step flow, empty/loading/error state, layout, spacing, colours, typography or buttons, and any "clean up", "redesign", "polish" or "make it simpler" request. Every page must follow these rules.
---

# FocusFlow UI design principles

FocusFlow pages are calm, clean and obvious. Apply every rule below to any
page you touch; when you change part of a page, bring the rest of it up to
this standard if it is small, or say what still differs.

## 1. One page, one job

- Every page does **one thing**. Write that job in one short sentence before
  building (e.g. "Upload the course materials"). If you need "and" to
  describe it, split the page.
- Remove anything that does not serve that job. Move it to the page whose job
  it is, or drop it.
- Long multi-part tasks become a **step flow** (section 6), not one long page.
- Secondary information (limits, tips, allowance) is one quiet line, never a
  card competing with the main content.

## 2. Spacing

Use the Tailwind 4 px scale and only these steps:

| Use | Class |
|---|---|
| Inside small controls, icon gaps | `gap-1` `gap-2` (4–8 px) |
| Between related items in a list or form | `gap-3` `space-y-3` (12 px) |
| Between fields, inside cards | `p-4` / `p-5`, `space-y-4` (16–20 px) |
| Between sections of a page | `space-y-8` / `mt-8` (32 px) |
| Page top and bottom | `py-8` mobile, `py-12` desktop (32–48 px) |

- Page content width: `max-w-2xl` for forms and step flows, `max-w-5xl` for
  lists and dashboards; always `mx-auto px-4`.
- Be generous with whitespace: when in doubt, more space and fewer boxes.
- Same spacing for the same thing everywhere (every list row, every card).

## 3. Colour

Use only the theme tokens from `app/assets/css/main.css` (light and dark are
already defined), never raw hex or Tailwind palette colours, except the
status colours below:

- `primary` (FocusFlow orange): the one primary action, progress bars,
  the current step. Nothing decorative.
- `foreground` / `muted-foreground`: text and secondary text.
- `border`, `muted`, `card`, `accent`: surfaces and hover.
- `destructive`: errors and delete confirmation only.
- Status: success `text-green-700 dark:text-green-400`, warning
  `text-amber-700 dark:text-amber-400`. Use sparingly, with an icon or word,
  never colour alone.

## 4. Typography

One scale, font Instrument Sans (already the default):

| Role | Classes |
|---|---|
| Page title (one per page) | `text-2xl font-semibold tracking-tight` |
| Section title | `text-base font-semibold` |
| Body | `text-sm` (default `text-foreground`) |
| Help, meta, captions | `text-sm text-muted-foreground` or `text-xs text-muted-foreground` |

- No more than these four sizes on a page. No all-caps paragraphs, no bold
  sentences for emphasis — use the hierarchy instead.
- Under the page title, at most one short sentence saying what to do here.

## 5. Buttons and actions

Use `Button` from `@/components/ui/button` (variants `default`, `outline`,
`ghost`, `secondary`).

- **Exactly one primary action per page** (`variant="default"`): the thing
  the page exists for (Next, Publish, Save).
- Secondary actions: `variant="ghost"` or `variant="outline"`, or a text link
  (`text-sm text-primary hover:underline`). Destructive actions are ghost or
  icon buttons with `hover:text-destructive` and a confirmation.
- Row actions (edit, delete, move) are small icon buttons with a `title`
  and `aria-label`, muted until hover.
- Disabled buttons say why, in one muted line next to or under them.
- Labels are verbs: "Upload files", "Publish course", not "OK" or "Submit".

## 6. Step-flow pattern (e.g. course creation)

Use `StepShell` (`app/components/learn/StepShell.vue`) for every multi-step flow:

- A step indicator at the top: `1 · 2 · 3` with the step names; current step
  in `primary`, done steps clickable, later steps muted.
- One step per route (`/learn/[id]/upload`, `/organise`, `/review`), so Back
  in the browser and links work.
- **Back** (ghost, left) and **Next** (primary, right) at the bottom, in the
  same place on every step; a quiet **Skip** (ghost) next to Next where a
  step can be skipped. On mobile the bar is sticky at the bottom.
- The last step holds the final action (e.g. Publish), guarded by an explicit
  confirmation ("I agree") when it has consequences.
- Steps never lose work: everything saves as it happens.

## 7. Empty, loading and error states

Every list or async area has all three, designed on purpose:

- **Empty**: one line saying what goes here + the action to fill it
  (e.g. "No materials yet. Drop PDF or PowerPoint files above."). Dashed
  border box, centred, muted text.
- **Loading**: skeleton rows (`animate-pulse bg-muted rounded`) for page
  loads; a small `Loader2 animate-spin` with a word ("Reading…") for an item
  in progress; a progress bar with a percentage for long AI work.
- **Error**: say what happened and what to do, in plain words, next to the
  thing that failed (a failed upload shows the reason on its row with
  **Retry**). Page-level errors use
  `bg-destructive/10 text-destructive rounded-lg p-4` with a Try again
  button. Never show raw error codes.
- Waiting is not failing: work that continues by itself says so
  ("Waiting for the AI — this continues automatically").

## 8. Layout and responsiveness

- Mobile first: everything works at 360 px wide; no horizontal scroll; tap
  targets at least 40 px high.
- Single column by default; two columns only for short paired fields on
  `sm:` and up.
- Align everything to one left edge; avoid nested cards (a card inside a
  card is a sign the page does two jobs).
- Prefer list rows with dividers (`divide-y divide-border`) over a card per
  item.

## 9. Before you finish

Check the page against this list:

1. Can I state its one job in one sentence?
2. Is there exactly one primary button?
3. Only theme tokens, the four type sizes, and the spacing steps above?
4. Empty, loading and error states all designed?
5. Works at 360 px and on desktop, in light and dark mode?
6. Reused existing components (`Button`, `Input`, `Label`, `Checkbox`,
   `Card`, `Dialog`, `StepShell`) and no new UI library?
