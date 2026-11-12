<script lang="ts">
	import { onMount } from 'svelte';
	import Passport from '$lib/Passport.svelte';
	import { ACCEPTED_ID, STATE_LABEL } from '$lib/types';

	let { data } = $props();
	const passport = $derived(data.passport);
	const entering = $derived(data.auto || data.preview);

	onMount(() => {
		if (!data.auto) return;
		// Leave as the opening animation finishes (see the `entering` timings in Passport.svelte).
		const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const timer = setTimeout(() => location.assign('/auth/login'), calm ? 900 : 5000);
		// Coming back with the browser's Back button restores this page mid-fade: start over.
		const restored = (e: PageTransitionEvent) => e.persisted && location.reload();
		addEventListener('pageshow', restored);
		return () => {
			clearTimeout(timer);
			removeEventListener('pageshow', restored);
		};
	});
</script>

<svelte:head>
	<title>{passport ? `${STATE_LABEL[passport.state]} · ` : ''}Hack Club Passport</title>
	<meta
		name="description"
		content="Show you're an identity-verified Hack Clubber at the door. Your passport opens once you sign in with Hack Club."
	/>
</svelte:head>

<main class:signed-in={passport} class:entering data-state={passport?.state}>
	<div class="flood"></div>
	<i class="art skyline" style="--src: url(/art/skyline.png)"></i>

	{#if data.error}
		<p class="error" role="alert">{data.error}</p>
	{/if}

	<h1 class="sr">
		{passport ? `Hack Club Passport: ${STATE_LABEL[passport.state]}` : 'Hack Club Passport'}
	</h1>

	<div class="desk">
		<Passport {passport} {entering} />
		{#if !passport}
			<!-- The whole passport is the way in: no button on the jacket. -->
			<a class="open" href="/auth/login" data-sveltekit-reload aria-label="Sign in with Hack Club"></a>
		{/if}
	</div>

	<footer>
		{#if passport?.state === 'rejected'}
			<details>
				<summary>Accepted forms of ID</summary>
				<ul>
					{#each [...ACCEPTED_ID.physical, ...ACCEPTED_ID.digital] as id (id)}<li>{id}</li>{/each}
				</ul>
			</details>
		{/if}
		<div class="line">
			<span>An unofficial companion to Hack Club Identity Vault</span>
			{#if passport}
				<form method="POST" action="/auth/logout"><button type="submit">Sign out</button></form>
			{:else if !entering}
				<a href="/auth/login" data-sveltekit-reload>Sign in with Hack Club</a>
			{/if}
			{#if data.demo}
				<span class="demo">
					Demo:
					<a href="/?enter" data-sveltekit-reload>intro</a>
					<a href="/auth/demo?as=verified" data-sveltekit-reload>verified</a>
					<a href="/auth/demo?as=verified&full" data-sveltekit-reload>full</a>
					<a href="/auth/demo?as=adult" data-sveltekit-reload>18+</a>
					<a href="/auth/demo?as=rejected" data-sveltekit-reload>refused</a>
				</span>
			{/if}
		</div>
	</footer>

	<!-- Fades the opening page into Hack Club's sign-in page. -->
	{#if entering}<div class="veil"></div>{/if}
</main>

<style>
	main {
		position: relative;
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: calc(1rem + env(safe-area-inset-top)) 3vw calc(3.25rem + env(safe-area-inset-bottom));
		overflow: hidden;
		/* A pale desk: the dark jacket stands clear of it, as the pale pages do of the verdict colour. */
		background: radial-gradient(120% 90% at 50% 40%, #f7f8fa 0%, #e6e9ee 60%, #d6dae1 100%);
		color: #3c4858;
		isolation: isolate;
	}

	/* The whole screen takes the verdict colour as the passport opens. */
	.flood {
		position: absolute;
		inset: 0;
		z-index: -2;
		background: radial-gradient(110% 80% at 50% 45%, var(--stage, transparent), var(--stage-deep, transparent));
		clip-path: circle(0% at 50% 50%);
	}
	[data-state='rejected'] .flood {
		background:
			repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0 28px, transparent 28px 56px),
			radial-gradient(110% 80% at 50% 45%, var(--stage), var(--stage-deep));
	}
	.signed-in .flood {
		animation: flood 1.2s 2s cubic-bezier(0.5, 0, 0.2, 1) forwards;
	}
	@keyframes flood {
		to {
			clip-path: circle(150% at 50% 50%);
		}
	}

	/* Drawn at its natural proportions and capped, so it never stretches on wide screens. */
	.skyline {
		position: absolute;
		z-index: -1;
		left: 50%;
		bottom: calc(2.4rem + env(safe-area-inset-bottom));
		width: min(100%, 44rem);
		aspect-ratio: 4 / 1;
		transform: translateX(-50%);
		color: rgba(60, 72, 88, 0.16);
		-webkit-mask-position: bottom;
		mask-position: bottom;
	}
	.signed-in .skyline {
		color: rgba(255, 255, 255, 0.12);
		transition: color 0.6s 2.4s;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.desk {
		position: relative;
	}
	.open {
		position: absolute;
		inset: 0;
		z-index: 2;
		border-radius: 1rem;
	}
	.open:focus-visible {
		outline: 3px solid var(--blue);
		outline-offset: 6px;
	}

	.error {
		position: absolute;
		top: calc(1rem + env(safe-area-inset-top));
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: 92vw;
		margin: 0;
		font-size: 0.9rem;
		color: #7a1023;
		background: #fde8ec;
		border: 1px solid #e9a3b0;
		border-radius: 0.6rem;
		padding: 0.55rem 0.9rem;
	}

	footer {
		position: absolute;
		left: 0;
		right: 0;
		bottom: calc(0.8rem + env(safe-area-inset-bottom));
		padding: 0 4vw;
		font-size: 0.74rem;
		letter-spacing: 0.02em;
		text-align: center;
		animation: rise 0.7s 1.6s both;
	}
	footer a,
	footer button,
	summary {
		font: inherit;
		letter-spacing: inherit;
		color: inherit;
		background: none;
		border: 0;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}
	.signed-in footer {
		animation-delay: 3s;
		color: rgba(255, 255, 255, 0.85);
	}
	@keyframes rise {
		from {
			opacity: 0;
		}
	}
	.line {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.15rem 0.9rem;
	}
	footer form {
		display: inline;
	}
	.demo {
		display: inline-flex;
		gap: 0.6rem;
	}
	details {
		margin-bottom: 0.5rem;
	}
	summary {
		display: inline-block;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	details ul {
		list-style: none;
		margin: 0.5rem auto 0.3rem;
		padding: 0.7rem 1rem;
		max-width: 26rem;
		text-align: left;
		font-size: 0.82rem;
		line-height: 1.55;
		color: #fff;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 0.8rem;
		backdrop-filter: blur(6px);
	}

	.veil {
		position: fixed;
		inset: 0;
		z-index: 5;
		background: #f9fafc;
		opacity: 0;
		pointer-events: none;
		animation: veil 1s 4s ease-in forwards;
	}
	@keyframes veil {
		to {
			opacity: 1;
		}
	}
</style>
