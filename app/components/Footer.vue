<script setup lang="ts">
    const currentYear = new Date().getFullYear();

    const apiRepo = 'https://github.com/FoucFlow/focusflow-api';
    const webRepo = 'https://github.com/Mubaraklouis/Focusflow-frontend';

    const groups = [
        {
            label: 'Learn',
            links: [
                { label: 'Browse courses', to: '/courses' },
                { label: 'My learning', to: '/learn' },
                { label: 'Quiz history', to: '/quizzes' },
            ],
        },
        {
            label: 'Teach',
            links: [
                { label: 'Create a course', to: '/learn/new' },
                { label: 'Your courses', to: '/teacher/courses' },
                { label: 'Institutions', to: '/institutions' },
            ],
        },
        {
            label: 'FocusFlow',
            links: [
                { label: 'Contact us', to: '/#contact' },
                { label: 'Backend on GitHub', href: apiRepo },
                { label: 'Web app on GitHub', href: webRepo },
            ],
        },
    ];
</script>

<template>
    <footer class="footer">
        <div class="footer__inner">
            <div class="footer__top">
                <div class="footer__brand">
                    <NuxtLink to="/" class="footer__mark">FocusFlow</NuxtLink>
                    <p class="footer__statement">Your own material, turned into <em>short courses</em>.</p>
                    <div class="footer__actions">
                        <NuxtLink to="/register" class="footer__cta footer__cta--primary">Create a free account</NuxtLink>
                        <NuxtLink to="/login" class="footer__cta footer__cta--quiet">Sign in</NuxtLink>
                    </div>
                </div>

                <nav class="footer__links" aria-label="Footer">
                    <div v-for="group in groups" :key="group.label" class="footer__group">
                        <p class="footer__group-label">{{ group.label }}</p>
                        <ul>
                            <li v-for="link in group.links" :key="link.label">
                                <NuxtLink v-if="link.to" :to="link.to">{{ link.label }}</NuxtLink>
                                <a v-else :href="link.href" target="_blank" rel="noopener noreferrer">
                                    {{ link.label }}<span class="footer__external" aria-hidden="true">↗</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>

            <div class="footer__bottom">
                <p>© {{ currentYear }} FocusFlow. All rights reserved.</p>
                <div class="footer__meta">
                    <a :href="`${apiRepo}/blob/main/LICENSE`" target="_blank" rel="noopener noreferrer">Open source · AGPL-3.0</a>
                    <a :href="webRepo" target="_blank" rel="noopener noreferrer" class="footer__github" aria-label="FocusFlow on GitHub">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
    .footer {
        --footer-bg: #fbf2e5;
        --footer-ink: hsl(var(--foreground));
        --footer-muted: hsl(var(--muted-foreground));
        --footer-rule: hsl(var(--foreground) / 0.14);
        --footer-accent: hsl(var(--primary));
        --footer-serif: 'Instrument Serif', 'Iowan Old Style', Georgia, serif;
        --footer-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

        background: var(--footer-bg);
        color: var(--footer-ink);
        border-top: 1px solid var(--footer-rule);
        padding: clamp(3.5rem, 7vw, 5.5rem) 0 1.75rem;
    }

    :global(.dark .footer) {
        --footer-bg: #0f1729;
        --footer-rule: hsl(var(--foreground) / 0.16);
        --footer-muted: hsl(var(--muted-foreground) / 0.85);
    }

    .footer__inner {
        max-width: 72rem;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .footer__top {
        display: grid;
        gap: 3.5rem;
    }

    @media (min-width: 960px) {
        .footer__top {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.35fr);
            gap: 5rem;
        }
    }

    .footer__brand {
        max-width: 30rem;
    }

    .footer__mark {
        display: inline-block;
        font-family: var(--footer-serif);
        font-size: 1.75rem;
        line-height: 1;
        letter-spacing: -0.01em;
        color: var(--footer-ink);
        text-decoration: none;
    }

    .footer__statement {
        margin: 1.5rem 0 0;
        font-family: var(--footer-serif);
        font-weight: 400;
        font-size: clamp(1.6rem, 3vw, 2.15rem);
        line-height: 1.15;
        letter-spacing: -0.01em;
    }

    .footer__statement em {
        font-style: italic;
        color: var(--footer-accent);
    }

    .footer__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.75rem;
    }

    .footer__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 2.5rem;
        padding: 0 1rem;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
    }

    .footer__cta--primary {
        background: var(--footer-accent);
        color: hsl(var(--primary-foreground));
    }

    .footer__cta--primary:hover {
        background: hsl(var(--primary) / 0.9);
    }

    .footer__cta--quiet {
        height: auto;
        padding: 0;
        color: var(--footer-muted);
        font-weight: 500;
    }

    .footer__cta--quiet:hover {
        color: var(--footer-accent);
    }

    .footer__links {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2.25rem 1.5rem;
    }

    @media (min-width: 640px) {
        .footer__links {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    .footer__group-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1.1rem;
        color: var(--footer-muted);
        font-family: var(--footer-mono);
        font-size: 0.625rem;
        font-weight: 500;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .footer__group-label::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--footer-rule);
    }

    .footer__links ul {
        display: grid;
        gap: 0.65rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .footer__links a {
        display: inline-flex;
        align-items: baseline;
        gap: 0.3rem;
        color: var(--footer-ink);
        font-size: 0.8125rem;
        line-height: 1.4;
        text-decoration: none;
        transition: color 150ms ease;
    }

    .footer__links a:hover {
        color: var(--footer-accent);
    }

    .footer__external {
        color: var(--footer-muted);
        font-family: var(--footer-mono);
        font-size: 0.625rem;
    }

    .footer__bottom {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: clamp(3rem, 6vw, 4.5rem);
        padding-top: 1.5rem;
        border-top: 1px solid var(--footer-rule);
        color: var(--footer-muted);
        font-size: 0.75rem;
    }

    .footer__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem;
    }

    .footer__meta a {
        color: inherit;
        text-decoration: none;
        transition: color 150ms ease;
    }

    .footer__meta a:hover {
        color: var(--footer-accent);
    }

    .footer__github {
        display: inline-flex;
        align-items: center;
    }

    @media (max-width: 640px) {
        .footer__inner {
            padding: 0 1.25rem;
        }
    }
</style>
