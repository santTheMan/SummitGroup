# Handoff: SGI website, Phase 1

Status: production code built and verified locally on branch `claude/vigilant-brown-ab7910`.
**Not deployed.** No accounts, services, DNS or production settings were touched.

Run `npm run check:release` for the current list of open items. It exits with an error
until every item below is resolved.

## What is built

A single-page SGI corporate site in Astro (static output):

1. **Header**: SGI horizontal lockup, anchor navigation (About, Our businesses, How we work,
   Who we work with) and a visible **Book a conversation** button. Small screens use an
   accessible menu.
2. **Hero**: the approved 13-word promise, one supporting line and the one primary call to
   action, over an animated funnel: SGI as the source, narrowing behind the call to action
   and resolving into three labelled branches for Summit Institute, Summit Sales and Summit
   Pathways.
3. **About SGI** with proof: 450+ placements since June 2025; 1 point of contact for every
   client; 3 specialist businesses in one group.
4. **One relationship. Three specialists.**: SGI at the head of the three businesses, each with
   its approved role, plus a note directing individuals (talent) to the specialist businesses.
5. **How we work**: four steps with no timelines or service levels.
6. **Who we work with**: South African corporates and banks, international clients, partners and funders.
7. **Closing call to action and footer**. The closing button shows a pre-launch notice until a
   booking destination is approved.

## Verification (run on this branch)

| Check | Result |
| --- | --- |
| `npm run lint` | Pass, no warnings |
| `npm run typecheck` (`astro check`) | Pass: 0 errors, 0 warnings, 0 hints |
| `npm test` (Vitest) | Pass: 39 tests (geometry, copy governance, release gate) |
| `npm run build` | Pass |
| `npm run test:e2e` (Playwright, desktop 1440x900, tablet 834x1112, mobile Pixel 7) | Pass: 45 passed, 3 skipped by design (viewport-specific) |
| axe-core WCAG 2.0/2.1/2.2 A and AA | No violations on any viewport |
| `npm run check:release` | **Fails as intended**: 8 open items (below) |

The end-to-end suite covers the single h1 and heading order, landmarks, every in-page link,
one consistent call to action, clicking the call to action through the canvas, the pre-launch
booking notice, no external links, noindex by default, no horizontal overflow, no console
errors, the funnel pausing off-screen, the reduced-motion still frame, the skip link, desktop
keyboard order and the small-screen menu (Escape and focus return).

Also checked in a browser: 1280x720, 1440x900, 1920x1080, 834x1112, 390x844, 360x640, 320x568,
the open menu, focus rings, no-JavaScript fallback, and layout shift (CLS 0 on desktop and
mobile). First load is about 80 KB (HTML, CSS and JS about 13 KB gzipped together; fonts 60 KB;
logo 3 to 9 KB).

## Release blockers

| # | Item | Needed from | How to close it |
| --- | --- | --- | --- |
| 1 | **Booking destination** for every "Book a conversation" button. No approved booking page, form, address or integration was found. | Website owner / leadership | Set `PUBLIC_BOOKING_URL` (an `https:` or `mailto:` address). If the destination is a form that collects personal information, confirm a POPIA privacy notice and a secure handling path first. |
| 2 | **Production domain** | Website owner | Set `PUBLIC_SITE_URL`; canonical and social-preview URLs switch on automatically. |
| 3 | **Indexing switch** | Website owner, at launch | Set `PUBLIC_ALLOW_INDEXING=true` for the launch build only. |
| 4 | **Final logo files.** The Brand Pack v1.0 (20 Nov 2026) SVGs were not available to this build, so the header, footer, diagram and favicons use the transparent 4K PNGs from the 18 Nov SGI brand pack (same lockup and icon, raster). | Website owner | Add the v1.0 SVGs and follow `src/content/brand-assets.ts`. |
| 5 | **Homepage copy sign-off** (see "Copy to approve") | Website owner / leadership | Approve, then set `signOffs.homepageCopy = true` in `src/content/site.ts`. |
| 6 | **"Summit Pathways" is a working name** | Website owner / leadership | Confirm or rename in `src/content/site.ts`, then set `signOffs.pathwaysName`. |
| 7 | **"450+ placements since June 2025"**: confirm exact wording and scope (what counts as a placement; group-wide) against the latest figures. | Leadership | Edit if needed, then set `signOffs.placementsFigure`. |
| 8 | **Legal details**: registered company name for the footer (it currently uses the brand name only) and whether a privacy notice or other notices are required. The site collects no personal data, sets no cookies and loads no third-party resources. | Leadership / legal adviser | Confirm, then set `signOffs.legalDetails`. |

## Copy to approve

Approved and used exactly as provided:
- Promise: "We recruit, develop and manage South African talent that takes your business higher."
- Summit-Ready: "Trained, tested and supported before they reach you." (used as the standard, not a guarantee)
- "One relationship. Three specialists."
- Roles: Summit Institute "Develops skills"; Summit Sales "Manages and coaches sales teams"; Summit Pathways "Recruits and places talent".

Drafted for this site and **awaiting approval** (all in `src/content/site.ts`):
- Hero support line: "One relationship with Summit Group International. Three specialist businesses behind it."
- About: "One group. One point of contact." and its paragraph.
- One supporting sentence per business card.
- Talent note: "Looking for training or a role? Our specialist businesses work with individuals directly. SGI works with companies and partners."
- The four "How we work" steps.
- "Who we work with" heading and the three audience descriptions.
- Closing: "Start with a conversation." and its line.
- Page title and meta description.

## Deliberately left out

These appeared in planning material but are not published, per the brief:

- **$1.5m a month client result.** Drafted with its qualification (the largest monthly revenue
  of a client our teams helped scale; not SGI revenue, not typical, not a guarantee) but held
  back with `status: 'pending'` until its exact wording and scope are confirmed.
- **350+ placements.** Superseded by 450+.
- **R12.8m+ talent commissions.** Talent-facing; not corporate proof.
- **Event and attendee counts, client names, testimonials, case studies, registration and
  B-BBEE claims, certifications, leadership names.** Not confirmed for publication.
- **Process service levels** (for example shortlist or onboarding timeframes, reporting
  cadence). Proposed in planning, not confirmed as current, so "How we work" describes the
  process without timings.
- **Vision and long-term ambition statements.** Marked as proposals in the source, and the
  ambition includes an unsupported "largest" claim.
- **Contact details, social links, address.** None verified for SGI.
- **Links to the specialist businesses for talent.** No confirmed destinations yet; the talent
  note names the route without a link.
- **A client or partner logo strip.** No approved assets.

## Decisions needed

1. **Where should "Book a conversation" go?** A scheduling page, a contact form or an email
   address. A form needs a privacy notice and a secure data path before it goes live.
2. **Talent routes.** Should the talent note link to the specialist businesses' own pages
   or channels, and which ones?
3. **Hosting.** The output is a static `dist/` folder, deployable to any static host. Pick the
   host and add security headers there: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and
   a Content-Security-Policy. The build has two small inline scripts (the `js` class switch and
   the header menu, which Astro inlines), so the policy needs their hashes, computed from the
   final build.
4. **Social preview image.** Needs the production domain; a branded image can be added then.

## Sources and limits

- Copy and claims follow the brief, *SGI Marketing Foundations* (16 Nov 2026, with the
  placements figure corrected to 450+ at the 16 Nov brand strategy review) and the SGI
  brand sheet (18 Nov 2026). Colours were checked against the brand pack's colour file.
- Not available to this build and worth a final cross-check: the project's local strategy
  notes, *SGI Foundational Strategy*, *SGI and Summit Pathways Structure and Brand
  Foundations*, *SGI Brand Essentials* and the Brand Pack v1.0 README.
- Fonts: Space Grotesk and Archivo variable fonts from the brand pack, subset to Latin and
  converted to WOFF2 by `scripts/brand/build-fonts.py` (SIL OFL 1.1, licences in `public/fonts`).
- Visual reference: the public Qronos template page was studied for mood only (a dark hero,
  restrained navigation, a short centred hero and a filament funnel). It was captured
  directly from the live page for this build; no code, artwork, copy, logos or claims were
  reused, and the motif is SGI's own.
