import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { courseUrl } = useConfig()

    try {
        // Read the multipart form data (includes file)
        const formData = await readFormData(event)

        // Forward FormData to backend - backend handles S3 upload
        const response = await $fetch(courseUrl, {
            method: 'POST',
            body: formData
        })

        return response
    } catch (error: any) {
        console.error('Course creation error:', error)
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to create course',
            data: error.data
        })
    }
})