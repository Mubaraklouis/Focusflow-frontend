import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { uploadUrl } = useConfig()

    try {
        // Read the multipart form data
        const formData = await readFormData(event)

        // Forward the form data to the backend S3 upload endpoint
        const response = await $fetch<{ url: string }>(uploadUrl, {
            method: 'POST',
            body: formData
        })

        return response
    } catch (error: any) {
        console.error('Upload error:', error)
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to upload file',
            data: error.data
        })
    }
})
