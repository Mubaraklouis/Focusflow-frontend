import useConfig from '~~/server/util/useConfig'

/**
 * PUT /api/user/password
 *
 * Changes the logged-in user's password. Forwards the browser's session
 * cookies + CSRF token to the auth service (same pattern as the course-service
 * proxies) so Laravel's auth:sanctum middleware can authenticate the request.
 */
export default defineEventHandler(async (event) => {
    const { baseUrl, frontendUrl } = useConfig()

    const userId = getCookie(event, 'focusflow-user-id')
    if (!userId) {
        throw createError({ statusCode: 401, message: 'User not authenticated. Please log in.' })
    }

    const { current_password, password, password_confirmation } = await readBody(event)

    const cookieHeader = getHeader(event, 'cookie') || ''
    let xsrfToken = getCookie(event, 'XSRF-TOKEN') || ''
    if (xsrfToken.includes('%')) {
        try {
            xsrfToken = decodeURIComponent(xsrfToken)
        } catch {
            // keep the raw value if decoding fails
        }
    }

    try {
        const response = await $fetch.raw(`${baseUrl}/api/user/${userId}/password`, {
            method: 'PUT',
            body: { current_password, password, password_confirmation },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
                'Referer': frontendUrl,
                'Origin': frontendUrl,
            },
        })

        return response._data
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to change password',
            data: error.data?.errors,
        })
    }
})
