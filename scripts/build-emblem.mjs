// Turns a Hack Club sticker into the two masks used for the gold-plated cover emblem:
//   emblem-body.png   the sticker's silhouette (the gold plate)
//   emblem-lines.png  its line art (engraved into the plate)
// Usage: node scripts/build-emblem.mjs <sticker.webp>
import sharp from 'sharp';
import path from 'node:path';

const src = process.argv[2];
if (!src) {
	console.error('usage: node scripts/build-emblem.mjs <sticker image>');
	process.exit(1);
}
const out = path.resolve('static/art');
const SCALE = 2;

const meta = await sharp(src).metadata();
const { data, info } = await sharp(src)
	.ensureAlpha()
	.resize(meta.width * SCALE, meta.height * SCALE, { kernel: 'lanczos3' })
	.raw()
	.toBuffer({ resolveWithObject: true });
const { width, height } = info;

const body = Buffer.alloc(width * height * 4);
const lines = Buffer.alloc(width * height * 4);
for (let p = 0; p < width * height; p++) {
	const i = p * 4;
	const a = data[i + 3];
	// Anything that isn't the sticker's white fill counts as ink.
	const ink = Math.min(1, Math.max(0, (235 - Math.min(data[i], data[i + 1], data[i + 2])) / 120));
	body[i + 3] = a;
	lines[i + 3] = Math.round(ink * a);
}
const png = (buf, name) =>
	sharp(buf, { raw: { width, height, channels: 4 } })
		.png({ compressionLevel: 9 })
		.toFile(path.join(out, name));
await png(body, 'emblem-body.png');
await png(lines, 'emblem-lines.png');
console.log(`emblem ${width}x${height}`);
