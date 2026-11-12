<script lang="ts">
	import { onMount } from 'svelte';
	import { rosette, waves } from './guilloche';
	import { mrz } from './mrz';
	import StateIcon from './StateIcon.svelte';
	import { ACCEPTED_BRIEF, avatarUrl, type Passport } from './types';

	let {
		passport,
		entering = false
	}: {
		passport: Passport | null;
		/** Play the slow first-visit opening that leads into Hack Club sign-in. */
		entering?: boolean;
	} = $props();

	// Security line work: fine, pale and tileable, as on a real data page.
	const art = [
		`--waves-rose: ${waves('#b5475c', { sets: [[2, 20, 10], [3, 9, 6]], stroke: 0.4 })}`,
		`--waves-slate: ${waves('#56749c', { sets: [[1, 24, 8], [4, 7, 6]], stroke: 0.4 })}`,
		`--waves-white: ${waves('#ffffff', { sets: [[2, 20, 10], [3, 9, 6]], stroke: 0.6 })}`,
		`--rosette: ${rosette('#b5475c', { petals: 12, rings: 12 })}`,
		`--rosette-slate: ${rosette('#56749c', { petals: 16, rings: 10, inner: 0.5, depth: 0.2 })}`
	].join(';');

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

	const ageBand = $derived(
		passport?.state === 'verified' ? '13–18' : passport?.state === 'adult' ? '18+' : 'UNVERIFIED'
	);
	const headline = $derived(passport?.state === 'rejected' ? 'Not verified' : 'Verified');
	const subline = $derived(
		passport?.state === 'verified'
			? 'Hack Clubber · aged 13–18'
			: passport?.state === 'adult'
				? 'Over 18 · see event staff'
				: 'Present another form of ID'
	);
	const microWord = $derived(
		passport?.state === 'verified' ? 'VERIFIED' : passport?.state === 'adult' ? 'ADULT' : 'REFUSED'
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

<div
	class="scene"
	class:signed-in={passport}
	class:entering
	data-state={passport?.state}
	style={art}
>
	<div class="book">
		<!-- ═════ Data page (lower half of the open passport) ═════ -->
		<div class="page data">
			<div class="print"></div>

			{#if passport && lines}
				<div class="doctype"><b>Passport</b><b>Passeport</b></div>
				<h2 class="country">Hack Club</h2>
				<i class="epass"></i>

				<dl class="meta">
					<div><dt>Type/<i>Type</i></dt><dd>P</dd></div>
					<div><dt>Code/<i>Code</i></dt><dd>HCA</dd></div>
					<div><dt>Passport No./<i>N° de passeport</i></dt><dd>{passport.number}</dd></div>
				</dl>

				<!-- Square, so a Slack avatar is shown whole; monochrome like a laser-engraved portrait -->
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
				</div>

				<dl class="fields">
					<div class="row">
						<div><dt>Surname/<i>Nom</i> (1)</dt><dd>{passport.surname}</dd></div>
					</div>
					<div class="row">
						<div><dt>Given names/<i>Prénoms</i> (2)</dt><dd>{passport.givenNames}</dd></div>
					</div>
					<div class="row">
						<div><dt>Nationality/<i>Nationalité</i> (3)</dt><dd>Hack Clubber</dd></div>
						<div><dt>Age/<i>Âge</i> (4)</dt><dd>{passport.age ?? ageBand}</dd></div>
					</div>
					<div class="row">
						{#if passport.dob}
							<div>
								<dt>Date of birth/<i>Date de naissance</i> (5)</dt>
								<dd>{fmtDate(passport.dob)}</dd>
							</div>
						{/if}
						{#if passport.country}
							<div><dt>Country/<i>Pays</i> (6)</dt><dd>{passport.country.name}</dd></div>
						{:else}
							<div><dt>Slack ID/<i>ID Slack</i> (6)</dt><dd>{passport.slackId ?? '—'}</dd></div>
						{/if}
					</div>
					<div class="row">
						<div>
							<dt>Date of issue/<i>Date de délivrance</i> (7)</dt>
							<dd>{fmtDate(passport.issuedAt)}</dd>
						</div>
						<div><dt>Authority/<i>Autorité</i> (8)</dt><dd>IDV</dd></div>
					</div>
				</dl>

				<!-- Secondary "ghost" portrait, as printed on real data pages -->
				{#if avatar && !photoFailed}
					<div class="ghost"><img src={avatar} alt="" referrerpolicy="no-referrer" /></div>
				{/if}

				<div class="mrz" aria-hidden="true">
					<span>{lines[0]}</span>
					<span>{lines[1]}</span>
				</div>
				<div class="holo"></div>
			{/if}
		</div>

		<!-- ═════ Cover: jacket on the front, observations page on the back ═════ -->
		<div class="cover">
			<div class="face front">
				<div class="upright">
					<span class="foil nation">Hack Club</span>
					<span class="emblem">
						<i class="plate"></i>
						<i class="etch"></i>
					</span>
					<span class="foil word">Passport</span>
					<span class="foil langs">Passeport · Pasaporte</span>
					<i class="epass foilmark"></i>
				</div>
			</div>

			<div class="face back">
				<div class="print upper"></div>
				{#if passport}
					<p class="reserved">
						Official observations <span>·</span> <i>Observations officielles</i>
					</p>

					<!-- The verdict, as an entry-clearance vignette -->
					<div class="label">
						<div class="band">
							<span>Hack Club Identity Vault</span>
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
								{#if passport.state === 'rejected'}
									<small>Accepted: {ACCEPTED_BRIEF.join(' · ')}</small>
								{/if}
							</div>
							{#if passport.state !== 'rejected'}
								<div class="qr">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG generated by our own server -->
									<span>{#if qr}{@html qr}{/if}</span>
									<small>Staff scan</small>
								</div>
							{/if}
						</div>
						<div class="micro" aria-hidden="true">
							<span>{`${passport.number}<<${microWord}<<HACK<CLUB<IDENTITY<VAULT<<`.repeat(6)}</span>
						</div>
						<div class="shine"></div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.scene {
		--w: min(94vw, 61svh, 640px);
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
		--closed: translateY(calc(var(--h) * -0.5)) rotateZ(-90deg) scale(1.28);
		position: absolute;
		left: 0;
		top: var(--h);
		width: var(--w);
		height: var(--h);
		font-size: calc(var(--w) / 100);
		font-family: var(--text);
		transform-style: preserve-3d;
		transform: var(--closed);
		animation: book-in 0.9s cubic-bezier(0.2, 0.9, 0.25, 1) both;
	}
	.cover {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform-origin: 50% 0;
		transform: translateZ(1px) rotateX(0deg);
	}

	/* Returning from sign-in: turn the book and fold it open on the verdict. */
	.signed-in .book {
		animation:
			book-in 0.9s cubic-bezier(0.2, 0.9, 0.25, 1) both,
			book-turn 1.1s 1.1s cubic-bezier(0.65, 0, 0.25, 1) forwards;
	}
	.signed-in .cover {
		animation: cover-open 1.5s 1.5s cubic-bezier(0.6, 0.05, 0.2, 1) forwards;
	}

	/* First visit: an unhurried opening that carries straight on into Hack Club sign-in. */
	.entering .book {
		animation:
			book-in 1.4s cubic-bezier(0.2, 0.9, 0.25, 1) both,
			book-enter 3.2s 1.9s cubic-bezier(0.55, 0, 0.3, 1) forwards;
	}
	.entering .cover {
		animation: cover-enter 3s 1.9s cubic-bezier(0.5, 0, 0.25, 1) forwards;
	}

	@keyframes book-in {
		from {
			opacity: 0;
			transform: translateY(calc(var(--h) * -0.5 + 8em)) rotateZ(-96deg) scale(1.08);
		}
		to {
			opacity: 1;
			transform: var(--closed);
		}
	}
	@keyframes book-turn {
		to {
			transform: translateY(0) rotateZ(0deg) scale(1);
		}
	}
	@keyframes cover-open {
		to {
			transform: translateZ(1px) rotateX(180deg);
		}
	}
	/* The spread slides across so the opening page ends up filling the view. */
	@keyframes book-enter {
		55% {
			transform: translate(calc(var(--h) * 0.37), calc(var(--h) * -0.5)) rotateZ(-90deg) scale(0.74);
		}
		to {
			transform: translate(0, calc(var(--h) * -0.5)) rotateZ(-90deg) scale(4.4);
		}
	}
	@keyframes cover-enter {
		to {
			transform: translateZ(1px) rotateX(172deg);
		}
	}

	.page,
	.face {
		position: absolute;
		inset: 0;
		border-radius: 2.2em;
		overflow: hidden;
	}
	.face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}
	/* The ICAO biometric-passport symbol */
	.epass {
		display: block;
		aspect-ratio: 433 / 247.5;
		background: currentColor;
		-webkit-mask: url(/art/epassport.svg) center / contain no-repeat;
		mask: url(/art/epassport.svg) center / contain no-repeat;
	}

	/* ══════════ Cover ══════════ */
	.front {
		background:
			/* soft sheen across the jacket */
			linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.07) 48%, transparent 66%),
			/* the spine crease (top edge here = left edge once the book stands upright) */
			linear-gradient(180deg, rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.06) 2.2%, rgba(255, 255, 255, 0.08) 3.2%, transparent 5%),
			/* leather grain */
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.3' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .28 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E"),
			linear-gradient(190deg, #7f1a2f, var(--jacket) 45%, var(--jacket-deep));
		box-shadow:
			0 0 0 0.1em rgba(0, 0, 0, 0.25),
			0 3.5em 6em -1.5em rgba(20, 10, 15, 0.7),
			0 1em 2em -0.5em rgba(20, 10, 15, 0.45);
	}
	/* Portrait artwork, pre-rotated so it stands upright while the book is closed. */
	.upright {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--h);
		height: var(--w);
		transform: translate(-50%, -50%) rotate(90deg);
		text-align: center;
	}
	.upright > * {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}
	.foil {
		font-family: var(--serif);
		text-transform: uppercase;
		white-space: nowrap;
		line-height: 1;
		background: var(--foil);
		background-size: 240% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 0.02em 0 rgba(40, 5, 10, 0.6));
		animation: foil 7s ease-in-out infinite alternate;
	}
	@keyframes foil {
		to {
			background-position: 100% 0;
		}
	}
	.nation {
		top: 1.05em;
		font-size: 8.4em;
		letter-spacing: 0.1em;
		padding-left: 0.1em;
	}
	/* Gold-plated Hack Club sticker: a foil plate in the sticker's shape, with its line art engraved. */
	.emblem {
		top: 23em;
		width: 36em;
		aspect-ratio: 312 / 322;
		filter: drop-shadow(0 0.4em 0.4em rgba(30, 0, 6, 0.5));
	}
	.emblem i {
		position: absolute;
		inset: 0;
	}
	.plate {
		background: var(--foil);
		background-size: 240% 100%;
		-webkit-mask: url(/art/emblem-body.png) center / contain no-repeat;
		mask: url(/art/emblem-body.png) center / contain no-repeat;
		animation: foil 7s ease-in-out infinite alternate;
	}
	.etch {
		background: #7c5210;
		-webkit-mask: url(/art/emblem-lines.png) center / contain no-repeat;
		mask: url(/art/emblem-lines.png) center / contain no-repeat;
		filter: drop-shadow(0.09em 0.09em 0 rgba(255, 246, 205, 0.85));
	}
	.word {
		top: 9.5em;
		font-size: 7em;
		letter-spacing: 0.16em;
		padding-left: 0.16em;
	}
	.langs {
		top: 32.4em;
		font-size: 2.4em;
		letter-spacing: 0.28em;
		padding-left: 0.28em;
	}
	.foilmark {
		bottom: 6em;
		width: 10em;
		background: var(--foil);
		background-size: 240% 100%;
		animation: foil 7s ease-in-out infinite alternate;
	}

	/* ══════════ Paper ══════════ */
	.data,
	.back {
		background: var(--paper);
		color: #20242c;
	}
	.data {
		box-shadow:
			0 0 0 0.1em rgba(0, 0, 0, 0.12),
			0 3.5em 6em -1.5em rgba(10, 10, 20, 0.6),
			inset 0 1.6em 2em -1.2em rgba(31, 45, 61, 0.3);
	}
	.back {
		transform: rotateX(180deg);
		box-shadow:
			inset 0 0 0 0.1em rgba(0, 0, 0, 0.12),
			inset 0 -1.6em 2em -1.2em rgba(31, 45, 61, 0.3);
	}
	.print {
		position: absolute;
		inset: 0;
		background:
			var(--rosette) 104% 30% / 36em 36em no-repeat,
			var(--waves-rose) 0 0 / 40em 10em,
			var(--waves-slate) 0 5em / 52em 13em,
			linear-gradient(100deg, rgba(181, 71, 92, 0.16), rgba(244, 241, 234, 0) 45%, rgba(86, 116, 156, 0.18));
		opacity: 0.3;
	}
	.print.upper {
		background:
			var(--rosette-slate) 50% 50% / 60em 60em no-repeat,
			var(--waves-slate) 0 0 / 40em 10em,
			var(--waves-rose) 0 5em / 52em 13em,
			linear-gradient(260deg, rgba(181, 71, 92, 0.16), rgba(244, 241, 234, 0) 45%, rgba(86, 116, 156, 0.18));
	}

	/* ══════════ Data page ══════════ */
	.doctype {
		position: absolute;
		left: 4.5em;
		top: 3.2em;
		display: flex;
		flex-direction: column;
		font-family: var(--serif);
		text-transform: uppercase;
		color: var(--print);
	}
	.doctype b {
		font-size: 2.8em;
		font-weight: 400;
		letter-spacing: 0.1em;
		line-height: 1.14;
	}
	.country {
		position: absolute;
		left: 5.5em;
		top: 0.36em;
		margin: 0;
		font-family: var(--serif);
		font-weight: 400;
		font-size: 6.8em;
		line-height: 1;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--print);
	}
	.data > .epass {
		position: absolute;
		right: 4.5em;
		top: 3.5em;
		width: 6.6em;
		color: var(--print);
	}

	dl,
	dd {
		margin: 0;
	}
	dt {
		font-size: 1.5em;
		color: var(--label);
		white-space: nowrap;
		line-height: 1.25;
	}
	dt i {
		font-style: italic;
	}
	dd {
		font-family: var(--mono);
		font-size: 2.6em;
		line-height: 1.15;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		position: absolute;
		left: 37.5em;
		right: 4.5em;
		top: 11em;
		display: flex;
		gap: 5em;
	}
	.fields {
		position: absolute;
		left: 37.5em;
		width: 47em;
		top: 17.2em;
		display: flex;
		flex-direction: column;
		gap: 1.3em;
	}
	.row {
		display: flex;
		gap: 2.6em;
	}
	.row > div {
		flex: none;
		min-width: 0;
	}

	.photo {
		position: absolute;
		left: 4.5em;
		top: 11em;
		width: 30em;
		height: 30em;
		overflow: hidden;
		background: linear-gradient(170deg, #e4e7ec, #cdd3db);
		color: #77879b;
		display: grid;
		place-items: center;
	}
	.photo > .art {
		width: 66%;
		height: 60%;
	}
	.photo img,
	.ghost img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: grayscale(1) contrast(1.06);
	}
	.ghost {
		position: absolute;
		right: 4.5em;
		top: 16.5em;
		width: 11em;
		height: 11em;
		overflow: hidden;
		opacity: 0.38;
		mix-blend-mode: multiply;
		-webkit-mask: radial-gradient(closest-side, #000 62%, transparent 100%);
		mask: radial-gradient(closest-side, #000 62%, transparent 100%);
	}

	.mrz {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 13.4em;
		padding: 0 4.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.9em;
		background: rgba(255, 255, 255, 0.8);
		font-family: var(--mono);
	}
	.mrz span {
		font-size: 2.95em;
		line-height: 1;
		white-space: nowrap;
		letter-spacing: 0.04em;
	}
	.holo {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			115deg,
			transparent 25%,
			rgba(255, 90, 120, 0.22) 38%,
			rgba(255, 220, 120, 0.22) 45%,
			rgba(120, 255, 190, 0.22) 52%,
			rgba(120, 180, 255, 0.22) 59%,
			rgba(210, 140, 255, 0.22) 66%,
			transparent 79%
		);
		background-size: 300% 100%;
		mix-blend-mode: soft-light;
		animation: sweep 6s linear infinite;
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

	/* ══════════ Observations page (back of the cover) ══════════ */
	.reserved {
		position: absolute;
		left: 0;
		right: 0;
		top: 1.5em;
		margin: 0;
		text-align: center;
		font-family: var(--serif);
		font-size: 2.3em;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--print);
	}
	.reserved i {
		font-style: normal;
		opacity: 0.7;
	}
	.label {
		position: absolute;
		left: 4.5em;
		right: 4.5em;
		top: 8.6em;
		bottom: 4.5em;
		border-radius: 0.8em;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		color: var(--state-ink);
		background:
			var(--waves-white) 0 0 / 46em 11.5em,
			linear-gradient(165deg, var(--state), var(--state-deep));
		background-blend-mode: soft-light, normal;
		box-shadow:
			inset 0 0 0 0.25em rgba(255, 255, 255, 0.55),
			0 0.2em 0.5em rgba(31, 45, 61, 0.35);
	}
	.band {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 2.8em 4em 0;
	}
	.band span {
		font-family: var(--serif);
		font-size: 2.3em;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.band .clock {
		font-family: var(--mono);
		font-size: 2.1em;
		letter-spacing: 0;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}
	.live {
		width: 0.6em;
		height: 0.6em;
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
		gap: 3em;
		padding: 0 4em;
	}
	.icon {
		flex: none;
		width: 17em;
		height: 17em;
	}
	.words {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1.2em;
	}
	.words b {
		font-family: var(--serif);
		font-weight: 400;
		font-size: 8em;
		line-height: 0.9;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	[data-state='rejected'] .words b {
		font-size: 7em;
	}
	.words span {
		font-size: 2.9em;
		font-weight: 700;
		line-height: 1.15;
		white-space: nowrap;
	}
	.words small {
		font-family: var(--mono);
		font-size: 1.7em;
		line-height: 1.45;
		text-transform: uppercase;
	}
	.qr {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9em;
	}
	/* White quiet zone on all sides, and no rounding that could clip the finder squares. */
	.qr span {
		display: block;
		width: 17.5em;
		height: 17.5em;
		padding: 1.2em;
		background: #fff;
		border-radius: 0.5em;
	}
	.qr span :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		shape-rendering: crispEdges;
	}
	.qr small {
		font-family: var(--serif);
		font-size: 2em;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	/* Microprint, clipped evenly at both ends */
	.micro {
		display: flex;
		justify-content: center;
		margin: 0 4em 2.6em;
		overflow: hidden;
		font-family: var(--mono);
		font-size: 1.1em;
		letter-spacing: 0.1em;
		white-space: nowrap;
		opacity: 0.75;
	}
	.micro span {
		flex: none;
	}
	/* A band of light that keeps sweeping: a screenshot can't do this. */
	.shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.28) 50%, transparent 60%);
		background-size: 300% 100%;
		animation: sweep 3.2s linear infinite;
		pointer-events: none;
	}
</style>
