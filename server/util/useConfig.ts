
/*
* Return environment specific configuration values inform of variables 
* @returns {usersApiUrl: string}
*/

const useConfig = () => {
    const config = useRuntimeConfig()
    const baseUrl = config.usersApiUrl
    const courseUrl = config.coursesApiUrl
    const frontendUrl = config.frontendUrl

    return {
        baseUrl,
        courseUrl,
        frontendUrl
    }
}

export default useConfig