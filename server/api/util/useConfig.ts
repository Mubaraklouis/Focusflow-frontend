
/*
* Return environment specific configuration values inform of variables 
* @returns {baseUrl: string}
*/

const useConfig = () => {
    const config = useRuntimeConfig()
    const baseUrl = config.laravelApiUrl

    return {
        baseUrl
    }
}

export default useConfig