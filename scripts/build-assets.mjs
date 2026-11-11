// Converts black-on-white / white-on-transparent line art into black-with-alpha
// PNG masks so they can be tinted with CSS `mask-image`.
// Usage: node scripts/build-assets.mjs <source-dir>
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const src = process.argv[2];
if (!src) {
	console.error('usage: node scripts/build-assets.mjs <source-dir>');
	process.exit(1);
}
const out = path.resolve('static/art');
await mkdir(out, { recursive: true });

/** name -> [relative source, optional region to blank {x,y,w,h} as fractions] */
const files = {
	'dino-wave': ['d_wave.png', { x: 0, y: 0.85, w: 0.2, h: 0.15 }],
	'dino-confused': ['d_conf.png'],
	'dino-smile': ['d_smile.png'],
	'dino-8bit': ['d_8bit.png'],
	'dino-prog': ['d_prog.png'],
	'dino-term': ['d_term.png'],
	'dino-pizza': ['d_pizza.png'],
	'dino-sleep': ['d_sleep.png'],
	skyline: ['illustrations/london skyline.png'],
	'tower-bridge': ['illustrations/tower bridge.png'],
	'london-eye': ['illustrations/london eye.png'],
	'xml-tags': ['illustrations/xml tags.png'],
	controller: ['illustrations/controller.png']
};

for (const [name, [rel, blank]] of Object.entries(files)) {
	const { data, info } = await sharp(path.join(src, rel))
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const { width, height } = info;
	let transparent = 0;
	for (let i = 3; i < data.length; i += 4) if (data[i] < 128) transparent++;
	const hasAlpha = transparent > (width * height) / 20;
	const mask = Buffer.alloc(width * height * 4);
	for (let p = 0; p < width * height; p++) {
		const i = p * 4;
		const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		let a = hasAlpha ? data[i + 3] : 255 - lum;
		if (blank) {
			const x = (p % width) / width;
			const y = Math.floor(p / width) / height;
			if (x >= blank.x && x <= blank.x + blank.w && y >= blank.y && y <= blank.y + blank.h) a = 0;
		}
		mask[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
	}
	await sharp(mask, { raw: { width, height, channels: 4 } })
		.trim()
		.png({ compressionLevel: 9 })
		.toFile(path.join(out, `${name}.png`));
	console.log(`${name}.png  (${hasAlpha ? 'alpha' : 'luminance'})`);
}
