import useConfig from "~~/server/util/useConfig"

const useGetCRSFToken = async () => {
  const { baseUrl } = useConfig()

  const csrfResponse = await $fetch.raw(`${baseUrl}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include'
  })
  const csrfCookies = csrfResponse.headers.getSetCookie?.() || []
  let xsrfToken = ''
  const cookieString = csrfCookies.join('; ')

  const xsrfMatch = cookieString.match(/XSRF-TOKEN=([^;]+)/)
  if (xsrfMatch) {
    xsrfToken = decodeURIComponent(xsrfMatch[1])
  }
  return {xsrfToken, cookieString, csrfCookies}
}
export default useGetCRSFToken