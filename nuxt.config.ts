// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],


  runtimeConfig: {
    // Server-only. The browser never calls the API directly: every request
    // goes through server/api/* and server/util/api.ts (apiFetch).
    apiUrl: 'https://api.focusflow.sswoco.org',          // NUXT_API_URL (local: http://localhost:8091)

    public: {
      stripeKey: '',                                    // NUXT_PUBLIC_STRIPE_KEY
    }
  }



})


