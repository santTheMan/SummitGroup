# Summit Group International website

Phase 1 corporate website for Summit Group International (SGI): one relationship for
clients, with three specialist businesses behind it (Summit Institute, Summit Sales and
Summit Pathways).

This repository is the production code. It is **not deployed** yet: see
[HANDOFF.md](HANDOFF.md) for the open items and `npm run check:release` for the live list.

## Stack

- [Astro 7](https://astro.build) static site, TypeScript, plain CSS. No UI framework.
- Brand fonts self-hosted (Space Grotesk, Archivo; SIL OFL 1.1). No third-party requests.
- Vitest for unit tests, Playwright and axe-core for end-to-end and accessibility checks.
- Node 22.23.4 or later (see `.nvmrc`).

## Commands

| Command                 | What it does                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| `npm install`           | Install dependencies                                                  |
| `npm run dev`           | Local dev server at http://localhost:4321                             |
| `npm run build`         | Production build into `dist/`                                         |
| `npm run preview`       | Serve the production build locally                                    |
| `npm run lint`          | ESLint (TypeScript and Astro files)                                   |
| `npm run typecheck`     | `astro check` type and template diagnostics                           |
| `npm test`              | Unit tests: funnel geometry, copy governance, release gate            |
| `npm run test:e2e`      | Builds, serves and runs Playwright on desktop, tablet and mobile      |
| `npm run verify`        | All of the above in order                                             |
| `npm run check:release` | Lists everything that must be resolved before publishing (exits 1)    |

Playwright uses the Chromium that ships with `@playwright/test`; run `npx playwright install chromium` once on a new machine.

## Configuration

Copy `.env.example` to `.env`. Every value is optional for local work.

| Variable                | Purpose                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PUBLIC_BOOKING_URL`    | Approved destination for every "Book a conversation" button (`https:` or `mailto:`). Until set, buttons scroll to the closing section, which shows a pre-launch notice instead of a link. |
| `PUBLIC_SITE_URL`       | Production origin. Enables canonical and social-preview URLs.                                                            |
| `PUBLIC_ALLOW_INDEXING` | `true` only for the approved launch build. Otherwise pages carry `noindex, nofollow`.                                    |

## Where things live

```
src/
  content/site.ts         All page copy, proof points (with publish status) and sign-offs
  content/brand-assets.ts Whether the logo files are interim or final
  config/env.ts           Booking destination, origin and indexing switch
  lib/release.ts          Release gate used by check:release and the tests
  styles/                 Design tokens (brand palette, type scale), fonts, base styles
  components/             Header, Hero, About, Businesses, HowWeWork, Audiences, Closing, Footer
  scripts/funnel/         Hero motif: geometry.ts (pure maths), renderer.ts (canvas), index.ts (lifecycle)
  scripts/header.ts       Scrolled header state and the small-screen menu
  assets/brand/           SGI logo artwork (interim PNGs, see HANDOFF.md)
public/fonts/             WOFF2 brand fonts and their licences
scripts/brand/            Rebuild fonts and favicons from the brand pack
tests/unit, tests/e2e     Vitest and Playwright suites
```

### Editing copy

Change text in `src/content/site.ts` only. Proof points render only when
`status: 'approved'`. The unit tests guard the approved 13-word promise, the three
business roles and a list of claims that must not be published (outdated figures,
superlatives, guarantees, jargon, unverified contact details).

### Brand rules in code

- Palette tokens are in `src/styles/tokens.css`: Navy, Paper and white lead; Electric is
  the action colour; Deep and Sky are small cues (business accents, highlights). `#164F8C`
  is logo artwork only and deliberately has no token.
- The logo is the supplied artwork at its own aspect ratio, never recoloured.
  `Logo.astro` refuses to render it narrower than 100px.
- To install the final Brand Pack v1.0 files, follow the steps in
  `src/content/brand-assets.ts`, then rebuild fonts and favicons:
  `python3 scripts/brand/build-fonts.py "<pack>/04 Fonts"` and
  `python3 scripts/brand/build-icons.py <icon-colour> <icon-reversed>` (needs `pip install fonttools brotli pillow`).

## The hero funnel

The hero motif shows SGI as the single source: fine filaments flare from a wide mouth,
narrow to a waist behind **Book a conversation** (the one relationship), then resolve into
three twisted branches that land on Summit Institute, Summit Sales and Summit Pathways.
On first load the filaments flow down into the branches; afterwards the surface turns
slowly, with a few travelling highlights and subtle pointer repulsion on desktop.

- **Positions come from the page.** The waist is the centre of the call to action and each
  branch ends on its destination marker, so the motif stays aligned at every breakpoint.
- **Decorative only.** The canvas is `aria-hidden` with `pointer-events: none`; every link
  stays clickable (covered by an end-to-end test).
- **Motion preferences.** `prefers-reduced-motion` and Save-Data get a still frame; no
  JavaScript gets a soft CSS glow.
- **Budget.** Strand segments are batched into eight brightness levels (eight strokes per
  frame). Density tiers (high, medium, low) are chosen by screen size and device hints, and
  the controller steps down if frames run slow. Phones run at 30 fps. Drawing pauses when the
  hero is off-screen or the tab is hidden.
- **Tuning.** Shape constants (`FLARE`, `TWIST_UPPER`, `TWIST_LOWER`, `BREATH`) and
  `layoutFromAnchors` live in `geometry.ts`; densities, speed (`SPIN`) and brightness are in
  `renderer.ts`. `hero.dataset.funnelState` reports `animating`, `static` or `paused`.

## Deployment

`npm run build` produces a static `dist/` folder that any static host can serve. Nothing is
deployed from this repository yet. Before a launch build, `npm run check:release` must pass.
