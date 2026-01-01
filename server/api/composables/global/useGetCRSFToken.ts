const useGetCRSFToken = async () =>{


    const config = useRuntimeConfig()
    const baseUrl = config.laravelApiUrl

 console.log('Step 1: Fetching CSRF cookie...')
const   csrfResponse = await $fetch.raw(`${baseUrl}/sanctum/csrf-cookie`, {
  method: 'GET',
  credentials: 'include'
})

console.log('CSRF Response Status:', csrfResponse.status)

// Get all Set-Cookie headers properly
const csrfCookies = csrfResponse.headers.getSetCookie?.() || []
console.log(`Received ${csrfCookies.length} cookie(s) from Laravel`)

// Extract XSRF-TOKEN value for the registration request
let xsrfToken = ''
const cookieString = csrfCookies.join('; ')

// Parse the XSRF-TOKEN from cookies
const xsrfMatch = cookieString.match(/XSRF-TOKEN=([^;]+)/)
if (xsrfMatch) {
  xsrfToken = decodeURIComponent(xsrfMatch[1])
  console.log('Extracted XSRF-TOKEN for registration request')
}

}


export default useGetCRSFToken