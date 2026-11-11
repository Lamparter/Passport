import { unsealScan } from '$lib/server/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const result = await unsealScan(params.token);
	if (!result.ok) return { result: result.reason, passport: null, issuedAt: null };
	return { result: 'ok' as const, passport: result.payload.p, issuedAt: result.iat * 1000 };
};
