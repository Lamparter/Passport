import { isRedirect, redirect } from '@sveltejs/kit';
import { exchangeCode, fetchIdentity, toPassport } from '$lib/server/hca';
import { setSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const expected = cookies.get('oauth_state');
	cookies.delete('oauth_state', { path: '/' });

	const refused = url.searchParams.get('error');
	if (refused) {
		console.error('Hack Club sign-in refused:', refused, url.searchParams.get('error_description'));
		redirect(303, refused === 'access_denied' ? '/?error=denied' : '/?error=signin');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code || !state || !expected || state !== expected) redirect(303, '/?error=state');

	try {
		const token = await exchangeCode(url, code);
		// The access token is used once and discarded; only the passport snapshot is kept.
		const passport = toPassport(await fetchIdentity(token));
		await setSession(cookies, passport);
	} catch (e) {
		if (isRedirect(e)) throw e;
		console.error('Hack Club sign-in failed:', e);
		redirect(303, '/?error=signin');
	}
	redirect(303, '/');
};
