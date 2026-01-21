/**
 * @fileoverview Fetch authenticated user profile from Laravel backend
 * @module server/api/user/profile/index.get
 * @description
 * Server-side handler that proxies profile requests to the Laravel backend.
 * Retrieves the user's profile using the user_id stored in cookies during login/register.
 *
 * ## Endpoint
 * `GET /api/user/profile`
 *
 * ## Authentication
 * Requires the `focusflow-user-id` cookie set during login/register.
 *
 * ## Response
 * Returns the user's profile data from Laravel.
 *
 * @example
 * ```typescript
 * // Frontend usage
 * const { data, error } = await useFetch('/api/user/profile')
 * console.log(data.value) // { status: 'success', data: { id: 1, name: 'John', ... } }
 * ```
 */

import type { UserProfileResponse } from '~~/server/types/profile';
import useConfig from '~~/server/util/useConfig';

/**
 * GET /api/user/profile
 *
 * Fetches the user's profile from Laravel backend using stored user_id.
 *
 * @param event - H3 event object containing request context
 * @returns Promise resolving to user profile data
 * @throws 401 - User ID not found (not logged in)
 * @throws 500 - Server error or backend unreachable
 */
export default defineEventHandler(async (event): Promise<UserProfileResponse> => {
    const { baseUrl } = useConfig();

    try {
        // Get user_id from cookie
        const userId = getCookie(event, 'focusflow-user-id');

        if (!userId) {
            throw createError({
                statusCode: 401,
                message: 'User not authenticated. Please log in.',
            });
        }

        // Fetch user profile from Laravel
        const profileResponse = await $fetch<UserProfileResponse>(`${baseUrl}/api/user/${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        return profileResponse;

    } catch (error: any) {
        // Handle not found
        if (error.response?.status === 404) {
            throw createError({
                statusCode: 404,
                message: 'User not found.',
            });
        }

        // Handle unauthenticated response
        if (error.response?.status === 401) {
            throw createError({
                statusCode: 401,
                message: 'Unauthenticated. Please log in.',
            });
        }

        // Handle other errors
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to fetch profile',
            data: error.data,
        });
    }
});
