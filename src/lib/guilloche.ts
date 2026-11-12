// Security-print line work, generated as SVG so it stays crisp at any size.

const uri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const n = (v: number) => v.toFixed(2);

/**
 * A tileable band of interlaced sine waves, like the background of a passport page.
 * `sets` is a list of [cycles per tile, amplitude, number of phase-shifted strands].
 */
export function waves(
	color: string,
	{ width = 240, height = 60, stroke = 0.45, sets = [[2, 22, 9]] as [number, number, number][] } = {}
): string {
	let paths = '';
	for (const [cycles, amp, strands] of sets) {
		for (let s = 0; s < strands; s++) {
			const phase = (s / strands) * Math.PI * 2;
			let d = '';
			for (let x = 0; x <= width; x += 3) {
				const y = height / 2 + amp * Math.sin((x / width) * cycles * Math.PI * 2 + phase);
				d += `${x === 0 ? 'M' : 'L'}${x} ${n(y)}`;
			}
			paths += `<path d="${d}"/>`;
		}
	}
	return uri(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" stroke="${color}" stroke-width="${stroke}">${paths}</svg>`
	);
}

/** A spirograph rosette, like the medallions engraved on banknotes and passports. */
export function rosette(
	color: string,
	{ petals = 12, rings = 14, stroke = 0.35, inner = 0.38, depth = 0.26 } = {}
): string {
	const size = 200;
	const c = size / 2;
	let paths = '';
	for (let r = 0; r < rings; r++) {
		const shift = (r / rings) * Math.PI * 2;
		let d = '';
		for (let i = 0; i <= 360; i++) {
			const t = (i / 360) * Math.PI * 2;
			const radius = c * 0.96 * (inner + depth + depth * Math.cos(petals * t + shift) * Math.cos(t * 2 + shift));
			d += `${i === 0 ? 'M' : 'L'}${n(c + radius * Math.cos(t))} ${n(c + radius * Math.sin(t))}`;
		}
		paths += `<path d="${d}Z"/>`;
	}
	return uri(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none" stroke="${color}" stroke-width="${stroke}">${paths}</svg>`
	);
}
