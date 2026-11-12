import type { Passport } from './types';

const clean = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '<')
		.replace(/^<+|<+$/g, '');

const fit = (s: string, n: number) => s.padEnd(n, '<').slice(0, n);

/** ICAO 9303 check digit (weights 7-3-1). */
function check(s: string): string {
	const weights = [7, 3, 1];
	let sum = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		const v = c === '<' ? 0 : c >= '0' && c <= '9' ? Number(c) : c.charCodeAt(0) - 55;
		sum += v * weights[i % 3];
	}
	return String(sum % 10);
}

const yymmdd = (d: Date) => d.toISOString().slice(2, 10).replace(/-/g, '');

/** A passport-style machine readable zone. Decorative, but formatted like the real thing. */
export function mrz(p: Passport): [string, string] {
	const line1 = fit(`P<HCA${clean(p.surname)}<<${clean(p.givenNames)}`, 44);
	const num = fit(p.number, 9);
	const dob = p.dob ? p.dob.slice(2, 10).replace(/-/g, '') : '<<<<<<';
	const issued = yymmdd(new Date(p.issuedAt));
	const flag = p.state === 'verified' ? 'IDV<OK' : p.state === 'adult' ? 'IDV<18' : 'IDV<NO';
	const body = `${num}${check(num)}HCA${dob}${check(dob)}<${issued}${check(issued)}${fit(flag, 14)}`;
	const line2 = fit(body, 43) + check(body);
	return [line1, line2];
}
