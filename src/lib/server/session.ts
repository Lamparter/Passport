import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import type { Passport, PassportState, ScanInfo } from '$lib/types';
import { seal, sealCompact, unseal, unsealCompact } from './seal';

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

const STATES: PassportState[] = ['verified', 'adult', 'rejected'];
type ScanTuple = [number, string, string, string, string | null, number | null, number];

/** Only what door staff need, packed tightly so the QR code stays coarse and easy to scan. */
export function sealScan(p: Passport) {
	const tuple: ScanTuple = [
		STATES.indexOf(p.state),
		p.givenNames,
		p.surname,
		p.number,
		p.slackId,
		p.age,
		Math.floor(p.issuedAt / 1000)
	];
	return sealCompact(tuple, 'scan', SCAN_TTL);
}

export async function unsealScan(
	token: string
): Promise<{ ok: true; scan: ScanInfo; sealedAt: number } | { ok: false; reason: 'expired' | 'invalid' }> {
	const result = await unsealCompact<ScanTuple>(token, 'scan');
	if (!result.ok) return result;
	const [state, givenNames, surname, number, slackId, age, issued] = result.payload;
	return {
		ok: true,
		scan: { state: STATES[state] ?? 'rejected', givenNames, surname, number, slackId, age, issuedAt: issued * 1000 },
		sealedAt: (result.exp - SCAN_TTL) * 1000
	};
}
