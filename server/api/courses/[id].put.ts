import useConfig from "~~/server/util/useConfig"

/**
 * @module server/api/courses/[id].put
 * Proxies a course update to the Course Service.
 *
 * Forwards the incoming multipart/form-data (so an optional new thumbnail and
 * any changed fields — including `course_visibility` for the public/private
 * toggle — reach the backend) to `PUT ${courseUrl}/:id`.
 */
export default defineEventHandler(async (event) => {
    const { courseUrl } = useConfig()
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, message: 'Course id is required' })
    }

    try {
        const formData = await readFormData(event)

        const response = await $fetch(`${courseUrl}/${id}`, {
            method: 'PUT',
            body: formData,
        })

        return response
    } catch (error: any) {
        console.error('[courses/[id].put.ts] Course update failed:', error)
        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to update course',
            data: error.data,
        })
    }
})
