import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

export default defineEventHandler(async (event) => {
const { baseUrl } = useConfig()

const { name, email, password, password_confirmation } = await readBody(event)

  try {
    const {xsrfToken,cookieString,csrfCookies} = await useGetCRSFToken()
    console.log('Step 2: Sending registration request...')
    const registerResponse = await $fetch.raw(`${baseUrl}/register`, {
      method: 'POST',
      body: {
        name,
        email,
        password,
        password_confirmation
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': cookieString
      },
      credentials: 'include'
    })

    const allCookies = registerResponse.headers.getSetCookie?.() || []
    const combinedCookies = [...csrfCookies, ...allCookies]
    useForwardCookies(combinedCookies,event)

    return registerResponse._data

  } catch (error: any) {
    if (error.data?.errors) {
      throw createError({
        statusCode: 422,
        message: 'Validation failed',
        data: { errors: error.data.errors }
      })
    }

    throw createError({
      statusCode: error.response?.status || error.statusCode || 500,
      message: error.data?.message || error.message || 'Registration failed',
      data: error.data
    })
  }
})