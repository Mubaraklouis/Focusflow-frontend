/**
 * @fileoverview Update authenticated user profile on Laravel backend
 * @module server/api/user/profile/index.put
 * @description
 * Server-side handler that proxies profile update requests to the Laravel backend.
 * Updates the user's profile using the user_id stored in cookies during login/register.
 *
 * ## Endpoint
 * `PUT /api/user/profile`
 *
 * ## Authentication
 * Requires the `focusflow-user-id` cookie set during login/register.
 *
 * ## Request Body
 * ```typescript
 * {
 *   name?: string;
 *   username?: string;
 *   bio?: string;
 *   location?: string;
 *   website?: string;
 *   avatar?: string;
 * }
 * ```
 *
 * ## Response
 * Returns the updated user profile data from Laravel.
 *
 * @example
 * ```typescript
 * // Frontend usage
 * const { data, error } = await useFetch('/api/user/profile', {
 *   method: 'PUT',
 *   body: { name: 'John Doe', bio: 'New bio' }
 * })
 * console.log(data.value) // { status: 'success', message: '...', data: { ... } }
 * ```
 */

import type { UserUpdateResponse, UserUpdatePayload } from '~~/server/types/profile';
import useConfig from '~~/server/util/useConfig';

/**
 * PUT /api/user/profile
 *
 * Updates the user's profile on Laravel backend using stored user_id.
 *
 * @param event - H3 event object containing request context
 * @returns Promise resolving to updated user profile data
 * @throws 401 - User ID not found (not logged in)
 * @throws 422 - Validation errors
 * @throws 500 - Server error or backend unreachable
 */
export default defineEventHandler(async (event): Promise<UserUpdateResponse> => {
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

        // Get update payload from request body
        const body = await readBody<UserUpdatePayload>(event);

        // Update user profile on Laravel using PUT method
        const updateResponse = await $fetch<UserUpdateResponse>(`${baseUrl}/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: body,
        });

        return updateResponse;

    } catch (error: any) {
        // Handle validation errors
        if (error.response?.status === 422) {
            throw createError({
                statusCode: 422,
                message: error.data?.message || 'Validation failed',
                data: error.data?.errors,
            });
        }

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
            message: error.data?.message || error.message || 'Failed to update profile',
            data: error.data,
        });
    }
});
