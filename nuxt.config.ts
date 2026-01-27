// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],


  runtimeConfig: {
    // Step 1: Define keys with empty strings or defaults
    laravelApiUrl: '',        // Nuxt looks for NUXT_LARAVEL_API_URL
    laravelApiKey: '',
    usersApiUrl: '',        // Nuxt looks for NUXT_USERS_API_URL
    coursesApiUrl: '',      // Nuxt looks for NUXT_COURSES_API_URL
    uploadUrl: '',          // Nuxt looks for NUXT_UPLOAD_URL

    public: {
      stripeKey: ''           // Nuxt looks for NUXT_PUBLIC_STRIPE_KEY
    }
  }



})


