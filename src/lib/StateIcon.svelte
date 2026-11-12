<script lang="ts">
	import type { PassportState } from './types';
	let { state }: { state: PassportState | 'expired' } = $props();
</script>

<!-- Shape differs per outcome as well as colour, for colour-blind door staff. -->
<svg viewBox="0 0 100 100" aria-hidden="true">
	{#if state === 'verified'}
		<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="8" />
		<path
			d="M27 52 L44 68 L74 34"
			fill="none"
			stroke="currentColor"
			stroke-width="11"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if state === 'adult'}
		<path
			d="M50 6 L94 50 L50 94 L6 50 Z"
			fill="none"
			stroke="currentColor"
			stroke-width="8"
			stroke-linejoin="round"
		/>
		<text
			x="50"
			y="62"
			text-anchor="middle"
			font-size="33"
			font-weight="700"
			fill="currentColor"
			font-family="inherit">18+</text
		>
	{:else if state === 'rejected'}
		<path
			d="M31 6 H69 L94 31 V69 L69 94 H31 L6 69 V31 Z"
			fill="none"
			stroke="currentColor"
			stroke-width="8"
			stroke-linejoin="round"
		/>
		<path
			d="M33 33 L67 67 M67 33 L33 67"
			fill="none"
			stroke="currentColor"
			stroke-width="11"
			stroke-linecap="round"
		/>
	{:else}
		<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="8" />
		<path
			d="M50 24 V52 L66 62"
			fill="none"
			stroke="currentColor"
			stroke-width="9"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
