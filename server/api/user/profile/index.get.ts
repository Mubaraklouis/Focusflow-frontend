import type { UserProfileResponse } from '~~/server/types/profile'
import { apiFetch } from '~~/server/util/api'

/** GET /api/user/profile → the signed-in user's profile (API GET /api/user). */
export default defineEventHandler(async (event): Promise<UserProfileResponse> => {
  return apiFetch<UserProfileResponse>(event, '/api/user')
})
