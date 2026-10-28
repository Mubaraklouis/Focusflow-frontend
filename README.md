# FocusFlow Web

The web app for [FocusFlow](https://www.focus-flow.studio), a learning and assessment platform. Anyone can turn their own material (PDF, PowerPoint, YouTube videos, links) into a course of short units that learners finish one at a time. Lecturers and schools can add unit quizzes and final exams, invite a class, and see how each student is doing.

This repository is the Nuxt frontend. The backend is the Go service in [focusflow-api](https://github.com/FoucFlow/focusflow-api).

## What you can do in the app

**As a creator**

- Start a course and choose how to build it: **slides as written** (learners read your slides as you wrote them; the AI only suggests where units start and end) or **AI-written lessons** (the AI drafts lessons from your materials and you edit them).
- Upload PDFs and PowerPoint files, add YouTube videos and links, and watch each material being read.
- Cut the course into units, rename and reorder them, and fix slide pages in the page editor.
- Write quizzes or import them from CSV, GIFT or Aiken, set the test rules, and review marks the AI suggests.
- Publish, then share an invite link or code.

**As a learner**

- Join a course for free and study one unit at a time: slides and PDF pages with Previous and Next, or written lessons with their sources.
- Take the quiz at the end of each unit and the final exam, then get a certificate that anyone can verify by its code.

**In an institution**

- Owners add lecturers, lecturers invite their class, students consent to sharing their results, and lecturers see results per student.

**As an admin**

- Manage users, plans and institutions, and see AI usage and cost per model and per user.

## Stack

- [Nuxt 4](https://nuxt.com) and Vue 3 with TypeScript
- Tailwind CSS, Radix Vue and Lucide icons
- `pdfjs-dist` to render PDF pages, `markdown-it` for lesson text
- Deployed on Vercel

## How it talks to the API

The browser never calls the API directly. Every request goes to a Nuxt server route in `server/api/*`, and those routes call the API through one helper, `server/util/api.ts` (`apiFetch`):

```
browser  ->  Nuxt server route (server/api/*)  ->  apiFetch  ->  FocusFlow API
```

- `apiFetch` forwards only the `ff_session` cookie and copies the API's `Set-Cookie` back, so the httpOnly session cookie lives on the app's own domain.
- API errors come back with the same status and message, so forms can show field errors.
- Large uploads go straight from the browser to the API with a short-lived signed token, because a serverless function has a small request body limit.

## Layout

```
app/pages            routes: /learn (course builder and learning), /institutions,
                     /admin, /certificate/[code], /join/[code], auth pages
app/components       UI building blocks (components/ui) and feature components
                     (components/learn: builder steps, slide and PDF viewers,
                     quiz editor and import)
app/composables      data fetching and state per feature
server/api           proxy routes to the API
server/util/api.ts   apiFetch
```

## Run it locally

You need Node 22 and pnpm, and a running [FocusFlow API](https://github.com/FoucFlow/focusflow-api) (it can run with `AI_PROVIDER=fake`, so no AI keys are needed).

```bash
pnpm install
cp .env.example .env      # NUXT_API_URL=http://localhost:8091
pnpm dev                  # http://localhost:3000
```

Build for production:

```bash
pnpm build
pnpm preview
```

## Status

FocusFlow is in early use. The course builder, quizzes, slides, institutions and plans work in production. Not built yet: reporting a course and payments.

## License

[GNU Affero General Public License v3.0](LICENSE). You can use, study, change and share this code. If you run a changed version for other people over a network, you must publish your changes under the same license.

## Author

Built by [Mobarak Kuol Louis](https://www.linkedin.com/in/mobarak-kuol-louis), Software Engineer, Kigali.
