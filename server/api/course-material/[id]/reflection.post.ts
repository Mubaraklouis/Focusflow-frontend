import { apiFetch, forwardQuery } from '~~/server/util/api'

/** POST /api/course-material/{id}/reflection → API POST /api/course-materials/:id/reflection. Submit a Feynman reflection {body} for the signed-in user. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) throw createError({ statusCode: 400, message: 'id must be numeric' })
  const { body } = (await readBody<{ body?: string }>(event)) || {}
  return apiFetch(event, `/api/course-materials/${id}/reflection`, { method: 'POST', body: { body }, query: forwardQuery(event) })
})
