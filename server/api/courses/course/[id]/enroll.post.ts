import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { courseUrl, frontendUrl } = useConfig()
    const id = getRouterParam(event, 'id')
    
    // The nuxt.config.ts courseUrl might be 'http://13.61.153.194/api/course'
    // but the enroll endpoint on the backend is '/api/course/:id/enroll'
    // Let's strip '/api/course' from the end if needed, or just append properly.
    // Assuming courseUrl = "http://host/api/course"
    const url = `${courseUrl}/${id}/enroll`
    
    const options: any = {
        method: 'POST',
        headers: { 
            'Accept': 'application/json',
            'Referer': frontendUrl,
            'Origin': frontendUrl
        }
    }
    
    const authHeader = getHeader(event, 'Authorization')
    if (authHeader) options.headers['Authorization'] = authHeader
    
    const cookieHeader = getHeader(event, 'cookie')
    if (cookieHeader) options.headers['cookie'] = cookieHeader

    try {
        const response = await $fetch(url, options)
        return response
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to enroll',
            data: error.data
        })
    }
})
