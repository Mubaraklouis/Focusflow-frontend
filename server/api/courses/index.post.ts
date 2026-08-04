import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { courseUrl } = useConfig()

    try {
        // Read the multipart form data (includes file)
        const formData = await readFormData(event)

        const options: any = {
            method: 'POST',
            body: formData,
            headers: {}
        }
        
        const frontendUrl = useConfig().frontendUrl
        options.headers['Referer'] = frontendUrl
        options.headers['Origin'] = frontendUrl
        
        const authHeader = getHeader(event, 'Authorization')
        if (authHeader) options.headers['Authorization'] = authHeader
        
        const cookieHeader = getHeader(event, 'cookie')
        if (cookieHeader) options.headers['cookie'] = cookieHeader

        // Forward FormData to backend - backend handles S3 upload
        const response = await $fetch(courseUrl, options)

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