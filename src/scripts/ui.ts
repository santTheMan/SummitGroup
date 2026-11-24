import { animate, inView, scroll } from 'motion';
import { initGauges, replayGauge } from './gauge.ts';

/**
 * Page behaviour that works with or without motion: the header, the
 * businesses panel and small-screen sheet, the hero brief panel, the sticky
 * stage, the FAQ and the placements field. Motion-only choreography lives in
 * src/scripts/motion.ts.
 */
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Header: frosted once the page leaves the top */
function initHeader() {
  const nav = $('[data-nav]');
  if (!nav) return;
  const update = () => nav.toggleAttribute('data-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/*
 * Header selection: a liquid-glass lens under the section being read (the
 * section that crosses 40% of the screen), moving to the link under the
 * pointer, or to "Our businesses" while its fold-out is open. It travels on a
 * spring (interruptible, so quick hovers never queue up) and swells while
 * pressed, as Apple's Liquid Glass tab bars do.
 */
function initNavGlass() {
  const links = $('[data-nav-links]');
  const glass = $('[data-nav-glass]');
  if (!links || !glass) return;
  const items = $$('[data-nav-item]', links);
  const trigger = $('[data-biz-trigger]', links);
  const sections = ['about', 'businesses', 'how-we-work', 'who-we-work-with', 'book', 'faq']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  let current: HTMLElement | null = null;
  let hovered: HTMLElement | null = null;
  let shown: HTMLElement | null = null;
  let placed = false;
  const spring = () =>
    reduced.matches ? { duration: 0 } : ({ type: 'spring', visualDuration: 0.4, bounce: 0.22 } as const);

  const target = () => hovered ?? (trigger?.getAttribute('aria-expanded') === 'true' ? trigger : current);
  const render = (force = false) => {
    items.forEach((item) => item.toggleAttribute('data-selected', item === current));
    const next = target();
    if (next === shown && !force) return;
    shown = next;
    if (!next) {
      animate(glass, { opacity: 0, scale: 0.92 }, reduced.matches ? { duration: 0 } : { duration: 0.18 });
      placed = false;
      return;
    }
    const box = links.getBoundingClientRect();
    const r = next.getBoundingClientRect();
    const to = { x: r.left - box.left, width: r.width };
    if (!placed) {
      // Appear in place (no slide in from the left edge)
      animate(glass, to, { duration: 0 });
      animate(glass, { opacity: [0, 1], scale: [0.92, 1] }, reduced.matches ? { duration: 0 } : { duration: 0.22 });
      placed = true;
      return;
    }
    animate(glass, { ...to, opacity: 1, scale: 1 }, spring());
  };

  /* Scroll position: which section is being read. The nearest section top above the
     reading line wins, so the result follows the page, whatever order the sections are in.
     Sections with no header link (#book) hide the lens while they are read. */
  const spy = () => {
    const line = window.innerHeight * 0.4;
    let id: string | null = null;
    let nearest = -Infinity;
    for (const s of sections) {
      const top = s.getBoundingClientRect().top;
      if (top <= line && top > nearest) {
        nearest = top;
        id = s.id;
      }
    }
    const next = items.find((item) => item.dataset.navItem === id) ?? null;
    if (next !== current) {
      current = next;
      render();
    }
  };
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        spy();
      });
    },
    { passive: true },
  );

  if (fine.matches) {
    items.forEach((item) =>
      item.addEventListener('pointerenter', () => {
        hovered = item;
        render();
      }),
    );
    links.addEventListener('pointerleave', () => {
      hovered = null;
      render();
    });
  }
  items.forEach((item) => {
    item.addEventListener('pointerdown', () => {
      // Pressed, the selection lifts into a Liquid Glass lens (Nav.astro [data-lift])
      glass.toggleAttribute('data-lift', true);
      if (reduced.matches) return;
      animate(glass, { scale: 1.08 }, { type: 'spring', visualDuration: 0.25, bounce: 0.3 });
    });
    item.addEventListener('focus', () => {
      hovered = item;
      render();
    });
    item.addEventListener('blur', () => {
      if (hovered === item) hovered = null;
      render();
    });
  });
  const settle = () => {
    glass.toggleAttribute('data-lift', false);
    if (!reduced.matches && shown) animate(glass, { scale: 1 }, spring());
  };
  window.addEventListener('pointerup', settle);
  window.addEventListener('pointercancel', settle);
  if (trigger) new MutationObserver(() => render()).observe(trigger, { attributeFilter: ['aria-expanded'] });

  /* Link widths change once the web fonts load and when the header reflows */
  new ResizeObserver(() => render(true)).observe(links);
  spy();
}

/* "Our businesses" fold-out: hover on mouse, click everywhere, Escape and outside click close */
function initBusinessesMenu() {
  const menu = $('[data-biz-menu]');
  const trigger = $<HTMLButtonElement>('[data-biz-trigger]');
  const panel = $('[data-biz-panel]');
  if (!menu || !trigger || !panel) return;
  let closeTimer = 0;
  let hoverOpenedAt = 0;

  const set = (open: boolean) => {
    window.clearTimeout(closeTimer);
    trigger.setAttribute('aria-expanded', String(open));
    panel.toggleAttribute('data-open', open);
  };
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  // A click right after hover opened the panel keeps it open rather than toggling it shut.
  trigger.addEventListener('click', () => {
    if (isOpen() && performance.now() - hoverOpenedAt < 600) return;
    set(!isOpen());
  });
  menu.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !fine.matches || isOpen()) return;
    hoverOpenedAt = performance.now();
    set(true);
  });
  menu.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse' || !fine.matches) return;
    closeTimer = window.setTimeout(() => set(false), 120);
  });
  menu.addEventListener('focusout', (e) => {
    if (!menu.contains(e.relatedTarget as Node | null)) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      set(false);
      trigger.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !menu.contains(e.target as Node)) set(false);
  });
  $$('a', panel).forEach((a) => a.addEventListener('click', () => set(false)));
  closeOnPageScroll(trigger, () => {
    if (panel.contains(document.activeElement)) trigger.focus({ preventScroll: true });
    set(false);
  });
}

/* A menu left open while the page scrolls away from it closes, as Apple's menus do
   (QA, 24 Nov 2026): it would otherwise float over content it no longer belongs to.
   The scroll position is noted the moment the menu opens (its trigger's
   aria-expanded turns true); a small allowance ignores the nudge of a tap or a
   trackpad settling. */
function closeOnPageScroll(trigger: HTMLElement, close: () => void) {
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  let from = window.scrollY;
  new MutationObserver(() => {
    if (isOpen()) from = window.scrollY;
  }).observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
  window.addEventListener(
    'scroll',
    () => {
      if (isOpen() && Math.abs(window.scrollY - from) > 64) close();
    },
    { passive: true },
  );
}

/* Small-screen sheet */
function initSheet() {
  const burger = $<HTMLButtonElement>('[data-burger]');
  const sheet = $('[data-sheet]');
  if (!burger || !sheet) return;
  const set = (open: boolean) => {
    burger.setAttribute('aria-expanded', String(open));
    sheet.toggleAttribute('data-open', open);
  };
  const isOpen = () => burger.getAttribute('aria-expanded') === 'true';
  burger.addEventListener('click', () => {
    set(!isOpen());
    if (isOpen()) $<HTMLAnchorElement>('a', sheet)?.focus();
  });
  $$('a', sheet).forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      set(false);
      burger.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !sheet.contains(e.target as Node) && !burger.contains(e.target as Node)) set(false);
  });
  closeOnPageScroll(burger, () => {
    if (sheet.contains(document.activeElement)) burger.focus({ preventScroll: true });
    set(false);
  });
}

/* Sticky stage: the scene follows whichever business copy sits mid-screen */
function initStage() {
  const stage = $('[data-stage]');
  if (!stage) return;
  const layers = $$('[data-layer]', stage);
  const feats = $$('[data-feat]');
  const counter = $('[data-stage-n]', stage);

  const show = (index: number) => {
    if (stage.dataset.scene === String(index)) return;
    stage.dataset.scene = String(index);
    layers.forEach((layer, i) => layer.toggleAttribute('data-on', i === index));
    feats.forEach((feat, i) => feat.toggleAttribute('data-on', i === index));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    const g = $('[data-gauge]', layers[index]!);
    if (g && !reduced.matches) replayGauge(g);
  };

  // The scene follows scroll position across the copy column, in both directions
  // (an in-view trigger per block fires once and never switched back on the way up).
  const copy = $('.feat-copy');
  if (!copy || !feats.length) return;
  scroll(
    (progress: number) => {
      if (!window.matchMedia('(min-width: 56.25rem)').matches) return;
      show(Math.min(feats.length - 1, Math.max(0, Math.floor(progress * feats.length))));
    },
    { target: copy, offset: ['start center', 'end center'] },
  );
}

/* Small-screen scenes play their entrance as they scroll in */
function initInlineScenes() {
  if (reduced.matches) return;
  $$('.feat-inline').forEach((scene) => {
    if (scene.getBoundingClientRect().top < window.innerHeight) return;
    scene.removeAttribute('data-on');
    inView(scene, () => scene.setAttribute('data-on', ''), { amount: 0.4 });
  });
}

/* Floating illustrations run only while their container is on screen
   (they start paused in the HTML; the keyframes live in global.css). */
function initFloating() {
  $$('[data-floats]').forEach((el) =>
    inView(
      el,
      () => {
        el.removeAttribute('data-float-paused');
        return () => el.setAttribute('data-float-paused', '');
      },
      { margin: '80px 0px' },
    ),
  );
}

/* FAQ rows */
function initFaq() {
  $$<HTMLButtonElement>('[data-faq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      document.getElementById(btn.getAttribute('aria-controls')!)?.toggleAttribute('data-open', open);
    });
  });
}

/* Placements heatmap: tooltip and dimming on hover; small screens open on the latest weeks */
function initHeatmap() {
  const wrap = $('[data-heatmap]');
  const grid = wrap && $('[data-hm]', wrap);
  const tip = wrap && $('[data-hm-tip]', wrap);
  const scroller = wrap && $('[data-hm-scroll]', wrap);
  if (!wrap || !grid || !tip || !scroller) return;
  scroller.scrollLeft = scroller.scrollWidth;

  let active: HTMLElement | null = null;
  const clear = () => {
    active?.removeAttribute('data-active');
    active = null;
    grid.removeAttribute('data-hover');
    tip.removeAttribute('data-on');
  };
  grid.addEventListener('pointerover', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('i[data-t]');
    if (!cell) return;
    active?.removeAttribute('data-active');
    active = cell;
    cell.setAttribute('data-active', '');
    grid.setAttribute('data-hover', '');
    const n = Number(cell.dataset.n);
    const strong = document.createElement('b');
    strong.textContent = `${n} ${n === 1 ? wrap.dataset.one : wrap.dataset.many}`;
    tip.replaceChildren(strong, ` · ${cell.dataset.t}`);
    const c = cell.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    tip.style.setProperty('--x', `${c.left - w.left + c.width / 2}px`);
    tip.style.setProperty('--y', `${c.top - w.top}px`);
    tip.setAttribute('data-on', '');
  });
  grid.addEventListener('pointerleave', clear);
  scroller.addEventListener('scroll', clear, { passive: true });
}

/* Where we work map: pointing at a country (its dots, link or label) keeps it
   bright and quietens the other marked countries */
function initMap() {
  const map = $('[data-map]');
  if (!map) return;
  const marks = $$<HTMLElement>('[data-map-id]', map);
  let focus: string | null = null;
  const set = (id: string | null) => {
    if (id === focus) return;
    focus = id;
    map.toggleAttribute('data-focus', Boolean(id));
    marks.forEach((m) => m.toggleAttribute('data-active', m.dataset.mapId === id));
  };
  map.addEventListener('pointerover', (e) => {
    set((e.target as Element).closest<HTMLElement>('[data-map-id]')?.dataset.mapId ?? null);
  });
  map.addEventListener('pointerleave', () => set(null));
}

/* Start with a conversation: optional needs build the client's brief (SGI stays
   the one contact), and fill the booking link's {needs} placeholder when it has one */
function initConversation() {
  const convo = $('[data-convo]');
  if (!convo) return;
  const chips = $$<HTMLButtonElement>('[data-need]', convo);
  const live = $('[data-convo-summary]', convo);
  const said = $('[data-convo-said]', convo);
  const cta = $<HTMLAnchorElement>('[data-booking-template]', convo);
  const join = (names: string[]) =>
    names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const update = () => {
    const picked = chips.filter((c) => c.getAttribute('aria-pressed') === 'true');
    convo.dataset.on = picked.map((c) => c.dataset.need).join(' ');
    const labels = picked.map((c) => c.textContent?.trim() ?? '');
    if (live) {
      live.textContent = labels.length
        ? (convo.dataset.summary ?? '').replace('{needs}', join(labels))
        : (convo.dataset.summaryEmpty ?? '');
    }
    // The visible reply under the needs: "Not sure yet?" or the brief. It is not a live
    // region (the hidden summary above announces), so the change is shown with a short
    // nudge: state feedback, transform and opacity only, opacity only when reduced.
    const next = labels.length
      ? (convo.dataset.said ?? '').replace('{needs}', join(labels))
      : (convo.dataset.saidEmpty ?? '');
    if (said && said.textContent !== next) {
      said.textContent = next;
      said.animate(
        reduced.matches
          ? { opacity: [0.35, 1] }
          : { opacity: [0.35, 1], transform: ['translateY(0.25em)', 'none'] },
        { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    }
    const template = cta?.dataset.bookingTemplate;
    if (cta && template) {
      cta.href = template.replace(/\{needs\}|%7Bneeds%7D/gi, encodeURIComponent(labels.join(', ')));
    }
  };
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
      update();
    }),
  );
}

/* Talent chooser: training or a role */
function initTalent() {
  const card = $('[data-talent]');
  if (!card) return;
  const buttons = $$<HTMLButtonElement>('[data-choice-btn]', card);
  const answers = $$('[data-answer]', card);
  buttons.forEach((btn, index) =>
    btn.addEventListener('click', () => {
      if (card.dataset.choiceIndex === String(index)) return;
      card.dataset.choiceIndex = String(index);
      card.dataset.business = btn.dataset.business ?? '';
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      answers.forEach((a) => (a.hidden = a.dataset.answer !== btn.dataset.choiceBtn));
    }),
  );
}

/* In-page links scroll to their section without writing "#section" into the address.
   With the hash left in the URL, a refresh in Safari (and Firefox) jumped back to the
   last section clicked instead of staying where the reader had scrolled to (Daniel,
   23 Nov 2026). A link that arrives with a hash still lands on its section; the hash
   is then cleared, so later refreshes keep the reader's place. Focus moves to the
   section, so keyboard and screen-reader users carry on from there. */
function initInPageLinks() {
  const clearHash = () => {
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  };
  if (location.hash) {
    if (document.readyState === 'complete') requestAnimationFrame(clearHash);
    else window.addEventListener('load', () => requestAnimationFrame(clearHash), { once: true });
  }
  // A hash typed into the address bar of the open page: let the browser land, then clear it
  window.addEventListener('hashchange', () => requestAnimationFrame(clearHash));
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.target) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    // Smooth unless the reader prefers reduced motion; scroll-padding keeps it clear of the header
    target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    clearHash();
  });
}

/* Liquid Glass light: on the header bar, the specular highlight and the lit rim
   lean toward the pointer, the web's stand-in for glass catching light as the
   device moves. Mouse only, and only when motion is welcome. */
function initGlassLight() {
  const pill = $('.pill');
  if (!pill || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let frame = 0;
  let x = 0.3;
  const paint = () => {
    frame = 0;
    pill.style.setProperty('--glass-light', `${Math.round(x * 100)}%`);
    pill.style.setProperty('--glass-rim-angle', `${Math.round(140 + x * 50)}deg`);
  };
  document.addEventListener(
    'pointermove',
    (e) => {
      if (reduced.matches || e.pointerType !== 'mouse') return;
      const r = pill.getBoundingClientRect();
      x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true },
  );
}

/* Liquid Glass press: the light in a pressed glass button gathers where the finger
   or pointer lands, and follows it while held (global.css draws it from --gx/--gy) */
function initGlassPress() {
  const place = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('.button, [data-glass]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`);
    el.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`);
  };
  document.addEventListener('pointerdown', place, { passive: true });
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.buttons) place(e);
    },
    { passive: true },
  );
}

initInPageLinks();
initGlassPress();
initGlassLight();
initHeader();
initBusinessesMenu();
initNavGlass();
initSheet();
initStage();
initInlineScenes();
initFloating();
initFaq();
initHeatmap();
initMap();
initConversation();
initTalent();
initGauges();
