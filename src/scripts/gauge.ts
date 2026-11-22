import { animate, inView, motionValue, type AnimationPlaybackControls, type MotionValue } from 'motion';

/**
 * Drives the notched gauges (src/components/Gauge.astro). The fill sweeps with
 * bklit's default spring (visualDuration 0.9, no bounce); notches light as the
 * value passes them and any [data-gauge-count] counts with it.
 */
interface GaugeState {
  notches: SVGPathElement[];
  counts: HTMLElement[];
  value: MotionValue<number>;
  lit: number;
  /** The sweep in flight (including one still waiting out its delay). */
  sweep?: AnimationPlaybackControls;
}

const states = new WeakMap<HTMLElement, GaugeState>();
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function render(el: HTMLElement, state: GaugeState, v: number) {
  const total = state.notches.length;
  const lit = Math.round((v / 100) * total);
  if (lit !== state.lit) {
    for (let i = 0; i < total; i++) {
      const notch = state.notches[i]!;
      if (i < lit) notch.setAttribute('data-on', '');
      else notch.removeAttribute('data-on');
    }
    state.lit = lit;
  }
  for (let i = 0; i < state.counts.length; i++) {
    const count = state.counts[i]!;
    const text = countText(el, count, v);
    if (count.textContent !== text) count.textContent = text;
  }
  if (el.getAttribute('role') === 'meter') el.setAttribute('aria-valuenow', String(Math.round(v)));
}

const formats = new WeakMap<HTMLElement, Intl.NumberFormat>();

/**
 * [data-max]: the count at a full gauge (whole numbers).
 * [data-total]: the count once the gauge reaches its value, formatted with the
 * Intl options in [data-format] (bklit's centerValue + formatOptions).
 */
function countText(el: HTMLElement, count: HTMLElement, v: number) {
  if (count.dataset.total === undefined) return String(Math.round((v / 100) * Number(count.dataset.max)));
  let format = formats.get(count);
  if (!format) {
    format = new Intl.NumberFormat('en-US', JSON.parse(count.dataset.format ?? '{}'));
    formats.set(count, format);
  }
  const end = Number(el.dataset.value) || 100;
  return format.format(Math.round((Math.min(v, end) / end) * Number(count.dataset.total)));
}

function stateOf(el: HTMLElement): GaugeState {
  let state = states.get(el);
  if (!state) {
    const start = Number(el.dataset.value ?? 0);
    state = {
      notches: Array.from(el.querySelectorAll<SVGPathElement>('path')),
      counts: Array.from(el.querySelectorAll<HTMLElement>('[data-gauge-count]')),
      value: motionValue(start),
      lit: -1,
    };
    const s = state;
    s.value.on('change', (v) => render(el, s, v));
    states.set(el, s);
  }
  return state;
}

function sweep(state: GaugeState, to: number, delay = 0) {
  state.sweep?.stop();
  state.sweep = animate(state.value, to, { type: 'spring', visualDuration: 0.9, bounce: 0, delay });
}

/** Moves a gauge to `value` (0–100). */
export function setGauge(el: HTMLElement, value: number, valueText?: string) {
  const state = stateOf(el);
  el.dataset.value = String(value);
  if (valueText) el.setAttribute('aria-valuetext', valueText);
  if (reduced()) {
    state.sweep?.stop();
    state.value.jump(value);
    render(el, state, value);
    return;
  }
  sweep(state, value);
}

/** Empties a gauge and sweeps it back up to its current value. */
export function replayGauge(el: HTMLElement) {
  const state = stateOf(el);
  state.sweep?.stop();
  state.value.jump(0);
  render(el, state, 0);
  sweep(state, Number(el.dataset.value ?? 0), 0.15);
}

/** Empties every gauge and sweeps it to its value when it first comes into view. */
export function initGauges(root: ParentNode = document) {
  const gauges = Array.from(root.querySelectorAll<HTMLElement>('[data-gauge]'));
  for (const el of gauges) {
    const state = stateOf(el);
    if (reduced()) continue;
    const target = Number(el.dataset.value ?? 0);
    state.value.jump(0);
    render(el, state, 0);
    inView(
      el,
      () => {
        // A panel control may already have moved this gauge; sweep to its latest value.
        if (state.sweep) return;
        sweep(state, Number(el.dataset.value ?? target), Number(el.dataset.delay ?? 0.12));
      },
      { amount: 0.3 },
    );
  }
}
