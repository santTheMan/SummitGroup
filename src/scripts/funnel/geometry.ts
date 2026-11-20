/**
 * Geometry for the hero funnel: pure functions, no DOM.
 *
 * Every strand is a fine filament on a 3D surface:
 *   1. Above the waist it lies on a flared funnel (wide mouth above the
 *      canvas, narrowing to the waist). This is the group: one shared engine.
 *   2. The waist sits behind the "Book a conversation" button: the one
 *      relationship that everything passes through.
 *   3. Below the waist each strand follows one of three twisted branches that
 *      land on the three specialist businesses.
 *
 * Strands spiral around the axis (so they cross and weave) and the whole
 * surface turns slowly over time. `depth` (-1 back, 1 front) lets the
 * renderer shade strands for a dimensional look.
 */

export interface Point {
  x: number;
  y: number;
}

export interface FunnelLayout {
  width: number;
  height: number;
  /** x of the funnel axis (centre of the call to action). */
  cx: number;
  /** y where strands begin; usually above the top edge. */
  topY: number;
  /** y of the narrowest point (behind the call to action). */
  waistY: number;
  /** Half-width of the funnel mouth at topY. */
  mouthRadius: number;
  /** Radius at the waist. */
  waistRadius: number;
  /** How far each branch swells between the waist and its node. */
  branchBulge: number;
  /** Radius where a branch meets its node. */
  nodeRadius: number;
  /** Destination nodes, left to right: Institute, Sales, Pathways. */
  nodes: readonly [Point, Point, Point];
  /** Vertical squash of each ring, so it reads as a tilted circle. */
  tilt: number;
}

export type BranchIndex = 0 | 1 | 2;

export interface Strand {
  /** Base angle around the axis, in radians. */
  angle: number;
  /** Which business this strand resolves into. */
  branch: BranchIndex;
  /** Brightness multiplier, 0.55 to 1. */
  weight: number;
  /** Per-strand phase used for gentle breathing. */
  phase: number;
}

export interface SamplePoint {
  x: number;
  y: number;
  /** -1 at the back of the surface, 1 at the front. */
  depth: number;
}

/** How sharply the mouth flares (higher keeps the neck narrow for longer). */
export const FLARE = 1.85;
/** Twist in radians from mouth to waist, and from waist to node. */
export const TWIST_UPPER = 3.6;
export const TWIST_LOWER = 2.4;
/** Breathing amplitude as a fraction of the radius. */
export const BREATH = 0.035;

/** Small deterministic PRNG (mulberry32) so layouts are stable and testable. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates `count` strands spread evenly around the axis. Branches are
 * interleaved (0, 1, 2, 0, ...) so every branch is a full tube of strands.
 * `count` is rounded down to a multiple of three.
 */
export function createStrands(count: number, seed = 7): Strand[] {
  const random = createRandom(seed);
  const total = Math.max(3, Math.floor(count / 3) * 3);
  const strands: Strand[] = [];
  for (let i = 0; i < total; i++) {
    const jitter = (random() - 0.5) * ((Math.PI * 2) / total) * 0.9;
    strands.push({
      angle: (i / total) * Math.PI * 2 + jitter,
      branch: (i % 3) as BranchIndex,
      weight: 0.55 + random() * 0.45,
      phase: random() * Math.PI * 2,
    });
  }
  return strands;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Parameter value (0 to 1 along a strand) at which the waist is reached. */
export function waistParameter(layout: FunnelLayout): number {
  const upper = Math.max(1, layout.waistY - layout.topY);
  const nodeY = (layout.nodes[0].y + layout.nodes[1].y + layout.nodes[2].y) / 3;
  const lower = Math.max(1, nodeY - layout.waistY);
  return upper / (upper + lower);
}

/**
 * Position of a strand at parameter `s` (0 = mouth, 1 = node) and time `t`
 * in seconds, given a rotation speed `spin` in radians per second.
 * Writes into `out` to avoid allocations in the animation loop.
 */
export function strandPoint(
  layout: FunnelLayout,
  strand: Strand,
  s: number,
  t: number,
  spin: number,
  out: SamplePoint,
  sWaist = waistParameter(layout),
): SamplePoint {
  const breathe = 1 + BREATH * Math.sin(t * 0.45 + strand.phase);
  let centreX: number;
  let y: number;
  let radius: number;
  let theta: number;

  if (s <= sWaist) {
    // Upper funnel: u = 0 at the mouth, 1 at the waist.
    const u = sWaist > 0 ? s / sWaist : 1;
    const open = Math.pow(1 - u, FLARE);
    centreX = layout.cx;
    y = lerp(layout.topY, layout.waistY, u);
    radius = layout.waistRadius + (layout.mouthRadius - layout.waistRadius) * open * breathe;
    theta = strand.angle + TWIST_UPPER * (1 - u);
  } else {
    // Lower branch: v = 0 at the waist, 1 at the node.
    const v = (s - sWaist) / (1 - sWaist);
    const node = layout.nodes[strand.branch];
    const ease = smoothstep(v);
    const swell = Math.sin(Math.PI * v);
    centreX = lerp(layout.cx, node.x, ease);
    y = lerp(layout.waistY, node.y, v);
    radius = lerp(layout.waistRadius, layout.nodeRadius, ease) + layout.branchBulge * swell * swell * breathe;
    theta = strand.angle - TWIST_LOWER * v;
  }

  theta += spin * t;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  out.x = centreX + radius * cos;
  out.y = y + layout.tilt * radius * sin;
  out.depth = sin;
  return out;
}

export interface Anchors {
  width: number;
  height: number;
  /** Centre of the call to action, relative to the hero. */
  waist?: Point;
  /** Centres of the three destination markers, relative to the hero. */
  nodes?: readonly Point[];
}

/**
 * Builds a layout from measured anchor positions, with sensible fallbacks so
 * the motif still renders if an anchor is missing.
 */
export function layoutFromAnchors({ width, height, waist, nodes }: Anchors): FunnelLayout {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const cx = waist?.x ?? w / 2;
  const waistY = waist?.y ?? h * 0.62;
  const fallbackNodes: [Point, Point, Point] = [
    { x: w / 6, y: h * 0.88 },
    { x: w / 2, y: h * 0.88 },
    { x: (w * 5) / 6, y: h * 0.88 },
  ];
  const resolved = (nodes && nodes.length === 3 ? nodes : fallbackNodes) as readonly [Point, Point, Point];
  const compact = w < 640;
  return {
    width: w,
    height: h,
    cx,
    topY: -h * 0.1,
    waistY,
    mouthRadius: Math.max(280, w * 0.72),
    waistRadius: compact ? 16 : clamp(w * 0.018, 18, 28),
    branchBulge: compact ? clamp(w * 0.055, 14, 24) : clamp(w * 0.034, 20, 52),
    nodeRadius: 2.5,
    nodes: resolved,
    tilt: 0.2,
  };
}
