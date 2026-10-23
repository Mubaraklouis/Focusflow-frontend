/**
 * GET /api/v1/auth/google/redirect → sends the browser to Google.
 * The API answers with a 302 to Google's consent screen (signed state).
 */
export default defineEventHandler(async (event) => {
  const { apiUrl } = useRuntimeConfig(event)
  const res = await $fetch.raw(`${apiUrl}/api/v1/auth/google/redirect`, {
    redirect: 'manual',
    ignoreResponseError: true,
  })
  const location = res.headers.get('location')
  if (!location) {
    throw createError({ statusCode: res.status || 502, message: (res._data as any)?.message || 'Google login is not available' })
  }
  return sendRedirect(event, location)
})
