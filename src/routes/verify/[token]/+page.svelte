<script lang="ts">
	import { onMount } from 'svelte';
	import StateIcon from '$lib/StateIcon.svelte';
	import { avatarUrl, STATE_LABEL } from '$lib/types';

	let { data } = $props();
	const passport = $derived(data.passport);
	const verdict = $derived(passport ? passport.state : 'expired');
	const avatar = $derived(passport ? avatarUrl(passport.slackId) : null);

	let photoFailed = $state(false);
	let seconds: number | null = $state(null);

	onMount(() => {
		if (!data.issuedAt) return;
		const update = () => (seconds = Math.max(0, Math.round((Date.now() - data.issuedAt!) / 1000)));
		update();
		const t = setInterval(update, 1000);
		return () => clearInterval(t);
	});
</script>

<svelte:head>
	<title>Staff check · Hack Club Passport</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main data-state={verdict}>
	<p class="tag">Hack Club Passport · staff check</p>
	<span class="icon"><StateIcon state={verdict} /></span>

	{#if passport}
		<h1>{STATE_LABEL[passport.state]}</h1>
		<div class="who">
			{#if avatar && !photoFailed}
				<img src={avatar} alt="" referrerpolicy="no-referrer" onerror={() => (photoFailed = true)} />
			{/if}
			<div>
				<b>{passport.givenNames} {passport.surname}</b>
				<span>
					{passport.age !== null
						? `Age ${passport.age}`
						: passport.state === 'verified'
							? 'Age 13–18'
							: 'Over 18'} · No. {passport.number}
				</span>
			</div>
		</div>
		<p>
			{#if passport.state === 'adult'}
				Identity verified by Hack Club, but this attendee is 18 or over.
			{:else}
				Identity verified by Hack Club. Check the name and photo match the passport you were shown.
			{/if}
		</p>
		<p class="fine">
			{#if seconds !== null}Code issued {seconds}s ago ·{/if} status checked {new Date(
				passport.issuedAt
			).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
		</p>
	{:else}
		<h1>{data.result === 'expired' ? 'Code expired' : 'Invalid code'}</h1>
		<p>
			{data.result === 'expired'
				? 'This QR code is more than 90 seconds old. Ask the attendee to open their passport again and scan the fresh code.'
				: "This isn't a genuine Hack Club Passport code. Ask for another form of ID."}
		</p>
	{/if}
</main>

<style>
	main {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem 6vw;
		text-align: center;
		color: var(--state-ink);
		background: linear-gradient(180deg, var(--state), var(--state-deep));
	}
	.tag {
		font-size: 0.8rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.8;
		margin: 0;
	}
	.icon {
		width: min(46vw, 13rem);
		height: min(46vw, 13rem);
	}
	h1 {
		margin: 0;
		font-size: clamp(2.6rem, 13vw, 5rem);
		line-height: 0.95;
		text-transform: uppercase;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-align: left;
		background: rgba(0, 0, 0, 0.22);
		border-radius: 1rem;
		padding: 0.8rem 1.1rem;
	}
	.who img {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 0.7rem;
		object-fit: cover;
	}
	.who b {
		display: block;
		font-size: 1.4rem;
		line-height: 1.15;
	}
	p {
		margin: 0;
		max-width: 28rem;
		line-height: 1.45;
		font-weight: 700;
	}
	.fine {
		font-size: 0.8rem;
		font-weight: 400;
		opacity: 0.8;
	}
</style>
