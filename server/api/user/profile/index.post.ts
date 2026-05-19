/**
 * @fileoverview Upload user avatar to Laravel backend
 * @module server/api/user/profile/index.post
 * @description
 * Server-side handler that proxies avatar upload requests to the Laravel backend.
 * Handles multipart/form-data for avatar image uploads only.
 *
 * ## Endpoint
 * `POST /api/user/profile`
 *
 * ## Authentication
 * Requires the `focusflow-user-id` cookie set during login/register.
 *
 * ## Request Body (multipart/form-data)
 * - avatar: File (required) - image file for avatar
 *
 * ## Response
 * Returns the updated user profile data from Laravel.
 */

import type { UserUpdateResponse } from '~~/server/types/profile';
import useConfig from '~~/server/util/useConfig';

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

        // Read multipart form data
        const formData = await readMultipartFormData(event);

        if (!formData) {
            throw createError({
                statusCode: 400,
                message: 'No form data received',
            });
        }

        // Create a new FormData to send to Laravel
        const laravelFormData = new FormData();

        // Process the avatar file from the multipart data
        for (const field of formData) {
            if (field.filename && field.name === 'avatar') {
                // This is the avatar file - convert Buffer to Uint8Array for Blob
                const uint8Array = new Uint8Array(field.data);
                const blob = new Blob([uint8Array], { type: field.type || 'image/jpeg' });
                laravelFormData.append('avatar', blob, field.filename);
            }
        }

        // Upload avatar to Laravel using POST /user/{id}/avatar
        const updateResponse = await $fetch<UserUpdateResponse>(`${baseUrl}/api/user/${userId}/avatar`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            body: laravelFormData,
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
            message: error.data?.message || error.message || 'Failed to upload avatar',
            data: error.data,
        });
    }
});
