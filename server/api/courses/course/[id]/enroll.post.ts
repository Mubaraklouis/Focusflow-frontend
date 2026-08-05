import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { courseUrl, frontendUrl } = useConfig()
    const id = getRouterParam(event, 'id')
    
    // courseUrl is "http://host/api/course" (from nuxt.config.ts / env),
    // and the enroll endpoint on the backend is '/api/course/:id/enroll'.
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
