import { defineEventHandler, getHeader, setResponseStatus } from 'h3';
import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const { courseUrl, frontendUrl } = useConfig()
    // courseUrl is "http://host/api/course"; notifications live at "http://host/api/notifications"
    const url = courseUrl.replace(/\/api\/course\/?$/, '/api/notifications')

    const headers = new Headers();
    const cookieHeader = getHeader(event, 'cookie');
    if (cookieHeader) headers.set('cookie', cookieHeader);
    
    const authorization = getHeader(event, 'authorization');
    if (authorization) headers.set('authorization', authorization);

    const referer = getHeader(event, 'referer');
    if (referer) headers.set('referer', referer);
    else headers.set('referer', frontendUrl);

    const origin = getHeader(event, 'origin');
    if (origin) headers.set('origin', origin);
    else headers.set('origin', frontendUrl);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const data = await response.json();
        
        if (!response.ok) {
            setResponseStatus(event, response.status);
            return { message: data.error || 'Failed to fetch notifications' };
        }

        return data;
    } catch (error: any) {
        console.error('[notifications.get.ts] Proxy error:', error);
        setResponseStatus(event, 500);
        return { message: 'Internal Server Error' };
    }
});
