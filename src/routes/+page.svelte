<script lang="ts">
	import Passport from '$lib/Passport.svelte';
	import StateIcon from '$lib/StateIcon.svelte';
	import { ACCEPTED_ID, STATE_LABEL } from '$lib/types';

	let { data } = $props();
	const passport = $derived(data.passport);

	const reason = $derived.by(() => {
		switch (passport?.status) {
			case 'pending':
				return 'Your Hack Club identity verification is still being reviewed.';
			case 'needs_submission':
				return "You haven't submitted ID to Hack Club's Identity Vault yet.";
			case 'ineligible':
				return 'Your Hack Club identity verification was rejected.';
			default:
				return "We couldn't confirm a verified Hack Club identity for this account.";
		}
	});
</script>

<svelte:head>
	<title>{passport ? `${STATE_LABEL[passport.state]} · ` : ''}Hack Club Passport</title>
	<meta
		name="description"
		content="Show you're an identity-verified Hack Clubber at the door. Sign in with Hack Club to open your passport."
	/>
</svelte:head>

<main class:signed-in={passport} data-state={passport?.state}>
	<div class="flood"></div>
	<i class="art skyline" style="--src: url(/art/skyline.png)"></i>

	<nav>
		<span class="brand"><b>Hack Club</b> Passport</span>
		{#if passport}
			<form method="POST" action="/auth/logout">
				<button type="submit">Sign out</button>
			</form>
		{/if}
	</nav>

	<Passport {passport} />

	<section class="brief">
		{#if !passport}
			{#if data.error}
				<p class="error" role="alert">{data.error}</p>
			{/if}
			<h1>Your Hack Club ID, at the door.</h1>
			<p>
				Sign in with Hack Club and your passport opens to show whether you're an identity-verified
				Hack Clubber. No physical ID needed if you are.
			</p>
			{#if data.demo}
				<p class="demo">
					Dev preview:
					<a href="/auth/demo?as=verified" data-sveltekit-reload>verified</a>
					<a href="/auth/demo?as=verified&full" data-sveltekit-reload>verified (HQ scopes)</a>
					<a href="/auth/demo?as=adult" data-sveltekit-reload>18+</a>
					<a href="/auth/demo?as=rejected" data-sveltekit-reload>not verified</a>
				</p>
			{/if}
		{:else}
			<div class="callout" role="status">
				<span class="icon"><StateIcon state={passport.state} /></span>
				<div>
					<h1>{STATE_LABEL[passport.state]}</h1>
					{#if passport.state === 'verified'}
						<p>Show this screen to event staff. No other ID needed.</p>
					{:else if passport.state === 'adult'}
						<p>You're verified, but 18 or over. Please make yourself known to event staff.</p>
					{:else}
						<p>Please present another form of ID to event staff.</p>
					{/if}
				</div>
			</div>

			{#if passport.state === 'rejected'}
				<div class="card">
					<p>{reason}</p>
					<h2>Accepted physical ID</h2>
					<ul>
						{#each ACCEPTED_ID.physical as id (id)}<li>{id}</li>{/each}
					</ul>
					<h2>Accepted digital ID</h2>
					<ul>
						{#each ACCEPTED_ID.digital as id (id)}<li>{id}</li>{/each}
					</ul>
					<p class="fine">
						Want to use your passport next time? Verify your identity at
						<a href="https://auth.hackclub.com" rel="noreferrer">auth.hackclub.com</a>, then sign in
						again.
					</p>
				</div>
			{:else}
				<p class="fine">
					Staff: the clock and light sweep are live. Scan the QR code to confirm this passport on
					your own phone. The code changes every minute.
				</p>
			{/if}
		{/if}
	</section>

	<footer>An unofficial companion to Hack Club Identity Vault · passport.lamparter.dev</footer>
</main>

<style>
	main {
		position: relative;
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.75rem, 2.5svh, 1.75rem);
		padding: 0 4vw calc(1rem + env(safe-area-inset-bottom));
		overflow: hidden;
		background:
			radial-gradient(90% 60% at 50% 35%, #2a2a3a 0%, transparent 70%),
			linear-gradient(180deg, var(--dark), var(--darker));
		isolation: isolate;
	}

	/* The whole screen takes the verdict colour as the passport opens. */
	.flood {
		position: absolute;
		inset: 0;
		z-index: -2;
		background:
			radial-gradient(80% 55% at 50% 40%, rgba(255, 255, 255, 0.22), transparent 70%),
			linear-gradient(180deg, var(--state, transparent), var(--state-deep, transparent));
		clip-path: circle(0% at 50% 45%);
	}
	[data-state='rejected'] .flood {
		background:
			repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.22) 0 28px, transparent 28px 56px),
			linear-gradient(180deg, var(--state), var(--state-deep));
	}
	.signed-in .flood {
		animation: flood 1.2s 2s cubic-bezier(0.5, 0, 0.2, 1) forwards;
	}
	@keyframes flood {
		to {
			clip-path: circle(150% at 50% 45%);
		}
	}

	.skyline {
		position: absolute;
		z-index: -1;
		left: 0;
		right: 0;
		bottom: 0;
		height: min(24vw, 22svh);
		color: rgba(255, 255, 255, 0.07);
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-position: bottom;
		mask-position: bottom;
	}

	nav {
		width: 100%;
		max-width: 60rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 3.25rem;
		padding-top: env(safe-area-inset-top);
	}
	.brand {
		font-size: 0.95rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.9;
	}
	.brand b {
		background: var(--red);
		padding: 0.2em 0.5em;
		border-radius: 0.35em;
		margin-right: 0.2em;
	}
	nav button {
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		color: inherit;
		background: rgba(0, 0, 0, 0.28);
		border: 1px solid rgba(255, 255, 255, 0.35);
		border-radius: 99em;
		padding: 0.45em 1em;
		cursor: pointer;
	}
	nav button:hover {
		background: rgba(0, 0, 0, 0.45);
	}

	.brief {
		width: 100%;
		max-width: 34rem;
		text-align: center;
		animation: rise 0.7s 1.4s both;
	}
	.signed-in .brief {
		animation-delay: 2.9s;
		color: var(--state-ink);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}
	h1 {
		margin: 0 0 0.4rem;
		font-size: clamp(1.4rem, 5vw, 2rem);
		line-height: 1.1;
		text-wrap: balance;
	}
	p {
		margin: 0 0 0.75rem;
		line-height: 1.45;
		text-wrap: pretty;
	}
	.brief > p {
		opacity: 0.85;
	}
	.error {
		background: rgba(236, 55, 80, 0.18);
		border: 1px solid var(--red);
		border-radius: 0.6rem;
		padding: 0.6rem 0.9rem;
		opacity: 1 !important;
	}
	.demo {
		font-size: 0.85rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem 0.9rem;
	}

	.callout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		text-align: left;
		margin-bottom: 0.9rem;
	}
	.callout .icon {
		flex: none;
		width: clamp(3.5rem, 16vw, 5rem);
		height: clamp(3.5rem, 16vw, 5rem);
	}
	.callout h1 {
		font-size: clamp(2.2rem, 10.5vw, 3.6rem);
		text-transform: uppercase;
		letter-spacing: 0.01em;
		line-height: 0.95;
		margin-bottom: 0.3rem;
	}
	.callout p {
		margin: 0;
		font-weight: 700;
		font-size: clamp(0.95rem, 3.6vw, 1.15rem);
		line-height: 1.25;
	}

	.card {
		text-align: left;
		background: rgba(0, 0, 0, 0.42);
		border: 1px solid rgba(255, 255, 255, 0.28);
		border-radius: 1rem;
		padding: 1rem 1.2rem;
		color: #fff;
	}
	.card h2 {
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin: 0.9rem 0 0.35rem;
		opacity: 0.8;
	}
	.card ul {
		margin: 0;
		padding-left: 1.2rem;
		line-height: 1.5;
	}
	.fine {
		font-size: 0.85rem;
		opacity: 0.85;
		margin: 0.9rem 0 0;
	}

	footer {
		margin-top: auto;
		padding-top: 1rem;
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		opacity: 0.55;
		text-align: center;
	}
	.signed-in footer {
		color: var(--state-ink);
		opacity: 0.7;
	}
</style>
