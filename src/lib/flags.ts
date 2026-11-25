/**
 * National flags of SGI's markets, drawn as SVG to each flag's official
 * proportions and colours, for the "Where we work" map (WorldMap.astro).
 * Keyed by ISO 3166-1 numeric id, as in world-atlas. `art` is drawn in a
 * `w` × `h` box; `defs` holds any clip paths the art needs (ids are prefixed
 * with the country id, so they are unique on the page); `base` fills any small
 * island the flag does not reach.
 */
export type Flag = { w: number; h: number; art: string; defs?: string; base: string };

/* United States, 10:19: 13 stripes, a canton 7/13 tall and 0.76 of the hoist
   wide, 50 stars in nine rows (US Code, Title 4, §1; Executive Order 10834) */
const usa = (() => {
  const w = 7410;
  const h = 3900;
  const stripe = h / 13;
  let red = '';
  for (let i = 0; i < 13; i += 2) red += `M0 ${(i * stripe).toFixed(0)}h${w}v${stripe.toFixed(0)}h-${w}z`;
  // Five-pointed star, outer radius 0.0308 of the hoist, drawn from its top point
  const R = 0.0308 * h;
  const r = R * 0.381966;
  const pts: [number, number][] = [];
  for (let k = 0; k < 10; k++) {
    const a = ((-90 + k * 36) * Math.PI) / 180;
    const rad = k % 2 ? r : R;
    pts.push([rad * Math.cos(a), rad * Math.sin(a)]);
  }
  const rel = pts
    .slice(1)
    .map(([x, y], i) => `${(x - pts[i]![0]).toFixed(1)} ${(y - pts[i]![1]).toFixed(1)}`)
    .join(' ');
  const star = (x: number, y: number) => `M${x.toFixed(0)} ${(y - R).toFixed(1)}l${rel}z`;
  const E = 0.054 * h; // row spacing
  const G = 0.063 * h; // column spacing
  let stars = '';
  for (let row = 0; row < 9; row++) {
    const y = E * (row + 1);
    const n = row % 2 ? 5 : 6;
    for (let i = 0; i < n; i++) stars += star(row % 2 ? 2 * G + i * 2 * G : G + i * 2 * G, y);
  }
  return {
    w,
    h,
    base: '#3C3B6E',
    art:
      `<rect width="${w}" height="${h}" fill="#FFFFFF"/>` +
      `<path d="${red}" fill="#B22234"/>` +
      `<rect width="${(0.76 * h).toFixed(0)}" height="${(7 * stripe).toFixed(0)}" fill="#3C3B6E"/>` +
      `<path d="${stars}" fill="#FFFFFF"/>`,
  } satisfies Flag;
})();

/* United Kingdom, 1:2: the Union Flag (counterchanged saltires) */
const uk: Flag = {
  w: 60,
  h: 30,
  base: '#012169',
  defs:
    '<clipPath id="flag-826-s"><path d="M0 0v30h60V0z"/></clipPath>' +
    '<clipPath id="flag-826-t"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath>',
  art:
    '<g clip-path="url(#flag-826-s)">' +
    '<path d="M0 0v30h60V0z" fill="#012169"/>' +
    '<path d="M0 0l60 30m0-30L0 30" stroke="#FFFFFF" stroke-width="6"/>' +
    '<path d="M0 0l60 30m0-30L0 30" clip-path="url(#flag-826-t)" stroke="#C8102E" stroke-width="4"/>' +
    '<path d="M30 0v30M0 15h60" stroke="#FFFFFF" stroke-width="10"/>' +
    '<path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/>' +
    '</g>',
};

/* Germany, 3:5: black, red, gold */
const germany: Flag = {
  w: 5,
  h: 3,
  base: '#DD0000',
  art: '<rect width="5" height="1" fill="#000000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/>',
};

/* Switzerland, 1:1: a white cross, arms one-sixth longer than wide, on red */
const switzerland: Flag = {
  w: 32,
  h: 32,
  base: '#DA291C',
  art: '<rect width="32" height="32" fill="#DA291C"/><path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#FFFFFF"/>',
};

/* Malta, 2:3: white and red, the George Cross edged in red in the canton */
const malta: Flag = {
  w: 900,
  h: 600,
  base: '#CF142B',
  art:
    '<rect width="900" height="600" fill="#FFFFFF"/><rect x="450" width="450" height="600" fill="#CF142B"/>' +
    '<g transform="translate(150 150)" fill="#CFCFCF" stroke="#CF142B">' +
    '<path d="M-24-24-34-96h68l-10 72 72-10v68l-72-10 10 72h-68l10-72-72 10v-68z" stroke-width="9"/>' +
    '<circle r="26" stroke-width="5"/></g>',
};

/* Japan, 2:3: a crimson disc three-fifths of the hoist, centred */
const japan: Flag = {
  w: 900,
  h: 600,
  base: '#FFFFFF',
  art: '<rect width="900" height="600" fill="#FFFFFF"/><circle cx="450" cy="300" r="180" fill="#BC002D"/>',
};

/* South Africa, 2:3: the green Y-band bordered in white and, towards the black
   triangle, in gold; red above and blue below (band 1/5 of the hoist, borders 1/15) */
const southAfrica: Flag = {
  w: 9,
  h: 6,
  base: '#007749',
  defs: '<clipPath id="flag-710-t"><path d="M0 0l4.5 3L0 6z"/></clipPath>',
  art:
    '<rect width="9" height="3" fill="#E03C31"/><rect y="3" width="9" height="3" fill="#001489"/>' +
    '<path d="M0 0l4.5 3L0 6z" fill="#000000"/>' +
    '<path d="M0 0l4.5 3L0 6m4.5-3H9" fill="none" stroke="#FFFFFF" stroke-width="2"/>' +
    '<path d="M0 0l4.5 3L0 6" fill="none" stroke="#FFB81C" stroke-width="2" clip-path="url(#flag-710-t)"/>' +
    '<path d="M0 0l4.5 3L0 6m4.5-3H9" fill="none" stroke="#007749" stroke-width="1.2"/>',
};

export const flags: Record<string, Flag> = {
  '710': southAfrica,
  '840': usa,
  '826': uk,
  '276': germany,
  '756': switzerland,
  '470': malta,
  '392': japan,
};
