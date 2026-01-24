import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { courseUrl } = useConfig()
    const body = await readBody(event)

    try {
        const response = await $fetch(courseUrl, {
            method: 'POST',
            body,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        })

        return response
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to create course',
            data: error.data
        })
    }
})