import { layoutFromAnchors, type Point } from './geometry.ts';
import { FunnelRenderer, type Tier } from './renderer.ts';

/**
 * Mounts the decorative hero funnel.
 *
 * Expected markup inside `hero`:
 *   <canvas data-funnel-canvas>   the drawing surface (aria-hidden, pointer-events: none)
 *   [data-funnel-waist]           the call to action; the funnel narrows behind it
 *   [data-funnel-node] x3         destination markers the branches land on
 *
 * The motion is decorative. It never blocks interaction, stops when the hero
 * is off-screen or the tab is hidden, renders a still frame for
 * prefers-reduced-motion or Save-Data, and steps down in density when frames
 * run slow. State is exposed as data-funnel-state on the hero.
 */

type FunnelState = 'animating' | 'static' | 'paused';

interface NetworkInformationLike {
  saveData?: boolean;
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: NetworkInformationLike;
}

const NEXT_TIER: Record<Tier, Tier | null> = { high: 'medium', medium: 'low', low: null };

/** Time used for the still frame (reduced motion). */
const STILL_TIME = 0;

/** Length of the entrance, in seconds. */
const REVEAL_SECONDS = 2.4;

export function pickTier(width: number, nav: NavigatorWithHints = navigator): Tier {
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory ?? 8;
  if (width < 640 || cores <= 4 || memory <= 4) return 'low';
  if (width < 1200 || cores <= 6) return 'medium';
  return 'high';
}

export function mountFunnel(hero: HTMLElement): () => void {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-funnel-canvas]');
  if (!canvas) return () => {};

  const nav = navigator as NavigatorWithHints;
  let tier = pickTier(hero.clientWidth, nav);
  let renderer: FunnelRenderer;
  try {
    renderer = new FunnelRenderer(canvas, tier);
  } catch {
    hero.dataset.funnelState = 'static';
    return () => {};
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const saveData = nav.connection?.saveData === true;

  let onScreen = true;
  let pageVisible = document.visibilityState === 'visible';
  let forcedStill = false;
  let rafId = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let averageCost = 0;
  let framesSinceTierChange = 0;
  let measured = false;

  const setState = (state: FunnelState) => {
    if (hero.dataset.funnelState !== state) hero.dataset.funnelState = state;
  };
  hero.dataset.funnelTier = tier;

  const centreOf = (el: Element, origin: DOMRect): Point => {
    const r = el.getBoundingClientRect();
    return { x: r.left - origin.left + r.width / 2, y: r.top - origin.top + r.height / 2 };
  };

  function measure(): void {
    const rect = hero.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const waistEl = hero.querySelector('[data-funnel-waist]');
    const nodeEls = Array.from(hero.querySelectorAll('[data-funnel-node]'));
    renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    renderer.setLayout(
      layoutFromAnchors({
        width: rect.width,
        height: rect.height,
        waist: waistEl ? centreOf(waistEl, rect) : undefined,
        nodes: nodeEls.length === 3 ? nodeEls.map((el) => centreOf(el, rect)) : undefined,
      }),
    );
    measured = true;
  }

  const wantsMotion = () => !reducedMotion.matches && !saveData && !forcedStill;

  function stop(): void {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function markReady(): void {
    hero.classList.add('funnel-ready');
  }

  function stepDown(): void {
    const next = NEXT_TIER[tier];
    if (next) {
      tier = next;
      renderer.setTier(tier);
      measure();
      hero.dataset.funnelTier = tier;
    } else {
      forcedStill = true;
    }
    averageCost = 0;
    framesSinceTierChange = 0;
  }

  function frame(now: number): void {
    rafId = requestAnimationFrame(frame);
    const interval = 1000 / renderer.fps;
    if (lastFrame && now - lastFrame < interval - 2) return;
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    elapsed += dt;

    const start = performance.now();
    renderer.draw(elapsed, dt, true, Math.min(1, elapsed / REVEAL_SECONDS));
    const cost = performance.now() - start;

    // Frame-cost governor: keep drawing well inside the frame budget.
    averageCost = framesSinceTierChange === 0 ? cost : averageCost * 0.94 + cost * 0.06;
    framesSinceTierChange++;
    const budget = renderer.fps >= 60 ? 9 : 16;
    if (framesSinceTierChange > 90 && averageCost > budget) {
      stepDown();
      if (forcedStill) update();
    }
  }

  function update(): void {
    if (!measured) measure();
    if (!wantsMotion()) {
      stop();
      renderer.draw(STILL_TIME, 0, false);
      setState('static');
      markReady();
      return;
    }
    if (!onScreen || !pageVisible) {
      stop();
      setState('paused');
      return;
    }
    if (!rafId) {
      lastFrame = 0;
      rafId = requestAnimationFrame(frame);
    }
    setState('animating');
    markReady();
  }

  const resizeObserver = new ResizeObserver(() => {
    measure();
    if (hero.dataset.funnelState !== 'animating') update();
  });
  resizeObserver.observe(hero);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) onScreen = entry.isIntersecting;
      update();
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(hero);

  const onVisibility = () => {
    pageVisible = document.visibilityState === 'visible';
    update();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onMotionPreference = () => update();
  reducedMotion.addEventListener('change', onMotionPreference);

  // Pointer repulsion: listens on the hero (passive), so the canvas never
  // takes pointer events and every link and button stays clickable.
  const onPointerMove = (event: PointerEvent) => {
    if (!finePointer.matches || event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    const p = renderer.pointer;
    p.targetX = event.clientX - rect.left;
    p.targetY = event.clientY - rect.top;
    if (!p.active) {
      p.x = p.targetX;
      p.y = p.targetY;
    }
    p.active = true;
  };
  const onPointerLeave = () => {
    renderer.pointer.active = false;
  };
  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave, { passive: true });

  // Text wrapping (and so anchor positions) can change once web fonts load.
  document.fonts?.ready.then(() => {
    measure();
    if (hero.dataset.funnelState !== 'animating') update();
  });

  measure();
  update();

  return () => {
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotion.removeEventListener('change', onMotionPreference);
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerleave', onPointerLeave);
  };
}
