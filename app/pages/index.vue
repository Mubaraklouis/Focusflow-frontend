<template>
  <div class="mx-auto max-w-5xl">
    <!-- Hero -->
    <section class="px-1 pb-16 pt-6 text-center sm:pt-14">
      <h1 class="mx-auto max-w-3xl text-[34px] font-bold leading-tight tracking-tight text-foreground sm:text-[52px]">
        Turn the course you already have into one people finish.
      </h1>
      <p class="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg">
        FocusFlow turns your slides, PDFs and videos into short units that learners work through one at a time,
        with quizzes, final exams and class results built in. Learning on FocusFlow is free.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink to="/register"><Button size="lg">Get started</Button></NuxtLink>
        <a href="#how"><Button size="lg" variant="gray">See how it works</Button></a>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="scroll-mt-24 py-12">
      <h2 class="text-center text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]">How it works</h2>
      <ol class="mt-8 grid gap-4 sm:grid-cols-3">
        <li v-for="(step, i) in steps" :key="step.title" class="ff-group p-6">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">{{ i + 1 }}</span>
          <h3 class="mt-4 text-lg font-semibold text-foreground">{{ step.title }}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-muted-foreground">{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <!-- Two ways to build -->
    <section id="features" class="scroll-mt-24 py-12">
      <h2 class="text-center text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]">Two ways to build a course</h2>
      <p class="mx-auto mt-3 max-w-2xl text-center text-[17px] text-muted-foreground">
        You choose when you create the course. Either way, nothing reaches learners until you publish it.
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <div v-for="mode in modes" :key="mode.title" class="ff-group p-6">
          <component :is="mode.icon" class="h-6 w-6 text-primary" />
          <h3 class="mt-4 text-lg font-semibold text-foreground">{{ mode.title }}</h3>
          <p class="mt-1 text-sm font-medium text-muted-foreground">{{ mode.for }}</p>
          <p class="mt-3 text-[15px] leading-relaxed text-muted-foreground">{{ mode.text }}</p>
        </div>
      </div>
    </section>

    <!-- Quizzes and classes -->
    <section id="classes" class="scroll-mt-24 py-12">
      <h2 class="text-center text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]">Quizzes, exams and classes</h2>
      <ul class="ff-group mx-auto mt-8 max-w-3xl">
        <li v-for="item in assessment" :key="item.title" class="ff-item flex items-start gap-4 px-5 py-4">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <component :is="item.icon" class="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 class="font-semibold text-foreground">{{ item.title }}</h3>
            <p class="mt-1 text-[15px] leading-relaxed text-muted-foreground">{{ item.text }}</p>
          </div>
        </li>
      </ul>
    </section>

    <!-- Open source + closing call to action -->
    <section class="py-16 text-center">
      <h2 class="text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]">Start with the material you have</h2>
      <p class="mx-auto mt-3 max-w-2xl text-[17px] text-muted-foreground">
        Create an account, upload your first slides or PDF, and publish your first unit today.
        FocusFlow is open source: the
        <a href="https://github.com/FoucFlow/focusflow-api" target="_blank" rel="noopener" class="text-primary underline-offset-4 hover:underline">API</a>
        and the
        <a href="https://github.com/Mubaraklouis/Focusflow-frontend" target="_blank" rel="noopener" class="text-primary underline-offset-4 hover:underline">web app</a>
        are on GitHub.
      </p>
      <div class="mt-8 flex justify-center">
        <NuxtLink to="/register"><Button size="lg" variant="tinted">Create a free account</Button></NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { Award, BookOpen, ClipboardCheck, FileUp, Presentation, Sparkles, Users } from 'lucide-vue-next'

useHead({
  title: 'FocusFlow: turn your slides, PDFs and videos into a course',
  meta: [
    {
      name: 'description',
      content: 'FocusFlow turns your slides, PDFs and videos into short units that learners finish one at a time, with quizzes, final exams and class results.',
    },
  ],
})

const steps = [
  { title: 'Bring your material', text: 'Upload PowerPoint slides and PDFs, or add YouTube videos and links. Long files are read in parts, so you can publish early.' },
  { title: 'Shape the units', text: 'Cut the course into short units, rename and reorder them, and fix any page in the page editor.' },
  { title: 'Share and teach', text: 'Publish, then share an invite link or code. Learners join for free and open each unit after finishing the one before.' },
]

const modes = [
  {
    icon: Presentation,
    title: 'Slides as written',
    for: 'For teachers with an existing course',
    text: 'Learners read your slides and PDF pages exactly as you wrote them, one page at a time. The AI only suggests where units start and end and finds outside references. It never rewrites your teaching.',
  },
  {
    icon: Sparkles,
    title: 'AI-written lessons',
    for: 'For self-learners turning videos and notes into a course',
    text: 'The AI reads your materials, organises them into units and drafts each lesson with its sources. You edit and approve every unit before anyone sees it.',
  },
]

const assessment = [
  { icon: ClipboardCheck, title: 'A quiz after every unit, a final exam at the end', text: 'Write multiple choice and true/false questions in the app, or import them from CSV, GIFT or Aiken files.' },
  { icon: FileUp, title: 'Test rules you set', text: 'Time windows, timers, access codes and when answers are shown. Learners see the rules before they start.' },
  { icon: BookOpen, title: 'Explain your answer', text: 'Ask learners to explain their reasoning. The AI can suggest a mark, and you confirm or change it.' },
  { icon: Users, title: 'Classes for lecturers and schools', text: 'Invite a class, and with each student\'s consent see how every student is doing, unit by unit.' },
  { icon: Award, title: 'Certificates', text: 'Learners who finish get a certificate that anyone can check by its code.' },
]
</script>
