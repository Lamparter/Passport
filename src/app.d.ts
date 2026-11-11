import type { Passport } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			passport: Passport | null;
		}
	}
}

export {};
