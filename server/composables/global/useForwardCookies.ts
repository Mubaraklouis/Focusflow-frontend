const useForwardCookies = (combinedCookies: any,event:any) => {
    const uniqueCookies = new Map()
    combinedCookies.forEach((cookie: string) => {
      const cookieName = cookie.split('=')[0]
      uniqueCookies.set(cookieName, cookie)
    })
       uniqueCookies.forEach((cookie: string) => {
        appendResponseHeader(event, 'Set-Cookie', cookie)
      })
}

export default useForwardCookies