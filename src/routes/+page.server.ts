import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

const ERRORS: Record<string, string> = {
	config: 'Sign-in is not configured yet. Set HCA_CLIENT_ID and HCA_CLIENT_SECRET.',
	denied: 'Sign-in was cancelled.',
	state: 'That sign-in attempt expired. Please try again.',
	signin: 'Hack Club sign-in failed. Please try again.'
};

export const load: PageServerLoad = ({ locals, url }) => {
	const code = url.searchParams.get('error');
	return {
		passport: locals.passport,
		error: code ? (ERRORS[code] ?? ERRORS.signin) : null,
		demo: dev
	};
};
