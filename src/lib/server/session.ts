import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import type { Passport } from '$lib/types';
import { seal, unseal } from './seal';

const COOKIE = 'passport';
/** Long enough for one event day; after that the status is re-checked with Hack Club. */
const SESSION_TTL = 60 * 60 * 12;
/** A staff-scan QR code is only good for this long, so screenshots go stale. */
export const SCAN_TTL = 90;

export async function setSession(cookies: Cookies, passport: Passport) {
	cookies.set(COOKIE, await seal({ p: passport }, 'session', SESSION_TTL), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_TTL
	});
}

export async function getSession(cookies: Cookies): Promise<Passport | null> {
	const token = cookies.get(COOKIE);
	if (!token) return null;
	const result = await unseal<{ p: Passport }>(token, 'session');
	return result.ok ? result.payload.p : null;
}

export function clearSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}

export function sealScan(passport: Passport) {
	return seal({ p: passport }, 'scan', SCAN_TTL);
}

export function unsealScan(token: string) {
	return unseal<{ p: Passport }>(token, 'scan');
}
