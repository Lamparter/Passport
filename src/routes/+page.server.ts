import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { isConfigured } from '$lib/server/hca';
import type { PageServerLoad } from './$types';

const ERRORS: Record<string, string> = {
	config: 'Sign-in is not configured yet. Set HCA_CLIENT_ID and HCA_CLIENT_SECRET.',
	denied: 'Sign-in was cancelled.',
	state: 'That sign-in attempt expired. Please try again.',
	signin: 'Hack Club sign-in failed. Please try again.'
};

export const load: PageServerLoad = ({ locals, url }) => {
	const code = url.searchParams.get('error');
	// Fake identities for design work: only in `vite dev`, and only until an OAuth app is set up
	// (or with DEMO=1).
	const demo = dev && (!isConfigured() || env.DEMO === '1');
	return {
		passport: locals.passport,
		error: code ? (ERRORS[code] ?? ERRORS.signin) : null,
		demo,
		// A first-time visitor is taken into Hack Club sign-in once the opening animation ends.
		// Not after an error or a sign-out, or they would bounce straight back.
		auto: !locals.passport && !code && !url.searchParams.has('out') && !demo && isConfigured(),
		// Demo mode: play that opening without leaving the page.
		preview: demo && !locals.passport && url.searchParams.has('enter')
	};
};
