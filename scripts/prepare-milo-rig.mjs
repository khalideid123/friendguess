// Mechanical crop/optimization of the generated transparent rig atlas.
// Run: node scripts/prepare-milo-rig.mjs /absolute/path/to/atlas.png
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Pass the generated 1086 × 1448 Milo rig atlas.");
const meta = await sharp(source).metadata();
if (meta.width !== 1086 || meta.height !== 1448 || !meta.hasAlpha)
  throw new Error("Unexpected atlas geometry or missing transparency.");
const destination = resolve("public/art/milo-rig");
await mkdir(destination, { recursive: true });
const parts = {
  body: [32, 47, 310, 337, 300],
  face: [355, 72, 362, 307, 360],
  blink: [719, 72, 362, 307, 360],
  tail: [37, 399, 320, 328, 260],
  "ear-left": [419, 430, 252, 283, 160],
  "ear-right": [777, 430, 252, 283, 160],
  wave: [758, 734, 286, 293, 200],
  laugh: [355, 1049, 362, 324, 360],
  encourage: [719, 1049, 362, 324, 360],
};
for (const [name, [left, top, width, height, size]] of Object.entries(parts)) {
  const result = await sharp(source)
    .extract({ left, top, width, height })
    .resize({ width: size })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(`${destination}/${name}.webp`);
  console.log(`${name}: ${result.width} × ${result.height}, ${result.size} bytes`);
}
