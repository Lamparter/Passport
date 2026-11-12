import { redirect } from '@sveltejs/kit';
import { clearSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

// A plain link, so it works when typed into the address bar and is not subject to SvelteKit's
// cross-site form check (which rejected the old POST form behind the production proxy).
// The worst a forged request can do is sign someone out.
export const GET: RequestHandler = ({ cookies }) => {
	clearSession(cookies);
	// ?out stops the home page from sending them straight back into sign-in.
	redirect(303, '/?out');
};
