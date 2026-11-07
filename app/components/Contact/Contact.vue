<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '@/components/ui/button/Button.vue';

    type Form = {
        topic: string;
        name: string;
        email: string;
        organisation: string;
        message: string;
        website: string;
    };

    const topics = [
        { value: 'account', label: 'Help with my account' },
        { value: 'course', label: 'A course I am taking' },
        { value: 'institution', label: 'Institutions and classes' },
        { value: 'bug', label: 'Report a problem' },
        { value: 'partnership', label: 'Partnership or press' },
        { value: 'other', label: 'Something else' },
    ];

    const faqs = [
        {
            q: 'How do I join a course?',
            a: 'Open the invite link your lecturer shared. Sign in, confirm the course, and start with the first unit. Each unit opens after you finish the one before it.',
        },
        {
            q: 'Can I keep my slides as they are?',
            a: 'Yes. Choose slides as written when you create a course. FocusFlow keeps your pages in order, and the AI only suggests where each unit starts and ends.',
        },
        {
            q: 'How do institutions work?',
            a: 'An institution account adds lecturers and their classes. Lecturers invite their own students and see results for their class, while every student keeps their own account.',
        },
    ];

    const blank = (): Form => ({
        topic: 'account',
        name: '',
        email: '',
        organisation: '',
        message: '',
        website: '',
    });

    const form = ref<Form>(blank());
    const sending = ref(false);
    const status = ref<{ ok: boolean; text: string } | null>(null);
    const errors = ref<Partial<Record<'name' | 'email' | 'message', string>>>({});

    const first = (value: unknown): string => {
        if (Array.isArray(value)) return value.length ? String(value[0]) : '';
        return value ? String(value) : '';
    };

    const composedMessage = (): string => {
        const label = topics.find((t) => t.value === form.value.topic)?.label ?? 'Message';
        const lines = [`Topic: ${label}`];
        if (form.value.topic === 'bug' && typeof window !== 'undefined') {
            lines.push(`Page: ${window.location.href}`);
        }
        lines.push('', form.value.message.trim());
        return lines.join('\n');
    };

    const submit = async () => {
        if (sending.value) return;
        sending.value = true;
        status.value = null;
        errors.value = {};

        try {
            const res = await $fetch<{ message: string }>('/api/contact', {
                method: 'POST',
                body: {
                    name: form.value.name.trim(),
                    email: form.value.email.trim(),
                    company: form.value.organisation.trim(),
                    phone: '',
                    country: '',
                    message: composedMessage(),
                    website: form.value.website,
                },
            });
            status.value = { ok: true, text: res.message };
            form.value = blank();
        } catch (e: any) {
            const outer = e?.data;
            const body = outer?.data ?? outer;
            const fields = body?.errors;

            if (fields && typeof fields === 'object') {
                errors.value = {
                    name: first(fields.name),
                    email: first(fields.email),
                    message: first(fields.message),
                };
            }

            status.value = {
                ok: false,
                text: outer?.message || body?.message || 'Could not send your message. Please try again.',
            };
        } finally {
            sending.value = false;
        }
    };
</script>

<template>
    <section id="contact" class="contact">
        <div class="contact__inner">
            <header class="contact__head">
                <div>
                    <p class="contact__eyebrow">Contact</p>
                    <h2 class="contact__title">Tell us what you <em>need</em>.</h2>
                </div>
                <p class="contact__lede">
                    Questions about an account, a class, an institution or a course? Send a message and we'll reply by email.
                </p>
            </header>

            <div class="contact__grid">
                <aside class="contact__aside">
                    <p class="contact__aside-label">Before you write</p>

                    <details v-for="faq in faqs" :key="faq.q">
                        <summary>{{ faq.q }}</summary>
                        <p>{{ faq.a }}</p>
                    </details>

                    <p class="contact__hint">
                        Reporting a problem? Tell us the page and what you expected to happen, so we can reproduce it.
                    </p>
                </aside>

                <form class="contact__form" @submit.prevent="submit">
                    <div class="contact__field">
                        <label for="contact-topic">What is this about?</label>
                        <select id="contact-topic" v-model="form.topic">
                            <option v-for="topic in topics" :key="topic.value" :value="topic.value">
                                {{ topic.label }}
                            </option>
                        </select>
                    </div>

                    <div class="contact__row">
                        <div class="contact__field">
                            <label for="contact-name">Your name</label>
                            <input
                                id="contact-name"
                                v-model="form.name"
                                type="text"
                                maxlength="120"
                                autocomplete="name"
                                required
                                :aria-invalid="!!errors.name"
                            >
                            <p v-if="errors.name" class="contact__error">{{ errors.name }}</p>
                        </div>

                        <div class="contact__field">
                            <label for="contact-email">Email</label>
                            <input
                                id="contact-email"
                                v-model="form.email"
                                type="email"
                                autocomplete="email"
                                required
                                :aria-invalid="!!errors.email"
                            >
                            <p v-if="errors.email" class="contact__error">{{ errors.email }}</p>
                        </div>
                    </div>

                    <div class="contact__field">
                        <label for="contact-organisation">
                            School or organisation <span>optional</span>
                        </label>
                        <input
                            id="contact-organisation"
                            v-model="form.organisation"
                            type="text"
                            maxlength="120"
                            autocomplete="organization"
                        >
                    </div>

                    <div class="contact__field">
                        <label for="contact-message">Message</label>
                        <textarea
                            id="contact-message"
                            v-model="form.message"
                            rows="6"
                            minlength="5"
                            maxlength="5000"
                            required
                            placeholder="Tell us what you need help with."
                            :aria-invalid="!!errors.message"
                        ></textarea>
                        <div class="contact__meta">
                            <p v-if="errors.message" class="contact__error">{{ errors.message }}</p>
                            <p class="contact__count" aria-hidden="true">{{ form.message.length }}/5000</p>
                        </div>
                    </div>

                    <input
                        v-model="form.website"
                        type="text"
                        name="website"
                        tabindex="-1"
                        autocomplete="off"
                        aria-hidden="true"
                        class="hidden"
                    >

                    <div class="contact__actions">
                        <p>We use your email only to reply to this message.</p>
                        <Button type="submit" :disabled="sending" class="contact__send">
                            {{ sending ? 'Sending…' : 'Send message' }}
                        </Button>
                    </div>

                    <p
                        v-if="status"
                        class="contact__status"
                        :class="status.ok ? 'contact__status--ok' : 'contact__status--error'"
                        :role="status.ok ? 'status' : 'alert'"
                    >
                        {{ status.text }}
                    </p>
                </form>
            </div>
        </div>
    </section>
</template>

<style scoped>
    .contact {
        --contact-card: #fbf2e5;
        --contact-ink: hsl(var(--foreground));
        --contact-muted: hsl(var(--muted-foreground));
        --contact-rule: hsl(var(--foreground) / 0.14);
        --contact-accent: hsl(var(--primary));
        --contact-serif: 'Instrument Serif', 'Iowan Old Style', Georgia, serif;
        --contact-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

        background: hsl(var(--background));
        color: var(--contact-ink);
        padding: clamp(4.5rem, 8vw, 7rem) 0;
        scroll-margin-top: 5rem;
    }

    :global(.dark) .contact {
        --contact-card: hsl(var(--card));
        --contact-rule: hsl(var(--foreground) / 0.16);
        --contact-muted: hsl(var(--muted-foreground) / 0.85);
    }

    .contact__inner {
        max-width: 72rem;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .contact__head {
        display: grid;
        gap: 1.75rem;
        border-top: 1px solid var(--contact-rule);
        padding-top: 1.75rem;
        margin-bottom: clamp(2.5rem, 5vw, 3.5rem);
    }

    @media (min-width: 900px) {
        .contact__head {
            grid-template-columns: minmax(0, 1fr) 22rem;
            align-items: end;
            gap: 3rem;
        }
    }

    .contact__eyebrow {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1.25rem;
        color: var(--contact-muted);
        font-family: var(--contact-mono);
        font-size: 0.6875rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }

    .contact__eyebrow::before {
        content: '';
        width: 1.75rem;
        height: 1px;
        background: var(--contact-accent);
    }

    .contact__title {
        margin: 0;
        font-family: var(--contact-serif);
        font-weight: 400;
        font-size: clamp(2.25rem, 4.8vw, 3.25rem);
        line-height: 1.02;
        letter-spacing: -0.015em;
    }

    .contact__title em {
        font-style: italic;
        color: var(--contact-accent);
    }

    .contact__lede {
        margin: 0;
        max-width: 38ch;
        color: var(--contact-muted);
        font-size: 0.9375rem;
        line-height: 1.7;
    }

    .contact__grid {
        display: grid;
        gap: 2.5rem;
    }

    @media (min-width: 960px) {
        .contact__grid {
            grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
            gap: 4rem;
            align-items: start;
        }
    }

    .contact__aside {
        order: 1;
    }

    .contact__form {
        order: 0;
    }

    @media (min-width: 960px) {
        .contact__aside,
        .contact__form {
            order: 0;
        }
    }

    .contact__aside-label {
        margin: 0 0 0.5rem;
        color: var(--contact-muted);
        font-family: var(--contact-mono);
        font-size: 0.625rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }

    .contact__aside details {
        border-top: 1px solid var(--contact-rule);
        padding: 1rem 0;
    }

    .contact__aside details:last-of-type {
        border-bottom: 1px solid var(--contact-rule);
    }

    .contact__aside summary {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        cursor: pointer;
        list-style: none;
        font-size: 0.9rem;
        font-weight: 500;
        line-height: 1.45;
    }

    .contact__aside summary::-webkit-details-marker {
        display: none;
    }

    .contact__aside summary::after {
        content: '+';
        flex: none;
        color: var(--contact-accent);
        font-family: var(--contact-mono);
        font-size: 0.8rem;
    }

    .contact__aside details[open] summary::after {
        content: '–';
    }

    .contact__aside details p {
        margin: 0.65rem 0 0;
        color: var(--contact-muted);
        font-size: 0.8125rem;
        line-height: 1.8;
    }

    .contact__hint {
        margin: 1.5rem 0 0;
        color: var(--contact-muted);
        font-size: 0.8125rem;
        line-height: 1.75;
    }

    .contact__form {
        background: var(--contact-card);
        border: 1px solid var(--contact-rule);
        border-radius: 1rem;
        padding: clamp(1.5rem, 3vw, 2.25rem);
    }

    .contact__row {
        display: grid;
        gap: 1.25rem;
    }

    @media (min-width: 560px) {
        .contact__row {
            grid-template-columns: 1fr 1fr;
        }
    }

    .contact__field {
        margin-top: 1.25rem;
    }

    .contact__form > .contact__field:first-child {
        margin-top: 0;
    }

    .contact__row .contact__field {
        margin-top: 1.25rem;
    }

    .contact__field label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.45rem;
        color: var(--contact-ink);
        font-size: 0.75rem;
        font-weight: 500;
    }

    .contact__field label span {
        color: var(--contact-muted);
        font-family: var(--contact-mono);
        font-size: 0.5625rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .contact__field input,
    .contact__field select,
    .contact__field textarea {
        display: block;
        width: 100%;
        border: 1px solid var(--contact-rule);
        border-radius: 0.5rem;
        background: hsl(var(--background));
        color: var(--contact-ink);
        font-size: 0.875rem;
        line-height: 1.5;
        padding: 0.65rem 0.8rem;
        transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    :global(.dark) .contact__field input,
    :global(.dark) .contact__field select,
    :global(.dark) .contact__field textarea {
        background: hsl(var(--background) / 0.45);
    }

    .contact__field textarea {
        resize: vertical;
        min-height: 8.5rem;
    }

    .contact__field input::placeholder,
    .contact__field textarea::placeholder {
        color: hsl(var(--muted-foreground) / 0.75);
    }

    .contact__field input:focus,
    .contact__field select:focus,
    .contact__field textarea:focus {
        outline: none;
        border-color: var(--contact-accent);
        box-shadow: 0 0 0 3px hsl(var(--primary) / 0.14);
    }

    .contact__field input[aria-invalid='true'],
    .contact__field textarea[aria-invalid='true'] {
        border-color: hsl(var(--destructive));
    }

    .contact__meta {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 0.35rem;
    }

    .contact__error {
        margin: 0.35rem 0 0;
        color: hsl(var(--destructive));
        font-size: 0.75rem;
        line-height: 1.4;
    }

    .contact__count {
        margin: 0 0 0 auto;
        color: var(--contact-muted);
        font-family: var(--contact-mono);
        font-size: 0.625rem;
        font-variant-numeric: tabular-nums;
    }

    .contact__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .contact__actions p {
        margin: 0;
        max-width: 30ch;
        color: var(--contact-muted);
        font-size: 0.6875rem;
        line-height: 1.6;
    }

    .contact__send {
        min-width: 10rem;
    }

    .contact__status {
        margin: 1rem 0 0;
        border-radius: 0.5rem;
        padding: 0.7rem 0.85rem;
        font-size: 0.8125rem;
        line-height: 1.5;
    }

    .contact__status--ok {
        background: hsl(150 60% 94%);
        color: hsl(152 60% 24%);
    }

    .contact__status--error {
        background: hsl(var(--destructive) / 0.1);
        color: hsl(var(--destructive));
    }

    :global(.dark) .contact__status--ok {
        background: hsl(150 40% 18%);
        color: hsl(150 60% 78%);
    }

    @media (max-width: 640px) {
        .contact__inner {
            padding: 0 1.25rem;
        }
    }
</style>
