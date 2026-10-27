// Draws the app icon, Android adaptive icon, splash images and favicon from the website logo's
// path data in @optionpilot/shared. Run with `npm run icons` (Node 22.18 or newer, which runs the
// TypeScript source of the shared package directly). The PNGs it writes are committed.
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  LOGO_ARROW,
  LOGO_ARROW_COLOR,
  LOGO_RING_BOTTOM,
  LOGO_RING_COLOR,
  LOGO_RING_SLASH,
  LOGO_RING_TOP,
} from "../../../packages/shared/src/brand/logo.ts";
import { saffron } from "../../../packages/shared/src/theme/palettes.ts";

const OUT = fileURLToPath(new URL("../assets/", import.meta.url));
const RING_PATHS = [LOGO_RING_TOP, LOGO_RING_SLASH, LOGO_RING_BOTTOM];
const SIZE = 1024;

/** The logo artwork spans roughly x 23..107 and y 28..104 of its 120 x 120 box. */
const ART_CENTER = { x: 65, y: 66 };

/**
 * An SVG document `size` pixels wide with the logo centred. `span` is how many logo units fit across
 * the canvas, so a smaller span draws the mark larger.
 */
function logoSvg({ size, span, ring, arrow, background }) {
  const half = span / 2;
  const viewBox = `${ART_CENTER.x - half} ${ART_CENTER.y - half} ${span} ${span}`;
  const paths = RING_PATHS.map((d) => `<path d="${d}" fill="${ring}"/>`).join("");
  const bg = background ? `<rect x="${ART_CENTER.x - half}" y="${ART_CENTER.y - half}" width="${span}" height="${span}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${bg}${paths}<path d="${LOGO_ARROW}" fill="${arrow}"/></svg>`;
}

const adaptiveRing = saffron.foreground;

const assets = {
  // iOS and the store icon: the mark with a light ring on the Saffron page colour.
  "icon.png": logoSvg({ size: SIZE, span: 124, ring: adaptiveRing, arrow: LOGO_ARROW_COLOR, background: saffron.background }),
  // Android adaptive foreground: the mark sits inside the central 66% safe zone.
  "adaptive-icon.png": logoSvg({ size: SIZE, span: 140, ring: adaptiveRing, arrow: LOGO_ARROW_COLOR }),
  // Android 13 themed icon: one colour, only the shape matters.
  "adaptive-icon-monochrome.png": logoSvg({ size: SIZE, span: 140, ring: "#000000", arrow: "#000000" }),
  // Native splash. Dark uses the light ring, light uses the original navy ring.
  "splash-icon-dark.png": logoSvg({ size: SIZE, span: 100, ring: adaptiveRing, arrow: LOGO_ARROW_COLOR }),
  "splash-icon-light.png": logoSvg({ size: SIZE, span: 100, ring: LOGO_RING_COLOR, arrow: LOGO_ARROW_COLOR }),
  "favicon.png": logoSvg({ size: 128, span: 100, ring: LOGO_RING_COLOR, arrow: LOGO_ARROW_COLOR }),
};

await mkdir(OUT, { recursive: true });
for (const [name, svg] of Object.entries(assets)) {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(`${OUT}${name}`, png);
  console.log(`wrote assets/${name}`);
}
