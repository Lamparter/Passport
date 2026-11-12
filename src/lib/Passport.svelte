<script lang="ts">
	import { onMount } from 'svelte';
	import { mrz } from './mrz';
	import StateIcon from './StateIcon.svelte';
	import { avatarUrl, type Passport } from './types';

	let { passport }: { passport: Passport | null } = $props();

	const lines = $derived(passport ? mrz(passport) : null);
	const avatar = $derived(passport ? avatarUrl(passport.slackId) : null);

	let photo: HTMLImageElement | undefined = $state();
	let photoFailed = $state(false);
	let now: Date | null = $state(null);
	let qr: string | null = $state(null);

	const fmtDate = (d: Date | string | number) =>
		new Date(d)
			.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
			.toUpperCase();

	const ageText = $derived.by(() => {
		if (!passport) return '';
		if (passport.dob) return `${fmtDate(passport.dob)} (${passport.age})`;
		if (passport.state === 'verified') return '13–18 · VERIFIED';
		if (passport.state === 'adult') return 'OVER 18 · VERIFIED';
		return 'NOT VERIFIED';
	});

	const headline = $derived(
		passport?.state === 'rejected' ? 'NOT VERIFIED' : passport ? 'VERIFIED' : ''
	);
	const subline = $derived(
		passport?.state === 'verified'
			? 'Hack Clubber · age 13–18'
			: passport?.state === 'adult'
				? 'Over 18 · see event staff'
				: 'Present another form of ID'
	);

	async function refreshQr() {
		try {
			const res = await fetch('/api/scan');
			qr = res.ok ? ((await res.json()) as { svg: string }).svg : null;
		} catch {
			qr = null;
		}
	}

	onMount(() => {
		if (photo && photo.complete && photo.naturalWidth === 0) photoFailed = true;
		if (!passport) return;
		now = new Date();
		const tick = setInterval(() => (now = new Date()), 1000);
		let scan: ReturnType<typeof setInterval> | undefined;
		if (passport.state !== 'rejected') {
			refreshQr();
			scan = setInterval(refreshQr, 45_000);
		}
		return () => {
			clearInterval(tick);
			clearInterval(scan);
		};
	});
</script>

<div class="scene" class:signed-in={passport} data-state={passport?.state}>
	<div class="book">
		<!-- Data page (bottom half of the open passport) -->
		<div class="page data">
			<div class="guilloche"></div>
			<i class="art wm skyline" style="--src: url(/art/skyline.png)"></i>
			<i class="art wm dino" style="--src: url(/art/dino-wave.png)"></i>
			<i class="art wm bridge" style="--src: url(/art/tower-bridge.png)"></i>

			{#if passport && lines}
				<header>
					<div class="issuer">
						<b>HACK CLUB</b>
						<span>PASSPORT · PASSEPORT · PASAPORTE</span>
					</div>
					<dl class="doc">
						<div><dt>Type</dt><dd>P</dd></div>
						<div><dt>Code</dt><dd>HCB</dd></div>
						<div><dt>Passport No.</dt><dd class="num">{passport.number}</dd></div>
					</dl>
				</header>

				<div class="photo">
					<i
						class="art"
						style="--src: url(/art/{passport.state === 'rejected' ? 'dino-confused' : 'dino-smile'}.png)"
					></i>
					{#if avatar && !photoFailed}
						<img
							bind:this={photo}
							src={avatar}
							alt="{passport.givenNames} {passport.surname}"
							referrerpolicy="no-referrer"
							onerror={() => (photoFailed = true)}
						/>
					{/if}
					<span class="kinegram"><i class="art" style="--src: url(/art/dino-8bit.png)"></i></span>
				</div>

				<dl class="fields">
					<div class="wide">
						<dt>Surname <i>/ Nom</i></dt>
						<dd>{passport.surname}</dd>
					</div>
					<div class="wide">
						<dt>Given names <i>/ Prénoms</i></dt>
						<dd>{passport.givenNames}</dd>
					</div>
					<div>
						{#if passport.country}
							<dt>Country <i>/ Pays</i></dt>
							<dd>{passport.country.name}</dd>
						{:else}
							<dt>Nationality <i>/ Nationalité</i></dt>
							<dd>Hack Clubber</dd>
						{/if}
					</div>
					<div>
						<dt>{passport.dob ? 'Date of birth' : 'Age'} <i>/ {passport.dob ? 'Né(e) le' : 'Âge'}</i></dt>
						<dd>{ageText}</dd>
					</div>
					<div>
						<dt>Date of check <i>/ Vérifié le</i></dt>
						<dd>{fmtDate(passport.issuedAt)}</dd>
					</div>
					<div>
						<dt>Slack ID</dt>
						<dd>{passport.slackId ?? '—'}</dd>
					</div>
					<div class="wide">
						<dt>Authority <i>/ Autorité</i></dt>
						<dd>Hack Club Identity Vault</dd>
					</div>
				</dl>

				<div class="stamp">
					<span>{passport.state === 'rejected' ? 'IDV' : 'IDV CHECKED'}</span>
					<b>{passport.state === 'verified' ? 'VERIFIED' : passport.state === 'adult' ? 'ADULT 18+' : 'REFUSED'}</b>
					<span>IDENTITY VAULT</span>
				</div>

				<div class="mrz" aria-hidden="true">
					<span>{lines[0]}</span>
					<span>{lines[1]}</span>
				</div>
				<div class="holo"></div>
			{/if}
		</div>

		<!-- Cover: front is the passport jacket, back is the verdict page -->
		<div class="cover">
			<div class="face front">
				<div class="upright">
					<div class="top">
						<span class="foil title">HACK CLUB</span>
						<span class="crest">
							<i class="art" style="--src: url(/art/dino-wave.png)"></i>
						</span>
					</div>
					{#if passport}
						<span class="foil rule">✦ ✦ ✦</span>
					{:else}
						<a class="signin" href="/auth/login" data-sveltekit-reload>
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><path
									d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Zm3 3a2 2 0 0 1 1 3.7V19h-2v-2.3A2 2 0 0 1 12 13Z"
								/></svg
							>
							Sign in with Hack Club
						</a>
					{/if}
					<div class="bottom">
						<span class="foil word">PASSPORT</span>
						<span class="foil langs">PASSEPORT · PASAPORTE</span>
						<span class="chip"></span>
					</div>
				</div>
			</div>

			<div class="face back">
				{#if passport}
					<div class="band">
						<span>HACK CLUB · IDENTITY VAULT</span>
						<span class="clock">
							{#if now}
								<i class="live"></i>
								{now.toLocaleTimeString('en-GB')} · {fmtDate(now)}
							{/if}
						</span>
					</div>
					<div class="verdict">
						<span class="icon"><StateIcon state={passport.state} /></span>
						<div class="words">
							<b>{headline}</b>
							<span>{subline}</span>
						</div>
						{#if passport.state !== 'rejected'}
							<div class="qr">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG generated by our own server -->
								<span>{#if qr}{@html qr}{/if}</span>
								<small>STAFF SCAN</small>
							</div>
						{/if}
					</div>
					<div class="shine"></div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.scene {
		--w: min(92vw, 58svh, 600px);
		--h: calc(var(--w) / 1.42);
		position: relative;
		width: var(--w);
		height: calc(var(--h) * 2);
		perspective: calc(var(--w) * 4.5);
		perspective-origin: 50% 40%;
	}

	/* The book's own box is the lower (data) page; the cover hinges on its top edge.
	   Closed, the whole book is turned a quarter so the spine sits on the left. */
	.book {
		position: absolute;
		left: 0;
		top: var(--h);
		width: var(--w);
		height: var(--h);
		font-size: calc(var(--w) / 100);
		transform-style: preserve-3d;
		transform: translateY(calc(var(--h) * -0.5)) rotateZ(-90deg);
		animation: book-in 0.9s cubic-bezier(0.2, 0.9, 0.25, 1) both;
	}
	.signed-in .book {
		animation:
			book-in 0.9s cubic-bezier(0.2, 0.9, 0.25, 1) both,
			book-turn 1.1s 1.1s cubic-bezier(0.65, 0, 0.25, 1) forwards;
	}

	.cover {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform-origin: 50% 0;
		transform: translateZ(1px) rotateX(0deg);
		animation:
			cover-ajar 1.1s 0.8s cubic-bezier(0.3, 0.8, 0.3, 1) forwards,
			cover-breathe 4.5s 1.9s ease-in-out infinite alternate;
	}
	.signed-in .cover {
		animation: cover-open 1.5s 1.5s cubic-bezier(0.6, 0.05, 0.2, 1) forwards;
	}

	@keyframes book-in {
		from {
			opacity: 0;
			transform: translateY(calc(var(--h) * -0.5 + 8em)) rotateZ(-97deg) scale(0.86);
		}
		to {
			opacity: 1;
			transform: translateY(calc(var(--h) * -0.5)) rotateZ(-90deg) scale(1);
		}
	}
	@keyframes book-turn {
		to {
			transform: translateY(0) rotateZ(0deg);
		}
	}
	@keyframes cover-ajar {
		to {
			transform: translateZ(1px) rotateX(17deg);
		}
	}
	@keyframes cover-breathe {
		from {
			transform: translateZ(1px) rotateX(17deg);
		}
		to {
			transform: translateZ(1px) rotateX(11deg);
		}
	}
	@keyframes cover-open {
		to {
			transform: translateZ(1px) rotateX(180deg);
		}
	}

	.page,
	.face {
		position: absolute;
		inset: 0;
		border-radius: 2.6em;
		overflow: hidden;
	}
	.face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	/* ───────── Cover (front) ───────── */
	.front {
		background:
			radial-gradient(120% 90% at 30% 20%, rgba(255, 255, 255, 0.16), transparent 55%),
			linear-gradient(180deg, rgba(0, 0, 0, 0.32), transparent 9%),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"),
			linear-gradient(200deg, #f04a61, var(--red) 40%, var(--red-deep));
		box-shadow:
			0 3em 6em -1em rgba(0, 0, 0, 0.6),
			inset 0 0 0 0.25em rgba(0, 0, 0, 0.12);
	}
	/* Portrait artwork, pre-rotated so it stands upright while the book is closed. */
	.upright {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--h);
		height: var(--w);
		transform: translate(-50%, -50%) rotate(90deg);
		display: grid;
		grid-template-rows: 1fr auto 1fr;
		justify-items: center;
		padding: 7em 5em 6em;
		text-align: center;
	}
	.upright::before {
		content: '';
		position: absolute;
		inset: 2.6em;
		border: 0.35em solid rgba(241, 217, 143, 0.55);
		border-radius: 1.4em;
		pointer-events: none;
	}
	.top,
	.bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.top {
		gap: 3em;
	}
	.bottom {
		justify-content: flex-end;
		gap: 1.2em;
	}
	.foil {
		background: var(--foil);
		background-size: 220% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		font-weight: 700;
		animation: foil 6s ease-in-out infinite alternate;
	}
	@keyframes foil {
		to {
			background-position: 100% 0;
		}
	}
	.title {
		font-size: 7.4em;
		letter-spacing: 0.14em;
		margin-right: -0.14em;
		line-height: 1;
	}
	.crest {
		width: 22em;
		height: 22em;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--gold);
		border: 0.5em solid currentColor;
		box-shadow:
			0 0 0 0.9em var(--red),
			0 0 0 1.2em rgba(241, 217, 143, 0.7);
	}
	.crest .art {
		width: 68%;
		height: 74%;
		background: var(--foil);
	}
	.rule {
		align-self: center;
		font-size: 4em;
		letter-spacing: 0.6em;
	}
	.signin {
		align-self: center;
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-size: 3.9em;
		font-weight: 700;
		white-space: nowrap;
		text-decoration: none;
		color: #3a1a00;
		padding: 0.72em 1.1em;
		border-radius: 99em;
		background: var(--foil);
		background-size: 220% 100%;
		box-shadow:
			0 0.12em 0 #8c6a1f,
			0 0.5em 1.2em rgba(0, 0, 0, 0.35),
			inset 0 0.08em 0 rgba(255, 255, 255, 0.7);
		animation: foil 3.5s ease-in-out infinite alternate;
		transition: transform 0.15s ease;
	}
	.signin:hover,
	.signin:focus-visible {
		transform: scale(1.05);
	}
	.signin:focus-visible {
		outline: 0.18em solid #fff;
		outline-offset: 0.18em;
	}
	.signin svg {
		width: 1.15em;
		height: 1.15em;
		fill: currentColor;
	}
	.word {
		font-size: 6.6em;
		letter-spacing: 0.2em;
		margin-right: -0.2em;
		line-height: 1;
	}
	.langs {
		font-size: 2.3em;
		letter-spacing: 0.3em;
		margin-right: -0.3em;
	}
	/* The e-passport biometric symbol */
	.chip {
		position: relative;
		width: 9em;
		height: 5.4em;
		margin-top: 2em;
		border-top: 1.3em solid var(--gold);
		border-bottom: 1.3em solid var(--gold);
	}
	.chip::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 4.6em;
		height: 4.6em;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: var(--red);
		border: 1.2em solid var(--gold);
	}
	.chip::after {
		content: '';
		position: absolute;
		inset: -1.3em 0;
		border-left: 1.3em solid var(--gold);
		border-right: 1.3em solid var(--gold);
		clip-path: polygon(0 0, 100% 0, 100% 24%, 0 24%, 0 76%, 100% 76%, 100% 100%, 0 100%);
	}

	/* ───────── Verdict page (back of the cover) ───────── */
	.back {
		transform: rotateX(180deg);
		background:
			repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0 2em, transparent 2em 4em),
			linear-gradient(160deg, var(--state), var(--state-deep));
		color: var(--state-ink);
		display: flex;
		flex-direction: column;
		box-shadow: inset 0 -1.5em 2em -1em rgba(0, 0, 0, 0.35);
	}
	[data-state='rejected'] .back {
		background:
			repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.28) 0 3em, transparent 3em 6em),
			linear-gradient(160deg, var(--state), var(--state-deep));
	}
	.band {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 3em 4.5em 0;
		font-size: 1em;
		font-weight: 700;
		letter-spacing: 0.12em;
	}
	.band span {
		font-size: 2.5em;
	}
	.clock {
		font-family: var(--mono);
		letter-spacing: 0.04em;
		font-variant-numeric: tabular-nums;
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}
	.live {
		width: 0.7em;
		height: 0.7em;
		border-radius: 50%;
		background: currentColor;
		animation: pulse 1s steps(2, jump-none) infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.15;
		}
	}
	.verdict {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 4em;
		padding: 0 4.5em 2em;
	}
	.icon {
		flex: none;
		width: 24em;
		height: 24em;
		filter: drop-shadow(0 0.6em 0.8em rgba(0, 0, 0, 0.25));
	}
	.words {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
	.words b {
		font-size: 9.6em;
		line-height: 0.92;
		letter-spacing: 0.01em;
	}
	.words span {
		font-size: 3.5em;
		font-weight: 700;
		line-height: 1.15;
	}
	[data-state='rejected'] .words b {
		font-size: 10.5em;
	}
	.qr {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8em;
	}
	.qr span {
		display: block;
		width: 21em;
		height: 21em;
		border-radius: 1.2em;
		background: #fff;
		overflow: hidden;
		box-shadow: 0 0.6em 1.4em rgba(0, 0, 0, 0.3);
	}
	.qr span :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.qr small {
		font-size: 2em;
		font-weight: 700;
		letter-spacing: 0.2em;
	}
	/* A band of light that keeps sweeping: a screenshot can't do this. */
	.shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 40%,
			rgba(255, 255, 255, 0.28) 50%,
			transparent 60%
		);
		background-size: 300% 100%;
		animation: sweep 3.2s linear infinite;
		pointer-events: none;
	}
	@keyframes sweep {
		from {
			background-position: 150% 0;
		}
		to {
			background-position: -50% 0;
		}
	}

	/* ───────── Data page ───────── */
	.data {
		background: var(--paper);
		color: var(--ink);
		box-shadow:
			0 3em 6em -1em rgba(0, 0, 0, 0.6),
			inset 0 1.5em 2em -1em rgba(0, 0, 0, 0.3);
	}
	.guilloche {
		position: absolute;
		inset: 0;
		background:
			repeating-radial-gradient(circle at 12% 18%, rgba(236, 55, 80, 0.1) 0 0.18em, transparent 0.18em 1.5em),
			repeating-radial-gradient(circle at 88% 70%, rgba(51, 142, 218, 0.1) 0 0.18em, transparent 0.18em 1.7em),
			repeating-radial-gradient(circle at 50% 120%, rgba(241, 196, 15, 0.12) 0 0.18em, transparent 0.18em 1.3em),
			linear-gradient(120deg, rgba(236, 55, 80, 0.07), rgba(51, 142, 218, 0.07));
	}
	.wm {
		position: absolute;
		pointer-events: none;
	}
	.wm.skyline {
		left: 0;
		right: 0;
		bottom: 13.5em;
		height: 18em;
		color: rgba(236, 55, 80, 0.16);
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
	}
	.wm.dino {
		right: 3em;
		top: 13em;
		width: 26em;
		height: 34em;
		color: rgba(31, 45, 61, 0.09);
	}
	.wm.bridge {
		right: 31em;
		top: 2.2em;
		width: 12em;
		height: 6em;
		color: rgba(51, 142, 218, 0.3);
	}

	header {
		position: absolute;
		left: 4.5em;
		right: 4.5em;
		top: 3em;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.issuer {
		display: flex;
		flex-direction: column;
	}
	.issuer b {
		font-size: 4.6em;
		line-height: 1;
		letter-spacing: 0.06em;
		color: var(--red);
	}
	.issuer span {
		font-size: 1.75em;
		letter-spacing: 0.16em;
		color: #5b6b80;
		margin-top: 0.35em;
	}
	dl,
	dd {
		margin: 0;
	}
	dt {
		font-size: 1.7em;
		color: #5b6b80;
		white-space: nowrap;
	}
	dt i {
		opacity: 0.75;
	}
	dd {
		font-size: 3.15em;
		font-weight: 700;
		line-height: 1.1;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.doc {
		display: flex;
		gap: 3.5em;
	}
	.num {
		font-family: var(--mono);
		letter-spacing: 0.06em;
		color: var(--red-deep);
	}

	.photo {
		position: absolute;
		left: 4.5em;
		top: 12.5em;
		width: 26em;
		height: 33em;
		border-radius: 1.2em;
		background: linear-gradient(160deg, #dfe6ee, #c5d0dc);
		box-shadow:
			0 0 0 0.3em #fff,
			0 0 0 0.5em rgba(31, 45, 61, 0.25);
		color: #7b8ba0;
		display: grid;
		place-items: center;
	}
	.photo > .art {
		width: 70%;
		height: 60%;
	}
	.photo img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: inherit;
	}
	.kinegram {
		position: absolute;
		right: -3em;
		bottom: -2.5em;
		width: 11em;
		height: 11em;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: conic-gradient(from 0deg, #ff8a9b, #ffd98a, #9af0c8, #8ac6ff, #d4a5ff, #ff8a9b);
		opacity: 0.82;
		box-shadow: inset 0 0 0 0.3em rgba(255, 255, 255, 0.7);
		animation: spin 7s linear infinite;
	}
	.kinegram .art {
		width: 58%;
		height: 58%;
		color: rgba(255, 255, 255, 0.92);
		animation: spin 7s linear infinite reverse;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.fields {
		position: absolute;
		left: 35.5em;
		right: 4.5em;
		top: 12em;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25em 3em;
	}
	.fields > div {
		min-width: 0;
	}
	.fields .wide {
		grid-column: 1 / -1;
	}

	.stamp {
		position: absolute;
		right: 3.5em;
		bottom: 15.5em;
		width: 23em;
		height: 23em;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6em;
		color: var(--state);
		border: 0.7em solid currentColor;
		outline: 0.25em solid currentColor;
		outline-offset: -1.6em;
		transform: rotate(-14deg) scale(2.2);
		opacity: 0;
		mix-blend-mode: multiply;
		animation: stamp 0.35s 3.1s cubic-bezier(0.3, 1.4, 0.5, 1) forwards;
	}
	.stamp span {
		font-size: 1.7em;
		font-weight: 700;
		letter-spacing: 0.18em;
	}
	.stamp b {
		font-size: 3.5em;
		letter-spacing: 0.04em;
		border-block: 0.1em solid currentColor;
		padding: 0.1em 0.2em;
	}
	@keyframes stamp {
		to {
			transform: rotate(-14deg) scale(1);
			opacity: 0.82;
		}
	}

	.mrz {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 13.5em;
		padding: 0 4.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.6em;
		background: rgba(255, 255, 255, 0.55);
		border-top: 0.15em solid rgba(31, 45, 61, 0.15);
		font-family: var(--mono);
	}
	.mrz span {
		font-size: 3.2em;
		line-height: 1;
		white-space: nowrap;
		letter-spacing: 0.052em;
	}
	.holo {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			115deg,
			transparent 20%,
			rgba(255, 90, 120, 0.35) 34%,
			rgba(255, 220, 120, 0.35) 42%,
			rgba(120, 255, 190, 0.35) 50%,
			rgba(120, 180, 255, 0.35) 58%,
			rgba(210, 140, 255, 0.35) 66%,
			transparent 80%
		);
		background-size: 300% 100%;
		mix-blend-mode: soft-light;
		animation: sweep 5s linear infinite;
		pointer-events: none;
	}
</style>
