import useConfig from "~~/server/util/useConfig"

/**
 * @module server/api/courses/[id].delete
 * Proxies a course deletion to the Course Service (`DELETE ${courseUrl}/:id`).
 */
export default defineEventHandler(async (event) => {
    const { courseUrl } = useConfig()
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, message: 'Course id is required' })
    }

    try {
        const options: any = {
            method: 'DELETE',
            headers: {}
        }
        
        const frontendUrl = useConfig().frontendUrl
        options.headers['Referer'] = frontendUrl
        options.headers['Origin'] = frontendUrl
        
        const authHeader = getHeader(event, 'Authorization')
        if (authHeader) options.headers['Authorization'] = authHeader
        
        const cookieHeader = getHeader(event, 'cookie')
        if (cookieHeader) options.headers['cookie'] = cookieHeader

        const response = await $fetch(`${courseUrl}/${id}`, options)

        return response
    } catch (error: any) {
        console.error('[courses/[id].delete.ts] Course deletion failed:', error)
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to delete course',
            data: error.data,
        })
    }
})
