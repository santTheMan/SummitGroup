import { inView, scroll } from 'motion';
import { initGauges, replayGauge, setGauge } from './gauge.ts';

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
}

/* Hero brief panel: step through the stages, spotlight a part of the brief */
function initPanel() {
  const panel = $('[data-panel]');
  if (!panel) return;
  const gauge = $('[data-gauge]', panel);
  const ranges = JSON.parse(panel.dataset.ranges ?? '[]') as { id: string; value: number; ready: number }[];
  const team = Number(panel.dataset.team);
  const rangeButtons = $$<HTMLButtonElement>('[data-range-btn]', panel);
  const focusButtons = $$<HTMLButtonElement>('[data-focus]', panel);

  rangeButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const range = ranges.find((r) => r.id === btn.dataset.rangeBtn);
      if (!range || panel.dataset.range === range.id) return;
      panel.dataset.range = range.id;
      rangeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      if (gauge) setGauge(gauge, range.value, `${range.ready} of ${team} people Summit-Ready`);
    }),
  );

  focusButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.focus!;
      const next = panel.dataset.spot === id ? null : id;
      if (next) panel.dataset.spot = next;
      else delete panel.dataset.spot;
      focusButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.focus === next)));
    }),
  );
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

/* Corporates card: flip between three suppliers and one relationship */
function initMerge() {
  const merge = $('[data-merge]');
  if (!merge) return;
  const buttons = $$<HTMLButtonElement>('[data-merge-btn]', merge);
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mergeBtn === merge.dataset.state)));
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      merge.setAttribute('data-touched', '');
      merge.dataset.state = btn.dataset.mergeBtn;
    }),
  );
  new MutationObserver(sync).observe(merge, { attributes: true, attributeFilter: ['data-state'] });
  sync();
}

/* Start with a conversation: optional needs build the client's brief (SGI stays
   the one contact), and fill the booking link's {needs} placeholder when it has one */
function initConversation() {
  const convo = $('[data-convo]');
  if (!convo) return;
  const chips = $$<HTMLButtonElement>('[data-need]', convo);
  const live = $('[data-convo-summary]', convo);
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

/* Live working hours: local times, 08:00-17:00 bars on a UTC day, hours shared with Johannesburg */
function initClock() {
  const tz = $('[data-tz]');
  if (!tz) return;
  const rows = $$('[data-zone]', tz);
  const label = tz.dataset.overlapLabel ?? '';
  const offset = (zone: string, now: Date) => {
    const name =
      new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'shortOffset' })
        .formatToParts(now)
        .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const m = /GMT([+-]\d+)(?::(\d+))?/.exec(name);
    return m ? Number(m[1]) + Math.sign(Number(m[1])) * (Number(m[2] ?? 0) / 60) : 0;
  };
  const pct = (h: number) => `${((((h % 24) + 24) % 24) / 24) * 100}%`;
  const update = () => {
    const now = new Date();
    const utc = now.getUTCHours() + now.getUTCMinutes() / 60;
    const homeStart = 8 - offset(rows[0]?.dataset.zone ?? 'UTC', now);
    rows.forEach((row) => {
      const zone = row.dataset.zone ?? 'UTC';
      const start = 8 - offset(zone, now);
      const time = $('[data-time]', row);
      if (time) time.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(now);
      const work = $('[data-work]', row);
      if (work) Object.assign(work.style, { left: pct(start), width: `${(9 / 24) * 100}%` });
      const overlap = $('[data-overlap]', row);
      const share = $('[data-share]', row);
      if (overlap && share) {
        const a = Math.max(start, homeStart);
        const b = Math.min(start + 9, homeStart + 9);
        overlap.hidden = b <= a;
        Object.assign(overlap.style, { left: pct(a), width: `${(Math.max(0, b - a) / 24) * 100}%` });
        share.textContent = b > a ? `${Math.round(b - a)}h ${label}` : '';
      }
      $('[data-now]', row)?.style.setProperty('--now', pct(utc));
    });
  };
  update();
  window.setInterval(update, 30_000);
}

/* Squircle fallback: where CSS corner-shape is missing (Safari, Firefox), clip
   each button to the same superellipse (|x|^4 + |y|^4 = 1 in each corner). */
function squirclePath(w: number, h: number, r: number, steps = 10) {
  const pts: string[] = [];
  const corner = (cx: number, cy: number, dx: number, dy: number, from: number, to: number) => {
    for (let k = 0; k <= steps; k++) {
      const t = ((from + ((to - from) * k) / steps) * Math.PI) / 2;
      const x = cx + dx * r * Math.cos(t) ** 0.5;
      const y = cy + dy * r * Math.sin(t) ** 0.5;
      pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  };
  corner(r, r, -1, -1, 0, 1);
  corner(w - r, r, 1, -1, 1, 0);
  corner(w - r, h - r, 1, 1, 0, 1);
  corner(r, h - r, -1, 1, 1, 0);
  return `M${pts.join('L')}Z`;
}

function initSquircles() {
  if (typeof CSS !== 'undefined' && CSS.supports('corner-shape', 'squircle')) return;
  document.documentElement.classList.add('sq-js');
  const shape = (el: HTMLElement) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    const r = Math.min(parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 16, w / 2, h / 2);
    el.style.clipPath = `path('${squirclePath(w, h, r)}')`;
  };
  const observer = new ResizeObserver((entries) => entries.forEach((e) => shape(e.target as HTMLElement)));
  $$('.button').forEach((el) => observer.observe(el));
}

initSquircles();
initHeader();
initBusinessesMenu();
initSheet();
initPanel();
initStage();
initInlineScenes();
initFloating();
initFaq();
initHeatmap();
initMerge();
initConversation();
initTalent();
initClock();
initGauges();
