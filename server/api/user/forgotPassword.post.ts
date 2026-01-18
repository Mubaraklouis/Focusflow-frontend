import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
    const { baseUrl } = useConfig()
    const { email } = await readBody(event)

    try {
        // 1. Get the CSRF token and initial cookies from Laravel Sanctum
        const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

        // 2. Perform the Forgot Password request
        const response = await $fetch.raw(`${baseUrl}/forgot-password`, {
            method: 'POST',
            body: {
                email,
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken,
                'Cookie': cookieString
            },
            credentials: 'include'
        })

        // 3. Forward cookies if any (e.g. rate limiting or session)
        const allCookies = response.headers.getSetCookie?.() || []
        const combinedCookies = [...csrfCookies, ...allCookies]
        useForwardCookies(combinedCookies, event)

        return response._data

    } catch (error: any) {
        if (error.response?.status === 422) {
            throw createError({
                statusCode: 422,
                message: error.data?.message || 'Validation error',
                data: error.data?.errors
            })
        }

        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to send reset link',
            data: error.data
        })
    }
})