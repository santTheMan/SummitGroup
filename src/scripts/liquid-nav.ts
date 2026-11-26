/**
 * The header's water: Nimbus UI "Liquid Navbar — Waterline" by Guglielmo
 * Giannattasio (guglielmogiannattasio.it, MIT licence), ported from React to
 * this site's plain TypeScript for Daniel (26 Nov 2026).
 *
 * A pill of water. The active drop stretches toward the link you pick, splits
 * into droplets on long jumps and merges back with a ripple. The cursor lifts a
 * meniscus, every tap sends a wave along the pill, and each icon plays its own
 * little scene. Water is drawn by a small WebGL shader (only inside the pill);
 * without WebGL it falls back to a CSS drop.
 *
 * Changes for SGI, beyond the port:
 *  - The drop marks the section being read (it used to be the glass lens), moves
 *    to "Our businesses" while its fold-out is open, and to a link the moment it
 *    is clicked; it fades away where no link applies (the hero, the booking band).
 *  - The water is still when nobody is touching the bar: its ambient ripple only
 *    runs while the pointer is over it or the drop is moving, so a sticky header
 *    never draws every frame for nothing (and never loops in the corner of the eye).
 *  - The pill's glass, rim and refraction stay the site's own (Nav.astro, refract.ts).
 *  - No sound, no arrow-key hijacking (the links stay ordinary links).
 */

const PAD = 14; // canvas bleed around the pill, for shadows and ripples

/* ---------- the water shader (verbatim from Nimbus) ---------- */
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;uniform float uDark;uniform float uAmb;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,h.y);}
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}
float waves(vec2 p){float w=0.;
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
 float dp=pillD(p);float dd=dropD(p);
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));
 vec3 V=vec3(0.,0.,1.);
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;
 float fres=clamp((1.-n.z)*4.,0.,1.);
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*(.11+.07*uDark);
 vec3 c=vec3(0.,.14,.36)*sh;float a=sh;
 float pa=clamp(pm*(fres*.5+spec*.9+spec2),0.,1.);
 c=mix(vec3(1.),irid,.5*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);
 float th=lens(dd,11.);
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);
 vec3 tint=mix(vec3(.80,.95,1.),vec3(.55,.82,1.),uDark);
 float rim=dm*(1.-smoothstep(0.,8.,-dd));
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);
 float da=dm*(.26+.14*body)*(1.-.35*uDark);vec3 dc=mix(tint,vec3(1.),body*.6);
 float la=rim*.22;vec3 lc=mix(vec3(0.,.42,.78),vec3(.1,.55,.95),uDark);dc=lc*la+dc*da*(1.-la);da=la+da*(1.-la);
 la=clamp(cres*.7+smoothstep(.6,1.,cs)*.28*th*dm,0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=clamp(dm*(spec*1.2+spec2*.5),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=dm*smoothstep(-2.,0.,dd)*.4;dc=mix(vec3(1.),irid,.35)*la+dc*(1.-la);da=la+da*(1.-la);
 c=dc+c*(1.-da);a=da+a*(1.-da);
 gl_FragColor=vec4(c,a);
}`;

type Body = { x: number; v: number };
type Sat = { x: number; y: number; vx: number; vy: number; r: number; k: number };
type Rip = { x: number; y: number; age: number; amp: number };
const UNIFORMS = ['uRes', 'uDpr', 'uTime', 'uPill', 'uBlob', 'uSy', 'uRip', 'uMouse', 'uDark', 'uAmb'] as const;
type GL = { gl: WebGLRenderingContext; u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null> };

function initGL(canvas: HTMLCanvasElement): GL | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  const p = gl.createProgram();
  if (!vs || !fs || !p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {} as GL['u'];
  for (const n of UNIFORMS) u[n] = gl.getUniformLocation(p, n);
  return { gl, u };
}

/** An element's offset inside `root` (unaffected by press transforms) */
const offsetIn = (el: HTMLElement, root: HTMLElement) => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

export function initLiquidNav() {
  const pill = document.querySelector<HTMLElement>('[data-nav] .pill');
  const links = document.querySelector<HTMLElement>('[data-nav-links]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-nav-water]');
  const drop = document.querySelector<HTMLElement>('[data-nav-drop]');
  if (!pill || !links || !canvas || !drop) return;
  const items = Array.from(links.querySelectorAll<HTMLElement>('[data-nav-item]'));
  const trigger = links.querySelector<HTMLElement>('[data-biz-trigger]');
  const sections = ['about', 'businesses', 'how-we-work', 'who-we-work-with', 'book', 'faq']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));
  const reduceQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- state (as Nimbus's makeState, plus `vis`: the drop fades where no link applies) ---- */
  const s = {
    a: { x: 0, v: 0 } as Body,
    b: { x: 0, v: 0 } as Body,
    sy: { s: 1, v: 0 },
    lead: 0 as 0 | 1,
    lagFrom: 0,
    sats: [] as Sat[],
    rips: [] as Rip[],
    t: { x: 0, cy: 0, q: 0, r: 20 },
    q: 0,
    vis: 0,
    visT: 0,
    mouse: { x: 0, y: 0, s: 0, on: false },
    moving: false,
    split: false,
    placed: false,
    w: 0,
    h: 0,
    visible: true,
    reduce: reduceQ.matches,
    raf: 0,
    last: 0,
    time: 0,
    glc: initGL(canvas),
  };
  pill.dataset.water = s.glc ? 'gl' : 'css';
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    s.glc = null;
    pill.dataset.water = 'css';
  });

  /* ---- drawing ---- */
  const blobs = new Float32Array(24);
  const sy = new Float32Array(6);
  const rips = new Float32Array(24);
  const draw = () => {
    const T = s.t;
    const sep = Math.abs(s.a.x - s.b.x);
    const thin = Math.min(sep / (2 * (s.q + T.r) || 1), 1);
    const r = T.r * (1 - 0.3 * thin);
    const v = s.vis;
    if (s.glc) {
      const { gl, u } = s.glc;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(u.uRes, s.w + PAD * 2, s.h + PAD * 2);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform4f(u.uPill, PAD, PAD, s.w, s.h);
      blobs.fill(0);
      sy.fill(1);
      if (v > 0.04) {
        const head = s.lead === 0 ? s.a : s.b;
        const tail = s.lead === 0 ? s.b : s.a;
        blobs.set(
          [head.x, T.cy, s.q * (1 - 0.25 * thin) * v, T.r * (1 - 0.12 * thin) * v, tail.x, T.cy, s.q * (1 - 0.8 * thin) * v, T.r * (1 - 0.5 * thin) * v],
          0,
        );
        sy[0] = sy[1] = s.sy.s;
        s.sats.slice(0, 4).forEach((d, i) => blobs.set([d.x, d.y, 0, d.r], 8 + i * 4));
      }
      gl.uniform4fv(u.uBlob, blobs);
      gl.uniform1fv(u.uSy, sy);
      rips.fill(0);
      s.rips.slice(-6).forEach((p, i) => rips.set([p.x, p.y, p.age, p.amp], i * 4));
      gl.uniform4fv(u.uRip, rips);
      gl.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s);
      gl.uniform1f(u.uDark, 0);
      gl.uniform1f(u.uAmb, s.reduce ? 0 : 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      const left = Math.min(s.a.x, s.b.x) - s.q - r - PAD;
      drop.style.width = `${sep + 2 * (s.q + r)}px`;
      drop.style.transform = `translateX(${left}px) scaleY(${s.sy.s})`;
      drop.style.opacity = String(v);
    }
  };

  /* ---- physics (Nimbus's springs, droplets and ripples) ---- */
  const step = (dt: number, now: number) => {
    const T = s.t;
    const busy = s.moving || s.rips.length > 0 || s.sats.length > 0 || s.mouse.s > 0.01;
    // The water's own shimmer only runs while someone is at the bar or the drop moves
    if (busy) s.time += dt;
    s.q += (T.q - s.q) * Math.min(1, dt * 12);
    s.vis += (s.visT - s.vis) * Math.min(1, dt * 10);
    const bodies = [s.a, s.b];
    let still = true;
    if (s.reduce) {
      s.a.x = s.b.x = T.x;
      s.a.v = s.b.v = 0;
      s.sy.s = 1;
      s.sats = [];
    } else {
      bodies.forEach((B, i) => {
        const lead = i === s.lead;
        const k = lead ? 210 : 72;
        const c = lead ? 25 : 13;
        const f = !lead && now < s.lagFrom ? 0.08 : 1;
        B.v += (k * (T.x - B.x) - c * B.v) * dt * f;
        B.x += B.v * dt;
        const lo = PAD + 6 + s.q + T.r - 3;
        const hi = PAD + s.w - 6 - s.q - T.r + 3;
        if (B.x < lo || B.x > hi) {
          s.sy.v -= Math.min(Math.abs(B.v), 900) * 0.0016;
          B.x = Math.max(lo, Math.min(hi, B.x));
          B.v *= -0.25;
        }
        if (Math.abs(T.x - B.x) > 0.3 || Math.abs(B.v) > 3) still = false;
      });
      const L = bodies[s.lead]!;
      const syT = 1 - 0.2 * Math.min(Math.abs(L.v) / 1500, 1);
      s.sy.v += (280 * (syT - s.sy.s) - 9 * s.sy.v) * dt;
      s.sy.s += s.sy.v * dt;
      if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) still = false;
      // Break the neck: droplets between head and tail on a long jump
      const sep = Math.abs(s.a.x - s.b.x);
      const r = T.r * (1 - 0.3 * Math.min(sep / (2 * (T.q + T.r) || 1), 1));
      if (!s.split && s.moving && sep - 2 * T.q - 2 * r > -6) {
        s.split = true;
        const lo = bodies[1 - s.lead]!;
        const hi = bodies[s.lead]!;
        [0.3, 0.5, 0.72].forEach((t, j) => {
          s.sats.push({
            x: lo.x + (hi.x - lo.x) * t + (Math.random() - 0.5) * 6,
            y: T.cy + (Math.random() - 0.5) * 10,
            vx: (lo.v + hi.v) * 0.45,
            vy: (Math.random() - 0.5) * 60,
            r: 5 + Math.random() * 3 - j * 0.5,
            k: 70 + Math.random() * 90,
          });
        });
      }
      s.sats = s.sats.filter((d) => {
        d.vx += (d.k * (T.x - d.x) - 9 * d.vx) * dt;
        d.vy += (90 * (T.cy - d.y) - 7 * d.vy) * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.x = Math.max(PAD + 8 + d.r, Math.min(PAD + s.w - 8 - d.r, d.x));
        d.y = Math.max(T.cy - T.r + d.r, Math.min(T.cy + T.r - d.r, d.y));
        if (Math.abs(T.x - d.x) < T.q + T.r * 0.5) d.r -= dt * 26;
        return d.r > 0.6;
      });
      if (s.sats.length) still = false;
    }
    if (Math.abs(s.visT - s.vis) > 0.01) still = false;
    if (s.moving && still) {
      s.moving = false;
      if (!s.reduce && s.vis > 0.5) s.rips.push({ x: T.x, y: T.cy, age: 0, amp: s.split ? 1.2 : 0.7 });
    }
    s.rips.forEach((p) => (p.age += dt));
    s.rips = s.rips.filter((p) => p.age < 2.4);
    s.mouse.s += ((s.mouse.on ? 1 : 0) - s.mouse.s) * Math.min(1, dt * 7);
    return busy || !still;
  };

  const loop = () => {
    if (s.raf) return;
    s.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      const busy = step(dt, now);
      draw();
      if (s.visible && (busy || s.mouse.on)) s.raf = requestAnimationFrame(tick);
      else s.raf = 0;
    };
    s.raf = requestAnimationFrame(tick);
  };

  /* ---- layout ---- */
  let current: HTMLElement | null = null; // the link the drop sits under
  const measure = (jump = false) => {
    s.w = pill.offsetWidth;
    s.h = pill.offsetHeight;
    const T = s.t;
    const el = current;
    s.visT = el ? 1 : 0;
    if (el) {
      const o = offsetIn(el, pill);
      T.r = el.offsetHeight / 2;
      T.q = Math.max(0, el.offsetWidth / 2 - T.r);
      T.cy = PAD + o.y + el.offsetHeight / 2;
      const nx = PAD + o.x + el.offsetWidth / 2;
      if (!s.placed || jump) {
        // Appear in place (no slide in from the edge)
        s.a.x = s.b.x = nx;
        s.a.v = s.b.v = 0;
        s.q = T.q;
        s.placed = true;
      } else if (Math.abs(nx - T.x) > 0.5) {
        s.lead = Math.abs(nx - s.a.x) <= Math.abs(nx - s.b.x) ? 0 : 1;
        s.lagFrom = performance.now() + 70;
        s.moving = true;
        s.split = false;
      }
      T.x = nx;
    } else {
      s.placed = s.vis > 0.05 && s.placed;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = s.w + PAD * 2;
    const Hh = s.h + PAD * 2;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${Hh}px`;
    }
    loop();
  };

  const setCurrent = (el: HTMLElement | null) => {
    items.forEach((item) => item.toggleAttribute('data-selected', item === el));
    if (el === current) return;
    const fromNothing = !current || s.vis < 0.05;
    current = el;
    measure(fromNothing);
  };

  /* ---- what the drop marks: the fold-out while open, a clicked link, else the section read ---- */
  let pinned: HTMLElement | null = null;
  let pinUntil = 0;
  let spied: HTMLElement | null = null;
  const choose = () => {
    if (trigger?.getAttribute('aria-expanded') === 'true') return setCurrent(trigger);
    if (pinned && performance.now() < pinUntil) return setCurrent(pinned);
    pinned = null;
    setCurrent(spied);
  };
  const spy = () => {
    const line = window.innerHeight * 0.4;
    let id: string | null = null;
    let nearest = -Infinity;
    for (const sec of sections) {
      const top = sec.getBoundingClientRect().top;
      if (top <= line && top > nearest) {
        nearest = top;
        id = sec.id;
      }
    }
    spied = items.find((item) => item.dataset.navItem === id) ?? null;
    // A clicked link holds the drop until the page arrives
    if (pinned && spied === pinned) pinUntil = 0;
    choose();
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
  if (trigger) new MutationObserver(choose).observe(trigger, { attributeFilter: ['aria-expanded'] });

  /* ---- interaction ---- */
  const local = (cx: number, cy: number) => {
    const r = pill.getBoundingClientRect();
    return { x: cx - r.left + PAD, y: cy - r.top + PAD };
  };
  const ripple = (x: number, y: number, amp: number) => {
    if (s.reduce) return;
    s.rips.push({ x, y, age: 0, amp });
    loop();
  };
  // Each icon's little scene, replayed on every tap
  const play = (item: HTMLElement) => {
    const ico = item.querySelector<HTMLElement>('.nv-ico');
    const kind = item.dataset.fx;
    if (!ico || !kind || s.reduce) return;
    items.forEach((other) => other !== item && other.querySelector('.nv-ico')?.removeAttribute('data-fx'));
    ico.removeAttribute('data-fx');
    void ico.offsetWidth;
    ico.dataset.fx = kind;
  };
  items.forEach((item) =>
    item.addEventListener('click', () => {
      play(item);
      if (item !== trigger) {
        pinned = item;
        pinUntil = performance.now() + 1500;
        choose();
      }
    }),
  );
  pill.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = local(e.clientX, e.clientY);
    s.mouse.x = p.x;
    s.mouse.y = p.y;
    s.mouse.on = true;
    loop();
  });
  pill.addEventListener('pointerleave', () => {
    s.mouse.on = false;
    loop();
  });
  pill.addEventListener('pointerdown', (e) => {
    const p = local(e.clientX, e.clientY);
    ripple(p.x, p.y, 0.8);
  });

  /* ---- lifecycle ---- */
  new IntersectionObserver(([e]) => {
    s.visible = Boolean(e?.isIntersecting);
    if (s.visible) loop();
  }).observe(pill);
  document.addEventListener('visibilitychange', () => {
    s.visible = document.visibilityState === 'visible';
    if (s.visible) loop();
  });
  reduceQ.addEventListener('change', () => {
    s.reduce = reduceQ.matches;
    loop();
  });
  // Link widths change once the web fonts load and when the header reflows
  let lastW = -1;
  new ResizeObserver(() => {
    if (pill.offsetWidth !== lastW || !s.w) {
      lastW = pill.offsetWidth;
      s.placed = false;
      measure();
    }
  }).observe(pill);
  spy();
  measure();
}
