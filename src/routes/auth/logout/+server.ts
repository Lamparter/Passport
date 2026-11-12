import { redirect } from '@sveltejs/kit';
import { clearSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	clearSession(cookies);
	// ?out stops the home page from sending them straight back into sign-in.
	redirect(303, '/?out');
};
