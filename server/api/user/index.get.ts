import useGetCRSFToken from "~~/server/composables/global/useGetCRSFToken"
import useConfig from "../../util/useConfig"
import useForwardCookies from "~~/server/composables/global/useForwardCookies"

/**
 * # 🛡️ Laravel Sanctum User Proxy
 * * This server-side handler proxies the user check request to Laravel.
 *
 * ## 📋 Internal Execution Logic
 * | Step | Operation | Code Logic |
 * | :--- | :--- | :--- |
 * | **1** | **Handshake** | Retrieves `XSRF-TOKEN` and initial cookies to ensure valid session. |
 * | **2** | **Proxy Request** | Forwards request to `${baseUrl}/user` using `$fetch.raw` with current cookies. |
 * | **3** | **Cookie Sync** | Captures and forwards any new cookies from Laravel back to the client. |
 *
 * @param event - The H3 event object (Nuxt Server Context).
 * @returns {Promise<any>} The authenticated user data from Laravel.
 */
export default defineEventHandler(async (event): Promise<any> => {
    const { baseUrl, frontendUrl } = useConfig()

    try {
        // --- STEP 1: Handshake & Cookie Prep ---
        const { xsrfToken, cookieString, csrfCookies } = await useGetCRSFToken()

        // --- STEP 2: Proxy Request ---
        // We strictly proxy the GET request to Laravel's /api/user
        console.log(`[index.get.ts] Proxying request to: ${baseUrl}/api/user`)
        const userResponse = await ($fetch.raw as any)(`${baseUrl}/api/user`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken,
                'Cookie': cookieString,
                'Referer': frontendUrl,
                'Origin': frontendUrl,
            },
            credentials: 'include'
        })

        // --- STEP 3: Cookie Sync ---
        const allCookies = userResponse.headers.getSetCookie?.() || []
        const combinedCookies = [...csrfCookies, ...allCookies]
        useForwardCookies(combinedCookies, event)

        return userResponse._data

    } catch (error: any) {
        // If 401, it just means not authenticated, which is a valid state for this check
        if (error.response?.status === 401) {
            throw createError({
                statusCode: 401,
                message: 'Unauthenticated'
            })
        }

        throw createError({
            statusCode: error.response?.status || 500,
            message: error.data?.message || error.message || 'Failed to fetch user',
            data: error.data
        })
    }
})
