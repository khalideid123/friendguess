// Deterministic registration/contact-sheet check; does not edit source artwork.
// Run: node scripts/render-milo-poses.mjs /absolute/output.png
import sharp from "sharp";
import { MILO_PARTS } from "../lib/milo-rig.js";

const out = process.argv[2];
if (!out) throw new Error("Pass an output PNG path.");
const images = Object.fromEntries(await Promise.all(Object.keys(MILO_PARTS).map(async name => [
  name, (await sharp(`public/art/milo-rig/${name}.webp`).png().toBuffer()).toString("base64"),
])));
function part(name, transform = "") {
  const { x, y, w, h } = MILO_PARTS[name];
  return `<image x="${x}" y="${y}" width="${w}" height="${h}" transform="${transform}" href="data:image/png;base64,${images[name]}"/>`;
}
const poses = ["hello", "thinking", "celebrate", "encourage"];
const panels = poses.map((pose, i) => {
  const left = pose === "thinking" ? part("think")
    : pose === "hello" || pose === "celebrate" ? part("wave") : part("arm-left");
  const right = part("arm-right", pose === "celebrate" ? "rotate(-125 308 305)" : pose === "thinking" ? "rotate(49 308 305)" : "");
  const head = `<g>${part("ear-left")}${part("ear-right")}${part(pose === "celebrate" ? "laugh" : pose === "encourage" ? "encourage" : "face")}</g>`;
  return `<g transform="translate(${i * 480} 0)">${part("tail")}${part("body")}${head}${left}${right}<text x="240" y="493" text-anchor="middle" fill="white" font-family="sans-serif" font-size="18">${pose}</text></g>`;
}).join("");
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="510" viewBox="0 0 1920 510"><rect width="1920" height="510" fill="#201d32"/>${panels}</svg>`))
  .png().toFile(out);
console.log(out);
