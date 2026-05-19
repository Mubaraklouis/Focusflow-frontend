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
    usersApiUrl: 'http://56.228.5.72',                  // NUXT_USERS_API_URL (auth svc)
    coursesApiUrl: 'http://13.61.153.194/api/course',   // NUXT_COURSES_API_URL (course svc)
    courseMaterialApiUrl: 'http://13.48.190.13/api/courses', // NUXT_COURSE_MATERIAL_API_URL
    frontendUrl: 'https://focusfllow.vercel.app',       // NUXT_FRONTEND_URL (Origin/Referer to Laravel)

    public: {
      stripeKey: '',                                    // NUXT_PUBLIC_STRIPE_KEY
      backendUrl: 'http://56.228.5.72'                  // NUXT_PUBLIC_BACKEND_URL (client-side avatar URLs)
    }
  }



})


