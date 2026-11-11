import { env } from '$env/dynamic/private';
import type { Passport, PassportState } from '$lib/types';

const HCA = 'https://auth.hackclub.com';
const DEFAULT_SCOPES = 'openid profile email name slack_id verification_status';

export function origin(url: URL): string {
	return (env.PUBLIC_ORIGIN || url.origin).replace(/\/$/, '');
}

export function isConfigured(): boolean {
	return Boolean(env.HCA_CLIENT_ID && env.HCA_CLIENT_SECRET);
}

export function authorizeUrl(url: URL, state: string): string {
	const u = new URL(`${HCA}/oauth/authorize`);
	u.searchParams.set('client_id', env.HCA_CLIENT_ID ?? '');
	u.searchParams.set('redirect_uri', `${origin(url)}/auth/callback`);
	u.searchParams.set('response_type', 'code');
	u.searchParams.set('scope', env.HCA_SCOPES || DEFAULT_SCOPES);
	u.searchParams.set('state', state);
	return u.toString();
}

export async function exchangeCode(url: URL, code: string): Promise<string> {
	const res = await fetch(`${HCA}/oauth/token`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: env.HCA_CLIENT_ID ?? '',
			client_secret: env.HCA_CLIENT_SECRET ?? '',
			redirect_uri: `${origin(url)}/auth/callback`,
			code
		})
	});
	if (!res.ok) throw new Error(`token exchange failed (${res.status})`);
	const body = (await res.json()) as { access_token?: string };
	if (!body.access_token) throw new Error('token exchange returned no access token');
	return body.access_token;
}

/** Shape of GET /api/v1/me. Which fields are present depends on the granted scopes. */
export interface HcaIdentity {
	id: string;
	ysws_eligible?: boolean | null;
	verification_status?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	slack_id?: string | null;
	birthday?: string | null;
	addresses?: { country?: string | null; primary?: boolean | null }[] | null;
}

export async function fetchIdentity(accessToken: string): Promise<HcaIdentity> {
	const res = await fetch(`${HCA}/api/v1/me`, {
		headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`identity lookup failed (${res.status})`);
	const body = (await res.json()) as { identity?: HcaIdentity };
	if (!body.identity?.id) throw new Error('identity lookup returned no identity');
	return body.identity;
}

export function ageOn(dob: string, now: Date): number | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob);
	if (!m) return null;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	let age = now.getUTCFullYear() - y;
	if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age--;
	return age;
}

function documentNumber(id: string): string {
	const core = id
		.replace(/^ident!/, '')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase();
	return ('HC' + core).padEnd(9, '0').slice(0, 9);
}

export function toPassport(identity: HcaIdentity, now = new Date()): Passport {
	const dob = identity.birthday ?? null;
	const age = dob ? ageOn(dob, now) : null;
	const status = identity.verification_status ?? 'unknown';

	let state: PassportState = 'rejected';
	if (status === 'verified') {
		// Hack Club is for ages 13–18 inclusive. Without the HQ-only birthdate scope we
		// rely on ysws_eligible, which Hack Club sets for verified under-19s.
		const minor = age !== null ? age <= 18 : identity.ysws_eligible === true;
		state = minor ? 'verified' : 'adult';
	}

	const address = identity.addresses?.find((a) => a.primary) ?? identity.addresses?.[0];
	const code = address?.country?.toUpperCase() ?? null;
	let country: Passport['country'] = null;
	if (code && /^[A-Z]{2}$/.test(code)) {
		let name = code;
		try {
			name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
		} catch {
			// keep the code
		}
		country = { code, name };
	}

	return {
		id: identity.id,
		number: documentNumber(identity.id),
		givenNames: identity.first_name?.trim() || 'Hack',
		surname: identity.last_name?.trim() || 'Clubber',
		state,
		status,
		slackId: identity.slack_id ?? null,
		dob,
		age,
		country,
		issuedAt: now.getTime()
	};
}
