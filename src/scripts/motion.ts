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
      const phone = matchMedia('(max-width: 45rem)').matches;
      scroll(animate('.device', { rotateX: [phone ? 12 : 26, 0], scale: [phone ? 0.96 : 0.9, 1] }, { ease: 'linear' }), {
        target: deviceWrap,
        offset: ['start 0.96', 'start 0.22'],
      });
    }

    /* The tablet's story, for someone who only scrolls past: as the tablet comes into
       view, its seats fill with people (Recruit), each turns Summit-Ready (Develop), then
       the team is framed as one, with SGI as the contact (Manage). The steps light up in
       step. Scroll-linked, so it plays at the reader's pace and rewinds on the way back
       up. Where the page is too short to scroll it through (tall screens), it plays once
       in view. The markup is the finished team, which is what reduced motion shows. */
    const story = $('[data-team-story]');
    let endStory: (() => void) | undefined;
    if (story) {
      const seats = $$('[data-seat]', story);
      const steps = $$('[data-step]', story);
      const people = $('[data-count="people"]', story);
      const ready = $('[data-count="ready"]', story);
      const n = seats.length;
      const part = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)));
      let last = '';
      const render = (p: number) => {
        const found = Math.round(part(p, 0.04, 0.38) * n);
        const set = Math.round(part(p, 0.44, 0.74) * n);
        const stage = p < 0.41 ? 0 : p < 0.78 ? 1 : 2;
        const managed = p >= 0.84;
        const key = `${found}:${set}:${stage}:${managed}`;
        if (key === last) return;
        last = key;
        seats.forEach((seat, i) => (seat.dataset.s = i < set ? '2' : i < found ? '1' : '0'));
        steps.forEach((step, i) => (step.dataset.state = i < stage || (managed && i === stage) ? 'done' : i === stage ? 'now' : 'next'));
        story.toggleAttribute('data-managed', managed);
        if (people) people.textContent = String(found);
        if (ready) ready.textContent = String(set);
      };

      /* Progress follows the team itself: it starts as the seats come up into the screen and
         ends once the whole team, with its count and contact line, sits in view. Layout
         positions (offsetTop), so the tablet's tilt and entrance do not skew it. */
      const view = $('[data-team-view]', story) ?? story;
      const docTop = (el: HTMLElement) => {
        let y = 0;
        for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
        return y;
      };
      const range = () => {
        const top = docTop(view);
        const vh = window.innerHeight;
        return { start: Math.max(0, top - vh * 0.95), end: top + view.offsetHeight - vh * 0.8 };
      };
      let { start, end } = range();

      if (end - start < 160) {
        render(0);
        const play = animate(0, 1, { duration: 2.6, ease: 'easeInOut', autoplay: false, onUpdate: render });
        inView(story, () => void play.play(), { amount: 0.5 });
        endStory = () => play.stop();
      } else {
        let frame = 0;
        const update = () => {
          frame = 0;
          render(Math.min(1, Math.max(0, (window.scrollY - start) / (end - start))));
        };
        const queue = () => {
          if (!frame) frame = requestAnimationFrame(update);
        };
        const resize = () => {
          ({ start, end } = range());
          queue();
        };
        update();
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', resize);
        endStory = () => {
          window.removeEventListener('scroll', queue);
          window.removeEventListener('resize', resize);
          cancelAnimationFrame(frame);
        };
      }
      const stop = endStory;
      endStory = () => {
        stop?.();
        render(1);
      };
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
        { opacity: [0.38, 1] },
        { at: i * 0.05, duration: 0.3, ease: 'linear' },
      ]);
      scroll(animate(sequence), { target: statement, offset: ['start 0.85', 'end 0.62'] });
    }


    /* Section heads and cards that start below the fold rise in once */
    $$('[data-reveal]').forEach((el) => {
      if (!below(el)) return;
      animate(el, { opacity: 0, y: 16 }, { duration: 0 });
      inView(el, () => void animate(el, { opacity: 1, y: 0 }, { duration: 0.55, ease: out }), {
        margin: '0px 0px -4% 0px',
      });
    });

    /* Start with a conversation: the finale headline rises out of its line masks once,
       as the hero's promise did, so the page closes in the voice it opened with. Only
       when it starts below the fold, so a #book link lands on it at rest. Nothing waits
       for it: the picker and button work while it settles. */
    const finale = $('[data-finale-title]');
    if (finale && below(finale)) {
      const finWords = $$('.fin-word', finale);
      animate(finWords, { y: '110%', rotate: 3 }, { duration: 0 });
      inView(
        finale,
        () => void animate(finWords, { y: ['110%', '0%'], rotate: [3, 0] }, { duration: 0.85, delay: stagger(0.06), ease: out }),
        { margin: '0px 0px -15% 0px' },
      );
    }

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

    /* Mouse only: the closing section's glows follow the pointer at different speeds */
    const cta = $('[data-cta]');
    scopeMotion(
      ({ bind }) => {
        if (!cta) return;
        const blobs = $$('[data-blob]', cta);
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
          const r = cta.getBoundingClientRect();
          px = e.clientX - r.left - r.width / 2;
          py = e.clientY - r.top - r.height / 2;
          queue();
        };
        const onLeave = () => {
          px = 0;
          py = 0;
          queue();
        };
        cta.addEventListener('pointermove', onMove);
        cta.addEventListener('pointerleave', onLeave);
        return () => {
          cta.removeEventListener('pointermove', onMove);
          cta.removeEventListener('pointerleave', onLeave);
          cancelAnimationFrame(frame);
        };
      },
      { matchMedia: '>=900 hover' },
    );

    return () => {
      html.dataset.motion = 'off';
      $('[data-map]')?.removeAttribute('data-pending');
      endStory?.();
    };
  },
  { matchMedia: 'motion' },
);
