// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },


  runtimeConfig: {
    // Server-only. The browser never calls the API directly: every request
    // goes through server/api/* and server/util/api.ts (apiFetch).
    apiUrl: 'https://api.focusflow.sswoco.org',          // NUXT_API_URL (local: http://localhost:8091)

    public: {
      stripeKey: '',                                    // NUXT_PUBLIC_STRIPE_KEY
    }
  }



})


