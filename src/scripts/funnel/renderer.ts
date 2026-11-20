import {
  createRandom,
  createStrands,
  smoothstep,
  strandPoint,
  waistParameter,
  type FunnelLayout,
  type SamplePoint,
  type Strand,
} from './geometry.ts';

export type Tier = 'high' | 'medium' | 'low';

export interface TierSettings {
  strands: number;
  samples: number;
  comets: number;
  motes: number;
  maxDpr: number;
  fps: number;
  maxAlpha: number;
}

/** Density and frame-rate budgets; the controller steps down if frames run slow. */
export const TIERS: Record<Tier, TierSettings> = {
  high: { strands: 168, samples: 120, comets: 16, motes: 64, maxDpr: 2, fps: 60, maxAlpha: 0.46 },
  medium: { strands: 120, samples: 96, comets: 11, motes: 44, maxDpr: 2, fps: 60, maxAlpha: 0.52 },
  low: { strands: 72, samples: 72, comets: 6, motes: 24, maxDpr: 1.5, fps: 30, maxAlpha: 0.6 },
};

/** Rotation speed of the whole surface, in radians per second (about 57 s per turn). */
export const SPIN = 0.11;

const LEVELS = 8;
const CHUNK = 8;
const PAPER = '243, 248, 255';
const SKY = '112, 191, 255';
const ELECTRIC = '34, 100, 210';
const POINTER_RADIUS = 120;
const POINTER_PUSH = 16;

interface Comet {
  strand: number;
  s: number;
  speed: number;
  sky: boolean;
  size: number;
}

interface Mote {
  strand: number;
  s: number;
  drift: number;
  size: number;
}

export interface PointerState {
  /** Smoothed position. */
  x: number;
  y: number;
  /** Target position from the latest pointer event. */
  targetX: number;
  targetY: number;
  /** 0 when idle, eases towards 1 while the pointer is over the hero. */
  strength: number;
  active: boolean;
}

function makeGlow(rgb: string, size: number): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = size;
  const g = sprite.getContext('2d');
  if (g) {
    const r = size / 2;
    const gradient = g.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, `rgba(${rgb}, 1)`);
    gradient.addColorStop(0.18, `rgba(${rgb}, 0.55)`);
    gradient.addColorStop(0.5, `rgba(${rgb}, 0.12)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = gradient;
    g.fillRect(0, 0, size, size);
  }
  return sprite;
}

export class FunnelRenderer {
  readonly pointer: PointerState = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, active: false };

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private layout: FunnelLayout | null = null;
  private sWaist = 0.6;
  private settings: TierSettings;
  private strands: Strand[] = [];
  private comets: Comet[] = [];
  private motes: Mote[] = [];
  private dpr = 1;
  private cssWidth = 0;
  private cssHeight = 0;
  private xs = new Float32Array(0);
  private ys = new Float32Array(0);
  private ds = new Float32Array(0);
  private readonly point: SamplePoint = { x: 0, y: 0, depth: 0 };
  private readonly random = createRandom(23);
  private readonly glowPaper = makeGlow(PAPER, 64);
  private readonly glowSky = makeGlow(SKY, 64);
  private waistGlow: CanvasGradient | null = null;

  constructor(canvas: HTMLCanvasElement, tier: Tier) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.canvas = canvas;
    this.ctx = ctx;
    this.settings = TIERS[tier];
    this.setTier(tier);
  }

  setTier(tier: Tier): void {
    this.settings = TIERS[tier];
    const { strands, samples, comets, motes } = this.settings;
    this.strands = createStrands(strands);
    this.xs = new Float32Array(samples + 1);
    this.ys = new Float32Array(samples + 1);
    this.ds = new Float32Array(samples + 1);
    this.comets = Array.from({ length: comets }, () => this.spawnComet(this.random()));
    this.motes = Array.from({ length: motes }, () => ({
      strand: Math.floor(this.random() * this.strands.length),
      s: 0.12 + this.random() * 0.86,
      drift: 0.002 + this.random() * 0.006,
      size: 0.8 + this.random() * 0.9,
    }));
    if (this.cssWidth > 0) this.resize(this.cssWidth, this.cssHeight, window.devicePixelRatio || 1);
  }

  get fps(): number {
    return this.settings.fps;
  }

  resize(width: number, height: number, devicePixelRatio: number): void {
    this.cssWidth = width;
    this.cssHeight = height;
    this.dpr = Math.min(devicePixelRatio, this.settings.maxDpr);
    this.canvas.width = Math.max(1, Math.round(width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(height * this.dpr));
  }

  setLayout(layout: FunnelLayout): void {
    this.layout = layout;
    this.sWaist = waistParameter(layout);
    const glowRadius = Math.max(120, Math.min(260, layout.width * 0.16));
    const g = this.ctx.createRadialGradient(layout.cx, layout.waistY, 0, layout.cx, layout.waistY, glowRadius);
    g.addColorStop(0, `rgba(${ELECTRIC}, 0.30)`);
    g.addColorStop(0.45, `rgba(${ELECTRIC}, 0.10)`);
    g.addColorStop(1, `rgba(${ELECTRIC}, 0)`);
    this.waistGlow = g;
  }

  private spawnComet(s = 0): Comet {
    return {
      strand: Math.floor(this.random() * this.strands.length),
      s,
      speed: 1 / (8 + this.random() * 6),
      sky: this.random() < 0.28,
      size: 14 + this.random() * 10,
    };
  }

  /** Pushes a point away from the pointer; returns nothing, mutates `p`. */
  private repel(p: SamplePoint): void {
    const ptr = this.pointer;
    if (ptr.strength < 0.01) return;
    const dx = p.x - ptr.x;
    const dy = p.y - ptr.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= POINTER_RADIUS * POINTER_RADIUS || d2 < 0.0001) return;
    const d = Math.sqrt(d2);
    const f = 1 - d / POINTER_RADIUS;
    const push = f * f * POINTER_PUSH * ptr.strength;
    p.x += (dx / d) * push;
    p.y += (dy / d) * push;
  }

  /**
   * Draws one frame. `time` drives rotation; `dt` advances comets and motes.
   * With `animate` false the frame is a still image (reduced motion).
   * `reveal` (0 to 1) is the entrance: strands are drawn from the mouth down
   * to this point, so on load they flow through the waist into the branches.
   */
  draw(time: number, dt: number, animate: boolean, reveal = 1): void {
    const layout = this.layout;
    if (!layout) return;
    const ctx = this.ctx;
    const { samples, maxAlpha } = this.settings;
    const spin = animate ? SPIN : 0;
    const p = this.point;
    const sWaist = this.sWaist;
    // Ease-out entrance; slightly overshoots 1 so the leading edge fully clears.
    const revealFront = reveal >= 1 ? 1 : 1.08 * (1 - Math.pow(1 - reveal, 3));

    // Ease the pointer towards its target.
    const ptr = this.pointer;
    ptr.x += (ptr.targetX - ptr.x) * 0.18;
    ptr.y += (ptr.targetY - ptr.y) * 0.18;
    ptr.strength += ((ptr.active && animate ? 1 : 0) - ptr.strength) * 0.08;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    // Soft action-colour halo behind the waist (the call to action).
    if (this.waistGlow) {
      ctx.fillStyle = this.waistGlow;
      ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    }

    // Strands, batched into brightness levels: LEVELS stroke calls per frame.
    const paths: Path2D[] = [];
    for (let k = 0; k < LEVELS; k++) paths.push(new Path2D());
    const xs = this.xs;
    const ys = this.ys;
    const ds = this.ds;
    for (const strand of this.strands) {
      for (let i = 0; i <= samples; i++) {
        strandPoint(layout, strand, i / samples, time, spin, p, sWaist);
        this.repel(p);
        xs[i] = p.x;
        ys[i] = p.y;
        ds[i] = p.depth;
      }
      for (let c = 0; c < samples; c += CHUNK) {
        const end = Math.min(samples, c + CHUNK);
        const mid = (c + end) >> 1;
        const s = mid / samples;
        const front = ((ds[mid] ?? 0) + 1) / 2;
        if (s > revealFront) break;
        const leading = revealFront >= 1 ? 1 : smoothstep((revealFront - s) / 0.08);
        const alpha = strand.weight * (0.16 + 0.84 * Math.pow(front, 1.6)) * smoothstep(s / 0.16) * leading;
        if (alpha < 0.05) continue;
        const path = paths[Math.min(LEVELS - 1, Math.floor(alpha * LEVELS))];
        if (!path) continue;
        path.moveTo(xs[c] ?? 0, ys[c] ?? 0);
        for (let i = c + 1; i <= end; i++) path.lineTo(xs[i] ?? 0, ys[i] ?? 0);
      }
    }
    ctx.lineWidth = this.dpr >= 2 ? 0.6 : 0.8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgb(${PAPER})`;
    for (let k = 0; k < LEVELS; k++) {
      const path = paths[k];
      if (!path) continue;
      ctx.globalAlpha = ((k + 1) / LEVELS) * maxAlpha;
      ctx.stroke(path);
    }

    // Motes: sparse points riding the surface.
    ctx.fillStyle = `rgb(${PAPER})`;
    for (const mote of this.motes) {
      if (animate) {
        mote.s += mote.drift * dt;
        if (mote.s > 0.99) mote.s = 0.12;
      }
      const strand = this.strands[mote.strand];
      if (!strand || mote.s > revealFront) continue;
      strandPoint(layout, strand, mote.s, time, spin, p, sWaist);
      this.repel(p);
      ctx.globalAlpha = 0.12 + 0.5 * ((p.depth + 1) / 2) * smoothstep(mote.s / 0.2);
      ctx.fillRect(p.x - mote.size / 2, p.y - mote.size / 2, mote.size, mote.size);
    }

    ctx.globalCompositeOperation = 'lighter';

    // Comets: small glowing travellers with short tails (animated mode only).
    if (animate && revealFront >= 1) {
      for (let c = 0; c < this.comets.length; c++) {
        const comet = this.comets[c];
        if (!comet) continue;
        comet.s += comet.speed * dt;
        if (comet.s >= 1) {
          this.comets[c] = this.spawnComet(0);
          continue;
        }
        const strand = this.strands[comet.strand];
        if (!strand) continue;
        const fade = smoothstep(comet.s / 0.2) * (1 - smoothstep((comet.s - 0.9) / 0.1));
        ctx.strokeStyle = `rgb(${comet.sky ? SKY : PAPER})`;
        let prevX = 0;
        let prevY = 0;
        const tail = 9;
        for (let k = tail; k >= 0; k--) {
          strandPoint(layout, strand, Math.max(0, comet.s - k * 0.0045), time, spin, p, sWaist);
          this.repel(p);
          if (k < tail) {
            const strength = 1 - k / tail;
            ctx.globalAlpha = 0.55 * strength * fade;
            ctx.lineWidth = 0.4 + strength * 1.1;
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
          prevX = p.x;
          prevY = p.y;
        }
        const size = comet.size * (0.6 + 0.4 * ((p.depth + 1) / 2));
        ctx.globalAlpha = 0.9 * fade;
        ctx.drawImage(comet.sky ? this.glowSky : this.glowPaper, p.x - size / 2, p.y - size / 2, size, size);
      }
    }

    // Destination glows where each branch lands.
    const arrival = smoothstep((revealFront - 0.92) / 0.08);
    for (const node of layout.nodes) {
      const size = 34;
      ctx.globalAlpha = 0.5 * arrival;
      ctx.drawImage(this.glowPaper, node.x - size / 2, node.y - size / 2, size, size);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
