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
