import { defineEventHandler, readBody, getHeader, setResponseStatus } from 'h3';

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id;
    if (!id) {
        setResponseStatus(event, 400);
        return { message: 'Invitation ID is required' };
    }

    const body = await readBody(event);
    
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
        const response = await fetch(`http://localhost:8081/api/invitations/${id}/respond`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            setResponseStatus(event, response.status);
            return { message: data.error || 'Failed to respond to invitation' };
        }

        return data;
    } catch (error: any) {
        console.error('[respond.post.ts] Proxy error:', error);
        setResponseStatus(event, 500);
        return { message: 'Internal Server Error' };
    }
});
