import { describe, expect, it } from 'vitest';
import {
  BREATH,
  createStrands,
  layoutFromAnchors,
  strandPoint,
  waistParameter,
  type FunnelLayout,
  type SamplePoint,
} from '../../src/scripts/funnel/geometry.ts';

const layout: FunnelLayout = layoutFromAnchors({
  width: 1440,
  height: 900,
  waist: { x: 720, y: 552 },
  nodes: [
    { x: 411, y: 790 },
    { x: 720, y: 790 },
    { x: 1029, y: 790 },
  ],
});

const point = (): SamplePoint => ({ x: 0, y: 0, depth: 0 });

describe('createStrands', () => {
  it('rounds to a multiple of three and balances the three branches', () => {
    const strands = createStrands(100);
    expect(strands).toHaveLength(99);
    const counts = [0, 0, 0];
    for (const strand of strands) counts[strand.branch]! += 1;
    expect(counts).toEqual([33, 33, 33]);
  });

  it('is deterministic for a seed', () => {
    expect(createStrands(30, 4)).toEqual(createStrands(30, 4));
    expect(createStrands(30, 4)).not.toEqual(createStrands(30, 5));
  });

  it('keeps weights in the documented range', () => {
    for (const strand of createStrands(168)) {
      expect(strand.weight).toBeGreaterThanOrEqual(0.55);
      expect(strand.weight).toBeLessThanOrEqual(1);
    }
  });
});

describe('strandPoint', () => {
  const strands = createStrands(48);
  const sWaist = waistParameter(layout);
  const times = [0, 3.7, 41.2];

  it('passes every strand through the waist behind the call to action', () => {
    for (const t of times) {
      for (const strand of strands) {
        const p = strandPoint(layout, strand, sWaist, t, 0.11, point());
        const r = layout.waistRadius * (1 + BREATH);
        expect(Math.abs(p.x - layout.cx)).toBeLessThanOrEqual(r + 1e-6);
        expect(Math.abs(p.y - layout.waistY)).toBeLessThanOrEqual(layout.tilt * r + 1e-6);
      }
    }
  });

  it('is continuous across the waist', () => {
    for (const strand of strands) {
      const above = strandPoint(layout, strand, sWaist - 1e-6, 2, 0.11, point());
      const below = strandPoint(layout, strand, sWaist + 1e-6, 2, 0.11, point());
      expect(Math.hypot(above.x - below.x, above.y - below.y)).toBeLessThan(0.05);
    }
  });

  it('lands each strand on the node of its own business', () => {
    for (const t of times) {
      for (const strand of strands) {
        const p = strandPoint(layout, strand, 1, t, 0.11, point());
        const node = layout.nodes[strand.branch];
        expect(Math.abs(p.x - node.x)).toBeLessThanOrEqual(layout.nodeRadius + 1e-6);
        expect(Math.abs(p.y - node.y)).toBeLessThanOrEqual(layout.tilt * layout.nodeRadius + 1e-6);
      }
    }
  });

  it('starts at the mouth, above the waist', () => {
    for (const strand of strands) {
      const p = strandPoint(layout, strand, 0, 0, 0, point());
      expect(p.y).toBeLessThan(layout.waistY);
      expect(Math.abs(p.x - layout.cx)).toBeLessThanOrEqual(layout.mouthRadius * (1 + BREATH) + 1e-6);
    }
  });

  it('reports depth between -1 (back) and 1 (front)', () => {
    for (const strand of strands) {
      for (let s = 0; s <= 1; s += 0.05) {
        const { depth } = strandPoint(layout, strand, s, 1, 0.11, point());
        expect(depth).toBeGreaterThanOrEqual(-1);
        expect(depth).toBeLessThanOrEqual(1);
      }
    }
  });

  it('turns over time but holds still when spin is zero', () => {
    const strand = strands[0]!;
    const a = strandPoint(layout, strand, 0.3, 0, 0.11, point());
    const b = strandPoint(layout, strand, 0.3, 5, 0.11, point());
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1);
    const still = strandPoint(layout, strand, 0.3, 0, 0, point());
    const stillLater = strandPoint(layout, strand, 0.3, 0, 0, point());
    expect(stillLater).toEqual(still);
  });
});

describe('layoutFromAnchors', () => {
  it('uses measured anchors', () => {
    expect(layout.cx).toBe(720);
    expect(layout.waistY).toBe(552);
    expect(layout.nodes[2]).toEqual({ x: 1029, y: 790 });
    const s = waistParameter(layout);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it('falls back to a centred layout when anchors are missing', () => {
    const fallback = layoutFromAnchors({ width: 1000, height: 800 });
    expect(fallback.cx).toBe(500);
    expect(fallback.nodes.map((n) => Math.round(n.x))).toEqual([167, 500, 833]);
  });

  it('narrows the motif on small screens', () => {
    const compact = layoutFromAnchors({ width: 390, height: 844 });
    expect(compact.waistRadius).toBeLessThan(layout.waistRadius);
    expect(compact.mouthRadius).toBeGreaterThanOrEqual(280);
  });
});
