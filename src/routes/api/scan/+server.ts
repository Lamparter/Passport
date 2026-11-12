import { dev } from '$app/environment';
import { error, json } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { origin } from '$lib/server/hca';
import { SCAN_TTL, sealScan } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** Issues a short-lived QR code that door staff scan to confirm the passport on their own phone. */
export const GET: RequestHandler = async ({ locals, url }) => {
	const passport = locals.passport;
	if (!passport || passport.state === 'rejected') error(401, 'No verified passport');
	const target = `${origin(url)}/verify/${await sealScan(passport)}`;
	const svg = await QRCode.toString(target, {
		type: 'svg',
		errorCorrectionLevel: 'M',
		margin: 0,
		color: { dark: '#17171d', light: '#ffffff' }
	});
	// The raw link is only exposed in development, for testing the staff page without a camera.
	return json({ svg, ttl: SCAN_TTL, ...(dev ? { url: target } : {}) });
};
