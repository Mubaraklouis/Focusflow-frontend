// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],


  runtimeConfig: {
    // Defaults below = PRODUCTION (deployed EC2 backends). Any NUXT_* env
    // var overrides them, so local dev uses .env (localhost) and Vercel
    // works out-of-the-box with no dashboard config (still overridable).
    laravelApiUrl: '',                                  // NUXT_LARAVEL_API_URL
    laravelApiKey: '',
    usersApiUrl: 'http://129.121.85.106:8000',          // NUXT_USERS_API_URL (auth svc)
    coursesApiUrl: 'http://129.121.85.106:8081/api/course',   // NUXT_COURSES_API_URL (course svc)
    courseMaterialApiUrl: 'http://129.121.85.106:8082/api/courses', // NUXT_COURSE_MATERIAL_API_URL
    frontendUrl: 'https://focusfllow.vercel.app',       // NUXT_FRONTEND_URL (Origin/Referer to Laravel)
    storageUrl: 'http://129.121.85.106:9000',           // NUXT_STORAGE_URL (MinIO, used by the /api/thumb HTTPS proxy)

    public: {
      stripeKey: '',                                    // NUXT_PUBLIC_STRIPE_KEY
      backendUrl: 'http://129.121.85.106:8000',         // NUXT_PUBLIC_BACKEND_URL (client-side avatar URLs)
      storageBaseUrl: 'http://129.121.85.106:9000'      // NUXT_PUBLIC_STORAGE_BASE_URL (MinIO prefix rewritten to /api/thumb)
    }
  }



})


