/**
 * Liquid Glass refraction (Daniel, 25 Nov 2026, after a reel of a WebGL
 * "liquid-glass" component: "CSS blur only smears. Real glass bends light").
 *
 * Real glass is clear in the middle and bends what is behind it around its
 * curved rim, with a little colour split (dispersion) at the very edge. A blur
 * cannot do that, but an SVG displacement map can, fed to `backdrop-filter`:
 * each glass surface gets a map of its own shape (a rounded rectangle) whose
 * rim pushes the backdrop inward, strongest at the edge and fading to nothing
 * a bezel's width in. Red, green and blue are displaced by slightly different
 * amounts, so the rim splits into a faint prism fringe.
 *
 * Only Chromium (Chrome, Edge, Android) renders an SVG filter in
 * `backdrop-filter`; Safari and Firefox ignore it, so there the glass stays
 * the frosted glass it was. Off with Reduce Transparency or Increase Contrast.
 *
 * Wiring: each glass rule reads `backdrop-filter: var(--refract,) <its blur>`.
 * This sets --refract on the element to `url(#lg-…)` (one filter per size,
 * rebuilt when the element resizes) and marks <html data-refract>, which
 * lightens the frost (tokens.css), since a clear centre is the point.
 */

const SVG = 'http://www.w3.org/2000/svg';

/** The glass that rests on the page and refracts at its rim: the header bar and the
    business cards. Menus that materialize keep their frost; the buttons, chips, toggle
    and FAQ + buttons use LiquidButton's own warp instead (below). */
const GLASS = ['.pill', '.scene .card'];

/* LiquidButton's glass (21st.dev "liquid-glass-button", Daniel, 26 Nov 2026): fractal
   noise, softened, displaces the backdrop by up to 70px, then a 4px blur. Used by the
   frosted buttons (global.css), in the box of whichever button uses it. */
const LIQUID_BUTTON = `
  <filter id="liquid-glass" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence"/>
    <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise"/>
    <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced"/>
    <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur"/>
    <feComposite in="finalBlur" in2="finalBlur" operator="over"/>
  </filter>`;

const supported = () => {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  if (!brands?.some((b) => b.brand === 'Chromium')) return false;
  if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return false;
  if (matchMedia('(prefers-contrast: more)').matches) return false;
  return true;
};

/**
 * The displacement map of a rounded rectangle, as a PNG data URL: red is the x
 * push and green the y push (128 = none). Inside the bezel the push points
 * inward along the rim's normal, with a squared fall-off, so the backdrop is
 * drawn in and bent near the edge and left alone in the middle.
 */
function displacementMap(w: number, h: number, r: number, bezel: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  const hw = w / 2;
  const hh = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw;
      const py = y + 0.5 - hh;
      // Signed distance to the rounded rectangle (negative inside)
      const qx = Math.abs(px) - (hw - r);
      const qy = Math.abs(py) - (hh - r);
      const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      const depth = -d;
      let dx = 0;
      let dy = 0;
      if (depth > 0 && depth < bezel) {
        // The rim's outward normal: along the corner's radius, or straight out from a side
        let nx = 0;
        let ny = 0;
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy) || 1;
          nx = (qx / l) * Math.sign(px);
          ny = (qy / l) * Math.sign(py);
        } else if (qx > qy) {
          nx = Math.sign(px);
        } else {
          ny = Math.sign(py);
        }
        const u = 1 - depth / bezel;
        const m = u * u;
        dx = -nx * m;
        dy = -ny * m;
      }
      const i = (y * w + x) * 4;
      img.data[i] = Math.round(128 + dx * 127);
      img.data[i + 1] = Math.round(128 + dy * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/* One channel, displaced by its own amount, kept to that channel */
const channel = (scale: number, keep: string, name: string) => `
  <feDisplacementMap in="SourceGraphic" in2="map" scale="${scale.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="${name}d"/>
  <feColorMatrix in="${name}d" type="matrix" values="${keep}" result="${name}"/>`;

export function initRefraction() {
  if (!supported()) return;
  const host = document.createElementNS(SVG, 'svg');
  host.setAttribute('aria-hidden', 'true');
  host.setAttribute('focusable', 'false');
  host.setAttribute('width', '0');
  host.setAttribute('height', '0');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const defs = document.createElementNS(SVG, 'defs');
  defs.innerHTML = LIQUID_BUTTON;
  host.append(defs);
  document.body.append(host);

  const made = new Map<string, string>();
  let n = 0;

  /** A filter for this size and shape (shared by every element of the same size) */
  const filterFor = (w: number, h: number, r: number) => {
    // The bezel: about a third of the short side, never wider than the corner, 22px at most
    const bezel = Math.max(6, Math.min(r, Math.min(w, h) * 0.32, 22));
    const key = `${w}x${h}r${r}`;
    const known = made.get(key);
    if (known) return known;
    const map = displacementMap(w, h, r, bezel);
    if (!map) return null;
    const id = `lg-${++n}`;
    // The push reaches just under a bezel at the very edge, so the rim never folds over itself
    const s = bezel * 0.95;
    const filter = document.createElementNS(SVG, 'filter');
    filter.id = id;
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', String(w));
    filter.setAttribute('height', String(h));
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.innerHTML = `
      <feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
      ${channel(s, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r')}
      ${channel(s * 0.92, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'g')}
      ${channel(s * 0.84, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'b')}
      <feBlend in="r" in2="g" mode="screen" result="rg"/>
      <feBlend in="rg" in2="b" mode="screen"/>`;
    defs.append(filter);
    made.set(key, id);
    return id;
  };

  const fit = (el: HTMLElement) => {
    const w = Math.round(el.offsetWidth);
    const h = Math.round(el.offsetHeight);
    if (w < 8 || h < 8) return;
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const r = Math.min(radius, w / 2, h / 2);
    const id = filterFor(w, h, r);
    if (id) el.style.setProperty('--refract', `url(#${id})`);
  };

  const els = GLASS.flatMap((sel) => Array.from(document.querySelectorAll<HTMLElement>(sel)));
  const queue = new Set<HTMLElement>();
  let frame = 0;
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) queue.add(e.target as HTMLElement);
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        queue.forEach(fit);
        queue.clear();
      });
    }
  });
  els.forEach((el) => ro.observe(el));
  document.documentElement.setAttribute('data-refract', '');
}
