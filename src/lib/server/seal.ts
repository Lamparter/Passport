import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { EncryptJWT, jwtDecrypt } from 'jose';

let key: Promise<Uint8Array> | undefined;

function getKey(): Promise<Uint8Array> {
	key ??= (async () => {
		let secret = env.SESSION_SECRET;
		if (!secret) {
			if (!dev) throw new Error('SESSION_SECRET is not set');
			secret = 'dev-only-insecure-secret';
		}
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
		return new Uint8Array(digest);
	})();
	return key;
}

/** Encrypt a payload into an opaque, tamper-proof, expiring token. */
export async function seal(
	payload: Record<string, unknown>,
	audience: string,
	ttlSeconds: number
): Promise<string> {
	return new EncryptJWT(payload)
		.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
		.setAudience(audience)
		.setIssuedAt()
		.setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
		.encrypt(await getKey());
}

export type Unsealed<T> =
	| { ok: true; payload: T; iat: number; exp: number }
	| { ok: false; reason: 'expired' | 'invalid' };

export async function unseal<T>(token: string, audience: string): Promise<Unsealed<T>> {
	try {
		const { payload } = await jwtDecrypt(token, await getKey(), { audience, clockTolerance: 5 });
		return { ok: true, payload: payload as T, iat: payload.iat ?? 0, exp: payload.exp ?? 0 };
	} catch (e) {
		const code = (e as { code?: string }).code;
		return { ok: false, reason: code === 'ERR_JWT_EXPIRED' ? 'expired' : 'invalid' };
	}
}

// ── Compact tokens ──────────────────────────────────────────────────────────
// A JWE is ~450 characters, which makes for a dense, hard-to-scan QR code. Staff-scan
// links use a bare AES-GCM envelope instead: base64url(iv | ciphertext+tag) of [exp, data].

const b64url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

const fromB64url = (s: string) =>
	Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const aesKey = async () =>
	crypto.subtle.importKey('raw', (await getKey()) as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function sealCompact(data: unknown, purpose: string, ttlSeconds: number): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
	const cipher = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(purpose) },
		await aesKey(),
		new TextEncoder().encode(JSON.stringify([exp, data]))
	);
	const out = new Uint8Array(12 + cipher.byteLength);
	out.set(iv);
	out.set(new Uint8Array(cipher), 12);
	return b64url(out);
}

export async function unsealCompact<T>(token: string, purpose: string): Promise<Unsealed<T>> {
	try {
		const raw = fromB64url(token);
		const plain = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: raw.slice(0, 12), additionalData: new TextEncoder().encode(purpose) },
			await aesKey(),
			raw.slice(12)
		);
		const [exp, payload] = JSON.parse(new TextDecoder().decode(plain)) as [number, T];
		if (exp < Date.now() / 1000 - 5) return { ok: false, reason: 'expired' };
		return { ok: true, payload, iat: 0, exp };
	} catch {
		return { ok: false, reason: 'invalid' };
	}
}
