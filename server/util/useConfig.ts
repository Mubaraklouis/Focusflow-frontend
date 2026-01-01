
/*
* Return environment specific configuration values inform of variables 
* @returns {usersApiUrl: string}
*/

const useConfig = () => {
    const config = useRuntimeConfig()
    const baseUrl = config.usersApiUrl

    return {
        baseUrl
    }
}

export default useConfig