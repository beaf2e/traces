import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public");
await mkdir(out, { recursive: true });

const main = await readFile(resolve(root, "scripts/icon.svg"));
const maskable = await readFile(resolve(root, "scripts/icon-maskable.svg"));

const targets = [
  // [filename, size, source]
  ["icon-192.png", 192, main],
  ["icon-512.png", 512, main],
  ["icon-1024.png", 1024, main],
  ["icon-maskable-512.png", 512, maskable],
  // apple-touch-icon: opaque, 180×180
  ["apple-icon-180.png", 180, main],
  // favicon-ish small sizes
  ["icon-32.png", 32, main],
  ["icon-16.png", 16, main],
];

for (const [name, size, svg] of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(resolve(out, name));
  console.log(`wrote public/${name} (${size}×${size})`);
}

// Copy SVG as a vector option for any-size icons in manifest
await writeFile(resolve(out, "icon.svg"), main);
console.log("wrote public/icon.svg");

// Open Graph / Twitter card image — 1200×630
const og = await readFile(resolve(root, "scripts/og-image.svg"));
await sharp(og, { density: 256 })
  .resize(1200, 630, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(resolve(out, "og-image.png"));
console.log("wrote public/og-image.png (1200×630)");
