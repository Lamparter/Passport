import { dev } from '$app/environment';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isConfigured, toPassport } from '$lib/server/hca';
import { setSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** Development-only: preview each passport state without a Hack Club OAuth app. */
export const GET: RequestHandler = async ({ url, cookies }) => {
	// Only while no OAuth app is configured, so real sign-in never mixes with fake identities.
	// DEMO=1 forces it on for design work.
	if (!dev || (isConfigured() && env.DEMO !== '1')) error(404, 'Not found');
	const as = url.searchParams.get('as') ?? 'verified';
	const full = url.searchParams.has('full');
	const passport = toPassport({
		id: 'ident!yVf7WWr',
		first_name: 'Heidi',
		last_name: 'Trashworth',
		slack_id: null,
		verification_status: as === 'rejected' ? 'needs_submission' : as === 'pending' ? 'pending' : 'verified',
		ysws_eligible: as === 'verified',
		birthday: full ? (as === 'adult' ? '2005-06-15' : '2010-06-15') : null,
		addresses: full ? [{ country: 'GB', primary: true }] : null
	});
	await setSession(cookies, passport);
	redirect(303, '/');
};
