/** What the door check cares about. */
export type PassportState =
	/** IDV-verified and 13–18: accepted. */
	| 'verified'
	/** IDV-verified but over 18: must make themselves known to staff. */
	| 'adult'
	/** Not IDV-verified: must present another form of ID. */
	| 'rejected';

export interface Passport {
	/** Hack Club Auth public identity id (ident!xxxx). */
	id: string;
	/** Passport-style document number derived from the id. */
	number: string;
	givenNames: string;
	surname: string;
	state: PassportState;
	/** Raw verification_status from Hack Club Auth. */
	status: string;
	slackId: string | null;
	/** ISO date of birth; only present with HQ-only scopes. */
	dob: string | null;
	age: number | null;
	/** Country from the primary address; only present with HQ-only scopes. */
	country: { code: string; name: string } | null;
	/** Epoch ms when the status was checked with Hack Club Auth. */
	issuedAt: number;
}

/** The subset of a passport that is encoded into a staff-scan QR code. */
export type ScanInfo = Pick<
	Passport,
	'state' | 'givenNames' | 'surname' | 'number' | 'slackId' | 'age' | 'issuedAt'
>;

export const STATE_LABEL: Record<PassportState, string> = {
	verified: 'Verified',
	adult: 'Verified 18+',
	rejected: 'Not verified'
};

/** Accepted alternatives, per the Haven London organisers. */
export const ACCEPTED_ID = {
	physical: [
		'Government-issued ID (passport, driving licence, etc.)',
		'Postcard ID',
		'RAF ID card',
		'Oyster Zip card',
		'16+ railcard',
		'School ID'
	],
	digital: ['Yoti', 'MyRAFAC app', 'Post Office digital ID']
};

/** The same list, short enough to print on the passport itself. */
export const ACCEPTED_BRIEF = [
	'Government ID',
	'Postcard ID',
	'RAF ID card',
	'Oyster Zip card',
	'16+ railcard',
	'School ID',
	'Yoti',
	'MyRAFAC app',
	'Post Office digital ID'
];

export function avatarUrl(slackId: string | null): string | null {
	// Hack Club Auth has no picture claim; its docs point to Cachet for Slack avatars.
	return slackId ? `https://cachet.dunkirk.sh/users/${encodeURIComponent(slackId)}/r` : null;
}
