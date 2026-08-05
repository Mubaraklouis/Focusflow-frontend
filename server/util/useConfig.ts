
/*
* Return environment specific configuration values inform of variables 
* @returns {usersApiUrl: string}
*/

const useConfig = () => {
    const config = useRuntimeConfig()
    const baseUrl = config.usersApiUrl
    const courseUrl = config.coursesApiUrl
    const courseMaterialUrl = config.courseMaterialApiUrl
    const frontendUrl = config.frontendUrl
    const storageUrl = config.storageUrl

    return {
        baseUrl,
        courseUrl,
        courseMaterialUrl,
        frontendUrl,
        storageUrl
    }
}

export default useConfig