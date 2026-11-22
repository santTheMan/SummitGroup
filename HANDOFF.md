# Handoff: SGI website, Phase 1

## 22 Nov 2026 changes (Daniel's review)

- **Hero:** both floating cards are gone: "New brief: Outbound sales team" above the panel and,
  later the same day, "Update from SGI: Shortlist ready" below it. They pulled focus from
  the panel, which now stands alone.
- **"Start with a conversation":** no longer a boxed gradient card. The same blue and peach
  glows now sit in an open, full-width wash. A warm tint fades in from the section above on an
  eased curve and back out into the page below, so there is no edge. It mirrors the talent
  section's wash underneath: blue behind the words and peach behind the brief here, the other
  way round there. The glows still drift toward the pointer on desktop. The card's
  scroll-in "settle" went with the card. Two contrast fixes came with it, because the open
  wash let the checker see text the card's gradient had hidden:
  - The "Optional. Pick any." hint is now 78% ink.
  - Unpicked rows in the Your brief card keep full-strength grey text. Only their icon and
    tick are faint; they used to be faded to 45%.
- **FAQ moved to the end:** the page now runs Hero, About, Our businesses, How we work, Who
  we work with, Start with a conversation, Looking for training or a role?, FAQ, footer. The
  FAQ's full-width top rule is gone, so the talent section's wash fades into it with no line.
  The header lens now picks the nearest section above the reading line, wherever it sits on
  the page. It hides while "Start with a conversation" and the talent section are read, and
  marks FAQ once the FAQ is reached.
- **Section labels:** the small pulsing dot before each section label ("About SGI", "Our
  businesses", "How we work", "Who we work with") is gone. The labels are plain blue text,
  and nothing on the page loops on a ping any more.
- **"Looking for training or a role?"** is no longer a dark navy box. It sits on a soft wash in
  the brand glows (sky behind the journey card, peach behind the copy, the same `--glow-*`
  tokens as the closing card), which fades into the page colour on every edge. Text, the
  Training / A role toggle and the Summit-Ready journey card are now in the light page style:
  ink type, an ink selected pill, and a frosted white card with electric ticks.
- **About figures removed:** the 450+ / 1 / 3 proof row under the statement is gone at
  Daniel's request. The figures stay in `proof` in `src/content/site.ts`, and 450+ is still
  shown by the placements heatmap in How we work, so `signOffs.placementsFigure` still applies.
- **Client revenue gauge** (About, under the statement), after bklit's Gauge chart
  (`value 66`, `spacing 25`, `inactiveFillOpacity 0.4`, USD with no cents). It reads "Revenue
  generated for clients in the past 3 months". **The $428,000 and the 66% fill are bklit's
  example values.** Set the real amount, period and fill in `clientRevenue` in
  `src/content/site.ts`, then `signOffs.clientRevenueFigure`. The note under the gauge says
  "Example figure until confirmed". Change it to plain "not SGI revenue" wording once the
  figure is real. It is a client-results claim, like the pending $1.5m.
- **Who we work with (reworked later on 22 Nov):** all three card illustrations are gone. That
  covers the corporates Without/With SGI toggle, the International clients "Covered 24/7" card
  and the Partners talent pipeline, and the "Book a conversation" links under each card went
  with them. The section is type and the map: the three audiences as a list under hairlines
  on the left, and the map on the right. On tablets the map sits on top with three columns
  below; on phones everything is one column. The 24/7 line lives on in the international
  clients text: "We work 24/7, in line with your needs." It is part of the homepage copy
  sign-off.
- **Where we work map:** the first version, a filled choropleth, did not blend with the page.
  It is now a **dot map** after bklit's choropleth dot grid. Land is a grid of soft dots in the
  page's own ink, fading out at every edge. South Africa (navy, "Our talent") and the US, UK and
  Australia (blue, "Clients", Summit Sales' confirmed markets) are picked out. Labels sit on
  the map, and thin arcs draw from South Africa to each market on first view. Pointing at a
  country quietens the others. It is drawn at build time with d3-geo from world-atlas 110m:
  each dot is a zero-length round-capped stroke, so the whole map is about 15 KB of SVG and no
  map library. To add or change countries, edit `audiences.markets` (ISO numeric id, plus
  `at` for where the label points).
- **Header:** the Book a conversation button is gone from the header pill. The hero and the
  closing section still carry the call to action, and the small-screen menu still ends with
  it. The selected item is now a liquid-glass lens (after Apple's Liquid Glass tab bars). It
  sits under the section being read, springs to the link under the pointer or the focused link
  (and to "Our businesses" while its fold-out is open), and swells while pressed.

## Redesign on branch `redesign/teal-look` (20 Nov 2026)

The funnel build below was rejected as looking AI-made. This branch rebuilds the page on two
templates Daniel chose: **Teal Treasury** (layout, warm cream page, motion) and **Lilac Meadow**
(feature cards, FAQ), with his picks of a type-led hero over a live panel and a warm cream page.
Motion is built with Motion (`motion` 14.14) following the /motion skill, and the interaction
details follow Emil Kowalski's design-engineering rules. The hero panel's Summit-Ready gauge is
modelled on bklit's Gauge chart. See README, "The page and its motion".

Sections: sticky nav with an "Our businesses" fold-out; hero (approved promise) over an
interactive example-brief panel with the gauge; About statement and proof (450+, 1, 3);
sticky business stage (Institute, Sales, Pathways); How we work with a daily placements
heatmap (after bklit's HeatmapChart); Who we work with cards; FAQ; closing call to action;
talent chooser; footer.

Third round (20 Nov): "Start with a conversation" is simplified to one optional question and one
action. Visitors can tap Recruit, Develop or Manage, which build "Your brief" on a card that
keeps SGI as their single point of contact. No specialist business is named in this section, so
it never suggests the client deals with more than SGI. The only action is the booking link,
which is still the open release blocker: set `PUBLIC_BOOKING_URL` to the Calendly or HubSpot
Meetings page, optionally with a `{needs}` placeholder so the picks prefill the booking form
(see README). The second "See how we work" button was removed.

One point of contact (20 Nov): the hero panel is now the client's view of their brief. It shows
"Your contact: SGI" and what SGI covers (Recruit, Develop, Manage), and the second brief card reads
"Update from SGI". No specialist business is named in the hero or the conversation section, and
end-to-end tests check both. The businesses section and footer still introduce the three
specialists, as the approved "One relationship. Three specialists." line does.

Second round (20 Nov, Daniel's review): the example brief runs on stages (Brief in, Shortlist,
Placed) with "Placed in days, not weeks" and no day numbers; the business stage now follows
the scroll in both directions; the dot field became the heatmap; the Who we work with cards carry
working UI (a Without SGI / With SGI toggle, live Johannesburg/London/New York working hours
with the hours shared, a partner pipeline); the talent note became a "Training or a role?"
chooser; primary buttons are Electric blue with Apple-style squircle corners (CSS
`corner-shape: squircle`, with a matching clip-path fallback in `ui.ts` for Safari and Firefox).

**New copy to approve** (all in `src/content/site.ts`, covered by `signOffs.homepageCopy`):
the About statement, the FAQ (five questions, drafted from approved lines), the conversation
picker (question, Recruit / Develop / Manage with their one-line details, the "Your point of
contact" card, the three steps), the talent chooser
(question, options, answers, journey labels), the heatmap captions, "See how we work",
`audiences.visuals` (supplier names, "One point of contact", the working-hours caption about
the UK and Europe), and every label in `illustrations` (example brief, stages, statuses,
activity rows, scene labels). The panels are marked "Illustration" on the page, but their
numbers (a team of 12, 9 of 12 Summit-Ready, 8 coaching sessions and so on) are invented
examples and need a yes before launch.

**Heatmap data is illustrative.** `src/lib/placements.ts` spreads exactly 450 placements over
weekdays since 1 June 2025 (seeded, so every build is identical) and the card says so. Replace
`illustrativeCounts` with real daily or weekly counts before launch.

Verified on this branch: lint, `astro check`, 27 unit tests, build, and the full Playwright suite (64 checks across desktop, tablet and phone) ×3
runs on desktop, tablet and phone (axe WCAG 2.2 AA, reduced motion, keyboard order, menus,
panel, stage, heatmap total, cards, conversation picker, talent chooser and FAQ). Playwright's own browsers are not installed on this Mac; the run
used installed Chrome (`channel: 'chrome'`), or run `npx playwright install chromium` first.

Superseded: the three hero prototypes from earlier on 20 Nov (Statement, Portrait, Range) were
untracked; they now sit in `~/Skills/summit-group-strategy/website-archive/hero-prototypes-2026-11-20/`.
Favicons are still the interim PNGs (the logo files are now the v1.0 SVGs).

---

## Original Phase 1 build (superseded by the redesign above)

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
