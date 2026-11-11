import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { authorizeUrl, isConfigured } from '$lib/server/hca';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
	if (!isConfigured()) redirect(303, '/?error=config');
	const state = crypto.randomUUID();
	cookies.set('oauth_state', state, {
		path: '/auth',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 600
	});
	redirect(303, authorizeUrl(url, state));
};
