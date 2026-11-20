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
| `npm test`              | Unit tests: copy governance, release gate                             |
| `npm run test:e2e`      | Builds, serves and runs Playwright on desktop, tablet and mobile      |
| `npm run verify`        | All of the above in order                                             |
| `npm run check:release` | Lists everything that must be resolved before publishing (exits 1)    |

Playwright uses the Chromium that ships with `@playwright/test`; run `npx playwright install chromium` once on a new machine.

## Configuration

Copy `.env.example` to `.env`. Every value is optional for local work.

| Variable                | Purpose                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PUBLIC_BOOKING_URL`    | Approved booking link for every "Book a conversation" button (`https:` or `mailto:`), for example a Calendly or HubSpot Meetings page. Until set, buttons scroll to the closing section, which shows a pre-launch notice. It may contain a `{needs}` placeholder (for example a Calendly prefill, `...?a1={needs}`): the closing section's button fills it with what the visitor picked ("Recruit, Manage"); every other button leaves it empty. |
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
  components/             Nav, Hero (+ BriefPanel, Gauge), Statement, Businesses (+ Scene), HowWeWork
                          (+ Heatmap), Audiences, Faq, Closing, TalentNote, Footer, CtaButton, Icon
  scripts/ui.ts           Header, businesses menu, small-screen sheet, brief panel, sticky stage, FAQ,
                          heatmap, cards, booking picker, talent chooser, squircle fallback
  scripts/motion.ts       All entrance and scroll motion (Motion), only without reduced motion
  scripts/gauge.ts        The notched gauge sweep
  lib/text.ts             Accent markup (*word*) and number splitting for the count-ups
  assets/brand/           SGI logo artwork (Brand Pack v1.0 SVGs; favicons still interim)
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
- The logo is the supplied Brand Pack v1.0 artwork at its own aspect ratio, never recoloured
  (colour lockup on the cream page, reversed icon on navy).
- To install the final Brand Pack v1.0 files, follow the steps in
  `src/content/brand-assets.ts`, then rebuild fonts and favicons:
  `python3 scripts/brand/build-fonts.py "<pack>/04 Fonts"` and
  `python3 scripts/brand/build-icons.py <icon-colour> <icon-reversed>` (needs `pip install fonttools brotli pillow`).

## The page and its motion

The layout follows two templates Daniel chose (Kedhar's *Teal Treasury* and *Lilac Meadow*
landings, MIT): Teal's cream paper, navy ink, sticky frosted nav, line-masked hero over a
working panel, word-by-word statement, sticky feature stage, pointer-lit call to action and
rising footer wordmark; Lilac's light-and-dark feature cards and two-column FAQ. The hero
gauge is modelled on bklit's Gauge chart (notched arc, gradient sweep), rebuilt as plain
SVG so the site needs no React or Tailwind.

- **Motion library.** [Motion](https://motion.dev) (`motion`, vanilla API): `animate`,
  `scroll`, `inView`, `stagger` and `scopeMotion`. Scroll-linked effects use
  `scroll(animate(...))`, which runs on the browser's ScrollTimeline where available.
- **Reduced motion.** Everything in `motion.ts` lives in one `scopeMotion` that only runs
  without a reduced-motion preference. The CSS pre-states (hidden headline words, panel) apply
  only under `html[data-motion="on"]`, which the inline head script sets and withdraws if the
  motion script has not started within three seconds. Without JavaScript the page renders in
  its final state, gauges included.
- **Interaction feel** follows Emil Kowalski's rules: custom ease-out curves, buttons scale to
  0.97 on press, hover effects only on devices that hover, the businesses menu grows from its
  trigger and closes faster than it opens, and nothing animates on keyboard actions.
- **Illustrations.** The hero panel and the three business scenes are labelled
  "Illustration"; their labels live in `illustrations` in `site.ts` and are not client data.

## Deployment

`npm run build` produces a static `dist/` folder that any static host can serve. Nothing is
deployed from this repository yet. Before a launch build, `npm run check:release` must pass.
