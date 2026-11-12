import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.passport = await getSession(event.cookies);
	const response = await resolve(event);
	// Identity pages must never be cached or embedded.
	response.headers.set('cache-control', 'no-store');
	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('referrer-policy', 'no-referrer');
	response.headers.set('content-language', 'en');
	return response;
};
