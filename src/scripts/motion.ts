import { animate, inView, scopeMotion, scroll, stagger, type AnimationSequence } from 'motion';

/**
 * The page's motion, after Teal Treasury's GSAP choreography, rebuilt with
 * Motion. Everything runs inside one scope that only exists while the visitor
 * has no reduced-motion preference: if that changes, Motion stops it all and
 * restores inline styles, and the CSS pre-states are switched off.
 *
 * Scroll-linked work (panel tilt, hero glow, statement, footer wordmark)
 * uses scroll(animate()), which runs on the browser's ScrollTimeline where it can.
 */
declare global {
  interface Window {
    __sgiMotion?: boolean;
  }
}

window.__sgiMotion = true;

const html = document.documentElement;
const out = [0.16, 1, 0.3, 1] as const;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.95;

scopeMotion(
  () => {
    html.dataset.motion = 'on';

    /* Hero entrance: words rise from their masks, then the copy, panel and cards */
    animate('.hero-word', { y: ['110%', '0%'], rotate: [3, 0] }, { duration: 1.1, delay: stagger(0.045), ease: out });
    animate('.hero-fade', { opacity: [0, 1], y: [18, 0] }, { duration: 0.8, delay: stagger(0.08, { startDelay: 0.35 }), ease: out });
    animate('.device-wrap', { opacity: [0, 1], y: [120, 0] }, { duration: 1.2, delay: 0.45, ease: out });

    /* The panel lies back, and stands up as it scrolls into view */
    const deviceWrap = $('.device-wrap');
    if (deviceWrap) {
      scroll(animate('.device', { rotateX: [26, 0], scale: [0.9, 1] }, { ease: 'linear' }), {
        target: deviceWrap,
        offset: ['start 0.96', 'start 0.22'],
      });
    }

    const hero = $('.hero');
    if (hero) {
      scroll(animate('.hero-glow', { y: ['0%', '30%'], scale: [1, 1.25] }, { ease: 'linear' }), {
        target: hero,
        offset: ['start start', 'end start'],
      });
    }

    /* Statement inks in word by word */
    const statement = $('[data-statement]');
    const words = $$('.st-word');
    if (statement && words.length) {
      const sequence: AnimationSequence = words.map((word, i) => [
        word,
        { opacity: [0.14, 1] },
        { at: i * 0.05, duration: 0.3, ease: 'linear' },
      ]);
      scroll(animate(sequence), { target: statement, offset: ['start 0.82', 'end 0.48'] });
    }


    /* Section heads and cards that start below the fold rise in once */
    $$('[data-reveal]').forEach((el) => {
      if (!below(el)) return;
      animate(el, { opacity: 0, y: 28 }, { duration: 0 });
      inView(el, () => void animate(el, { opacity: 1, y: 0 }, { duration: 0.9, ease: out }), {
        margin: '0px 0px -12% 0px',
      });
    });

    /* Where we work map: once in view, South Africa then each client market colours in, the links
       draw and the labels rise (CSS transitions, staggered by --d) */
    const map = $('[data-map]');
    if (map && below(map)) {
      map.setAttribute('data-pending', '');
      inView(map, () => void requestAnimationFrame(() => map.removeAttribute('data-pending')), { amount: 0.35 });
    }

    /* Placements heatmap: a column wave, each day settling from slightly small and low (bklit's entrance) */
    const heatmap = $('[data-hm]');
    if (heatmap && below(heatmap)) {
      const cells = $$('i[data-c]', heatmap);
      const cols = Number(getComputedStyle(heatmap).getPropertyValue('--cols')) || 1;
      const delays = cells.map((cell) => {
        const t = Number(cell.dataset.c) / cols;
        return (1 - (1 - t) ** 2) * 0.9 + Number(cell.dataset.r) * 0.014;
      });
      animate(cells, { opacity: 0, transform: 'translateY(3px) scale(0.86)' }, { duration: 0 });
      inView(
        heatmap,
        () =>
          void animate(
            cells,
            { opacity: 1, transform: 'translateY(0px) scale(1)' },
            { duration: 0.45, ease: out, delay: (i: number) => delays[i] ?? 0 },
          ),
        { amount: 0.3 },
      );
    }


    /* Closing card settles from a rounder, smaller card */
    const card = $('[data-cta-card]');
    if (card) {
      scroll(animate(card, { scale: [0.92, 1], borderRadius: ['40px', '12px'] }, { ease: 'linear' }), {
        target: card,
        offset: ['start 0.98', 'start 0.5'],
      });
    }

    /* Footer wordmark rises letter by letter */
    const bigmark = $('[data-bigmark]');
    if (bigmark) {
      const sequence: AnimationSequence = $$('span', bigmark).map((letter, i) => [
        letter,
        { y: ['105%', '0%'] },
        { at: i * 0.06, duration: 0.5, ease: 'linear' },
      ]);
      scroll(animate(sequence), { target: bigmark, offset: ['start end', 'end end'] });
    }

    /* Mouse only: the closing card's glows follow the pointer at different speeds */
    scopeMotion(
      ({ bind }) => {
        if (!card) return;
        const blobs = $$('[data-blob]', card);
        const pull = [0.32, -0.24, 0.16];
        let frame = 0;
        let px = 0;
        let py = 0;
        const move = bind(() => {
          frame = 0;
          blobs.forEach((blob, i) =>
            animate(blob, { x: px * pull[i]!, y: py * pull[i]! }, { type: 'spring', stiffness: 60 - i * 14, damping: 20 }),
          );
        });
        const queue = () => {
          if (!frame) frame = requestAnimationFrame(move);
        };
        const onMove = (e: PointerEvent) => {
          const r = card.getBoundingClientRect();
          px = e.clientX - r.left - r.width / 2;
          py = e.clientY - r.top - r.height / 2;
          queue();
        };
        const onLeave = () => {
          px = 0;
          py = 0;
          queue();
        };
        card.addEventListener('pointermove', onMove);
        card.addEventListener('pointerleave', onLeave);
        return () => {
          card.removeEventListener('pointermove', onMove);
          card.removeEventListener('pointerleave', onLeave);
          cancelAnimationFrame(frame);
        };
      },
      { matchMedia: '>=900 hover' },
    );

    return () => {
      html.dataset.motion = 'off';
      $('[data-map]')?.removeAttribute('data-pending');
    };
  },
  { matchMedia: 'motion' },
);
