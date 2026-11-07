<script setup lang="ts">
    type Entry = {
        id: number;
        name: string;
        position: string;
        feedback: string;
        url?: string;
    };

    // The 13 entries, grouped by what they answer. These are product
    // descriptions, not customer quotes.
    const entries: Entry[] = [
        { id: 1, name: "Lecturers", position: "Teach the course you already have", feedback: "Bring the PowerPoint or PDF course you already teach. Students read your slides page by page, exactly as you wrote them." },
        { id: 2, name: "Self-learners", position: "Learning on your own", feedback: "Turn YouTube videos and your notes into short units, with the AI drafting each lesson from your sources for you to edit." },
        { id: 3, name: "Schools and universities", position: "Institutions", feedback: "Add your lecturers, let them invite their classes, and keep a record of each student's consent to share results." },
        { id: 4, name: "Students", position: "Taking a course", feedback: "Join for free with a link or code, finish one unit at a time, and see your own progress as you go." },
        { id: 5, name: "Unit quizzes", position: "After every unit", feedback: "A short quiz checks each unit before the next one opens." },
        { id: 6, name: "Final exams", position: "At the end of the course", feedback: "A final exam closes the course, with the time window, timer and access code you choose." },
        { id: 7, name: "Question import", position: "Bring your question bank", feedback: "Import questions from CSV, GIFT or Aiken files instead of typing them again." },
        { id: 8, name: "Explain your answer", position: "Fairer marking", feedback: "Learners explain their reasoning. The AI can suggest a mark, and you decide." },
        { id: 9, name: "Certificates", position: "When learners finish", feedback: "Every certificate has a code that anyone can check online." },
        { id: 10, name: "Your teaching stays yours", position: "Slides as written", feedback: "The AI only suggests where units start and end and finds outside references. It never rewrites your slides." },
        { id: 11, name: "AI with limits", position: "Spending you can see", feedback: "Every AI call is logged with its cost, and each creator has a daily and monthly allowance." },
        { id: 12, name: "Publish early", position: "Long PDFs and videos", feedback: "Long materials are read in parts, so you can publish the first units while the rest is still being read." },
        { id: 13, name: "Open source", position: "Code on GitHub", feedback: "FocusFlow's API and web app are open source under the AGPL-3.0.", url: "https://github.com/FoucFlow/focusflow-api" },
    ];

    const groups = [
        { id: "people", label: "The people", entries: entries.slice(0, 4) },
        { id: "assessment", label: "Assessment", entries: entries.slice(4, 9) },
        { id: "how", label: "How it works", entries: entries.slice(9, 13) },
    ];

    const pad = (id: number) => String(id).padStart(2, "0");
</script>

<template>
    <section id="testimonies" class="who">
        <div class="who__inner">
            <header class="who__head">
                <div class="who__intro">
                    <p class="who__eyebrow">Who it's for</p>
                    <h2 class="who__title">Built for the way you <em>teach and learn</em>.</h2>
                </div>
                <p class="who__lede">Here's what FocusFlow does for each person who uses it.</p>
            </header>

            <div v-for="group in groups" :key="group.id" class="who__group">
                <p class="who__group-label">
                    <span>{{ group.label }}</span>
                    <span class="who__group-rule" aria-hidden="true"></span>
                </p>

                <div class="who__index">
                    <article v-for="entry in group.entries" :key="entry.id" class="who__row">
                        <span class="who__no" aria-hidden="true">{{ pad(entry.id) }}</span>

                        <h3 class="who__name">
                            <a v-if="entry.url" :href="entry.url" target="_blank" rel="noopener">
                                {{ entry.name }}<span class="who__arrow" aria-hidden="true">↗</span>
                            </a>
                            <template v-else>{{ entry.name }}</template>
                        </h3>

                        <p class="who__copy">{{ entry.feedback }}</p>
                        <p class="who__tag">{{ entry.position }}</p>
                    </article>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
    .who {
        --who-serif: 'Instrument Serif', 'Iowan Old Style', Georgia, serif;
        --who-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        --who-bg: #fbf2e5;
        --who-rule: hsl(var(--foreground) / 0.14);
        --who-ink: hsl(var(--foreground));
        --who-muted: hsl(var(--muted-foreground));
        --who-accent: hsl(var(--primary));

        background: var(--who-bg);
        color: var(--who-ink);
        padding: clamp(4.5rem, 8vw, 7rem) 0;
        scroll-margin-top: 5rem;
    }

    :global(.dark) .who {
        --who-bg: #0f1729;
        --who-rule: hsl(var(--foreground) / 0.16);
        --who-muted: hsl(var(--muted-foreground) / 0.85);
    }

    .who__inner {
        max-width: 72rem;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .who__head {
        display: grid;
        gap: 1.75rem;
        border-top: 1px solid var(--who-rule);
        padding-top: 1.75rem;
        margin-bottom: clamp(2.5rem, 5vw, 4rem);
    }

    @media (min-width: 900px) {
        .who__head {
            grid-template-columns: minmax(0, 1fr) 21rem;
            align-items: end;
            gap: 3rem;
        }
    }

    .who__eyebrow {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1.25rem;
        color: var(--who-muted);
        font-family: var(--who-mono);
        font-size: 0.6875rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }

    .who__eyebrow::before {
        content: '';
        width: 1.75rem;
        height: 1px;
        background: var(--who-accent);
    }

    .who__title {
        margin: 0;
        font-family: var(--who-serif);
        font-weight: 400;
        font-size: clamp(2.25rem, 4.8vw, 3.4rem);
        line-height: 1.02;
        letter-spacing: -0.015em;
    }

    .who__title em {
        font-style: italic;
        color: var(--who-accent);
    }

    .who__lede {
        margin: 0;
        max-width: 34ch;
        color: var(--who-muted);
        font-size: 0.9375rem;
        line-height: 1.7;
    }

    .who__group + .who__group {
        margin-top: 2.75rem;
    }

    .who__group-label {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0 0 0.75rem;
        color: var(--who-accent);
        font-family: var(--who-mono);
        font-size: 0.625rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }

    .who__group-rule {
        flex: 1;
        height: 1px;
        background: var(--who-rule);
    }

    .who__index {
        border-top: 1px solid var(--who-rule);
    }

    .who__row {
        display: grid;
        grid-template-columns: 2.25rem minmax(0, 1fr);
        column-gap: 1rem;
        row-gap: 0.5rem;
        border-bottom: 1px solid var(--who-rule);
        padding: 1.5rem 0;
    }

    .who__no {
        color: var(--who-muted);
        font-family: var(--who-mono);
        font-size: 0.625rem;
        line-height: 1;
        padding-top: 0.55rem;
        font-variant-numeric: tabular-nums;
    }

    .who__name {
        margin: 0;
        font-family: var(--who-serif);
        font-weight: 400;
        font-size: clamp(1.35rem, 2.4vw, 1.7rem);
        line-height: 1.1;
        letter-spacing: -0.01em;
        transition: color 200ms ease;
    }

    .who__name a {
        color: inherit;
        text-decoration: none;
    }

    .who__arrow {
        display: inline-block;
        margin-left: 0.35rem;
        font-family: var(--who-mono);
        font-size: 0.75rem;
        color: var(--who-accent);
        transition: transform 200ms ease;
    }

    .who__copy {
        grid-column: 2;
        margin: 0;
        max-width: 58ch;
        color: var(--who-muted);
        font-size: 0.8125rem;
        line-height: 1.8;
    }

    .who__tag {
        display: none;
        margin: 0;
        color: var(--who-muted);
        font-family: var(--who-mono);
        font-size: 0.625rem;
        line-height: 1.6;
        letter-spacing: 0.02em;
        text-align: right;
    }

    .who__row:hover .who__name {
        color: var(--who-accent);
    }

    .who__row:hover .who__arrow {
        transform: translate(2px, -2px);
    }

    @media (min-width: 860px) {
        .who__row {
            grid-template-columns: 2.75rem minmax(0, 1.05fr) minmax(0, 1.65fr) 8.5rem;
            column-gap: 2.25rem;
            align-items: start;
            padding: 1.7rem 0;
        }

        .who__copy {
            grid-column: auto;
            font-size: 0.8125rem;
            line-height: 1.85;
        }

        .who__tag {
            display: block;
            padding-top: 0.35rem;
        }
    }

    @media (max-width: 640px) {
        .who__inner {
            padding: 0 1.25rem;
        }
    }
</style>
