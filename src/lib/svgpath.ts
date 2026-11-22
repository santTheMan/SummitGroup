/**
 * Shortens an SVG path made of M, L and Z commands (as d3-geo's geoPath
 * writes them) by rounding to `digits` decimals and writing every line as a
 * relative `l` step from the previous rounded point, so the error never
 * accumulates. Repeated points are dropped. The world map's outlines shrink
 * to about a third of their absolute size this way.
 */
export function compactPath(d: string, digits = 1): string {
  const k = 10 ** digits;
  const round = (n: number) => Math.round(n * k) / k;
  const num = (n: number) => String(round(n)).replace(/^(-?)0\./, '$1.');
  let out = '';
  let cx = 0;
  let cy = 0;
  let last = '';
  for (const [, cmd, args] of d.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (cmd === 'Z') {
      out += 'z';
      last = 'z';
      continue;
    }
    const [x, y] = (args ?? '').split(',').map((v) => round(Number(v))) as [number, number];
    if (cmd === 'M') {
      out += `M${num(x)} ${num(y)}`;
      last = 'M';
    } else {
      const dx = num(x - cx);
      const dy = num(y - cy);
      if (dx === '0' && dy === '0') continue;
      const pair = `${dx}${dy.startsWith('-') ? '' : ' '}${dy}`;
      out += last === 'l' ? `${dx.startsWith('-') ? '' : ' '}${pair}` : `l${pair}`;
      last = 'l';
    }
    cx = x;
    cy = y;
  }
  return out;
}
