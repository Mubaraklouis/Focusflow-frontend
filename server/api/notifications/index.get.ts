import { defineEventHandler, getHeader, setResponseStatus } from 'h3';

export default defineEventHandler(async (event) => {
    const headers = new Headers();
    const cookieHeader = getHeader(event, 'cookie');
    if (cookieHeader) headers.set('cookie', cookieHeader);
    
    const authorization = getHeader(event, 'authorization');
    if (authorization) headers.set('authorization', authorization);

    const referer = getHeader(event, 'referer');
    if (referer) headers.set('referer', referer);

    const origin = getHeader(event, 'origin');
    if (origin) headers.set('origin', origin);

    try {
        const response = await fetch('http://localhost:8081/api/notifications', {
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
