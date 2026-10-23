# Deployment notes

The frontend (Vercel) talks to one backend, the FocusFlow API
(`https://api.focusflow.sswoco.org`, repo FoucFlow/focusflow-api).

- The browser only calls this app's `server/api/*` routes. They call the API
  with `server/util/api.ts` (`apiFetch`), which forwards the httpOnly
  `ff_session` cookie both ways.
- No Vercel environment variables are needed: `nuxt.config.ts` defaults
  `apiUrl` to production. Override with `NUXT_API_URL` (e.g. a local API at
  `http://localhost:8091`).
- Old variables (`NUXT_USERS_API_URL`, `NUXT_COURSES_API_URL`,
  `NUXT_COURSE_MATERIAL_API_URL`, `NUXT_STORAGE_URL`, `NUXT_PUBLIC_BACKEND_URL`,
  `NUXT_PUBLIC_STORAGE_BASE_URL`) are no longer read and can be deleted in Vercel.
- Google login: the Google Cloud OAuth client must list
  `https://focusfllow.vercel.app/api/v1/auth/google/callback` as a redirect URI.
