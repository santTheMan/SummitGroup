import { describe, expect, it } from 'vitest';
import { compactPath } from '../../src/lib/svgpath.ts';

/** Walks a compacted path back to absolute points, one array per subpath. */
function points(d: string): [number, number][][] {
  const rings: [number, number][][] = [];
  let x = 0;
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([Mlz])([^Mlz]*)/g)) {
    if (cmd === 'z') continue;
    const nums = (args ?? '').match(/-?(?:\d+\.?\d*|\.\d+)/g)!.map(Number);
    if (cmd === 'M') {
      [x, y] = nums as [number, number];
      rings.push([[x, y]]);
    } else {
      for (let i = 0; i < nums.length; i += 2) {
        x = Math.round((x + nums[i]!) * 10) / 10;
        y = Math.round((y + nums[i + 1]!) * 10) / 10;
        rings.at(-1)!.push([x, y]);
      }
    }
  }
  return rings;
}

describe('compactPath', () => {
  it('writes lines as relative steps from rounded points', () => {
    expect(compactPath('M10.04,20L12.55,18.31L9.5,18.3Z')).toBe('M10 20l2.6-1.7-3.1 0z');
  });

  it('keeps every point within rounding of the original, with no drift', () => {
    const abs: [number, number][] = Array.from({ length: 200 }, (_, i) => [100 + Math.sin(i) * 40.123, 50 + i * 0.337]);
    const d = `M${abs.map(([x, y]) => `${x},${y}`).join('L')}Z`;
    const [ring] = points(compactPath(d));
    expect(ring).toHaveLength(abs.length);
    ring!.forEach(([x, y], i) => {
      expect(Math.abs(x - abs[i]![0])).toBeLessThanOrEqual(0.051);
      expect(Math.abs(y - abs[i]![1])).toBeLessThanOrEqual(0.051);
    });
  });

  it('drops repeated points and keeps subpaths absolute', () => {
    expect(compactPath('M0,0L0.01,0L5,5ZM100,100L101,100Z', 1)).toBe('M0 0l5 5zM100 100l1 0z');
  });

  it('rounds to whole numbers when asked', () => {
    expect(compactPath('M0.4,0.6L2.4,-1.2Z', 0)).toBe('M0 1l2-2z');
  });
});
