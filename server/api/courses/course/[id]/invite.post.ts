import { defineEventHandler, readBody, setResponseStatus, getHeader } from 'h3';
import useConfig from "~~/server/util/useConfig"

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id;
    if (!id) {
        setResponseStatus(event, 400);
        return { message: 'Course ID is required' };
    }

    const { courseUrl, frontendUrl } = useConfig()
    const url = `${courseUrl}/${id}/invite-email`

    const body = await readBody(event);
    
    // Read the authorization headers/cookies to forward
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
        headers.set('content-type', 'application/json');

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            setResponseStatus(event, response.status);
            return { message: data.error || 'Failed to send invitation' };
        }

        return data;
    } catch (error: any) {
        console.error('[invite.post.ts] Proxy error:', error);
        setResponseStatus(event, 500);
        return { message: 'Internal Server Error' };
    }
});
