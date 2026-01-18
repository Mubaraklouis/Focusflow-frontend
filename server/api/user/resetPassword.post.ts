
import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
    const { baseUrl } = useConfig()
    const { token, email, password, password_confirmation } = await readBody(event)

    try {
        const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

        const response = await $fetch.raw(`${baseUrl}/reset-password`, {
            method: 'POST',
            body: {
                token,
                email,
                password,
                password_confirmation,
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken,
                'Cookie': cookieString
            },
            credentials: 'include'
        })

        const newCookies = response.headers.getSetCookie?.() || []
        const combinedCookies = [...csrfCookies, ...newCookies]
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
            message: error.data?.message || error.message || 'Failed to reset password',
            data: error.data
        })
    }
})