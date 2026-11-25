# Handoff: SGI website, Phase 1

## 25 Nov 2026: changes from Daniel's meeting with Sam (24 Nov, Fathom recording)

Sam reviewed the live preview, was happy with the design, and asked for these (items 1 to 6
of Daniel's list):
1. **Revenue:** the $9.7M+ commission estimate was too high. Managed clients average no less
   than $600K and, at present, no more than $1M a month. The gauge shows **$600K+**, captioned
   "Monthly average", 60% full ($600K of the $1M top), with the range in the note. Sam's final
   figure is still to come.
2. **Partner wording:** clients are partners. The button reads **"Partner with us"** everywhere
   (hero, closing, footer) and the closing heading is **"Want to partner with us?"**.
3. **"Want to work with us?":** the talent section, modelled on careers.netrevenue.io. "A role"
   comes first and lists the roles SGI hires for (Sales development representative, Account
   executive, Sales manager, Recruiter / client relationship manager), each with a level and
   "Remote". Training is the second way in. Corporate role names, not "setter" or "closer"
   (claims governance bans sales-floor jargon). The roles are kinds of role, not live openings.
4. **"Speed to candidate":** a client's phrase Sam adopted. On the hero tablet ("Speed to
   candidate: days, not weeks") and in Summit Pathways' summary.
5. **Map:** Sam's client markets are the USA, United Kingdom, Switzerland, Malta, Germany and
   Tokyo (Japan). Australia is gone. The map is now bklit's Choropleth chart, the "Click to Zoom"
   example Daniel sent (filled countries, a 10° graticule, a marker per market, click to zoom
   with a tilted camera), rebuilt from bklit's source without React. Each market country is
   filled with its national flag (src/lib/flags.ts: official proportions and colours, drawn as
   SVG), kept to the flag's own proportions and cropped to the country; the US mainland and
   Alaska each get a whole flag. Other countries are the empty tone. No dots on the flags (Daniel
   removed them): each market keeps an invisible 18px hit area where its link lands, so small
   ones (Switzerland) are easy to point at, click and tap. Pointing at any
   country fades the rest and opens bklit's tooltip beside the cursor (name, then "Clients" /
   "Our talent", with "Tokyo" for Japan). Clicking a country flies the camera to it (a marker:
   4×), tilting 24° and turning 18° to look from its side; clicking it again, the empty map or
   Escape flies back. Only the markets can be clicked (Daniel, 25 Nov): any other country does
   nothing, or flies back out if zoomed in, and only markets show the hand cursor. Other countries
   are plain land: no name tag and no fade when pointed at (their names are no longer on the page). No name tag
   once a country is clicked or tapped (Daniel, 25 Nov): the
   tag shows only while pointing at the whole map. Where markets' tap areas overlap (Germany and
   Switzerland on a phone), the one nearest the finger wins. Malta is a marker only (too small for the 110m outlines), wearing its
   flag as a 12px badge. The legend shows each market's flag beside its name. Kept at
   Daniel's request: the map fades into the page at every edge, and thin arcs link South Africa
   to each client market. On phones a tap names and focuses the country, and a market within
   18px of the tap wins. The legend under the map lists every market.
6. **Tone:** SGI must read corporate and premium. Light pass: "Not sure yet? Get in touch
   anyway, and we will shape the brief with you." and the FAQ answers. Sam is recording a Loom
   with full copy feedback.

Also 25 Nov (Daniel): the hero's example brief is smaller on phones (320px wide and about 560px
tall, from 366 × 849 on a 390px screen): tighter type and spacing (nothing under 11px), smaller
avatar ticks, and Recruit / Develop / Manage in one row without their descriptions. The step
ticks also sat at the bottom edge of their circles on every screen (Icon's svg was outside the
scoped grid rule); they are centred now.

Also 25 Nov (Daniel): "Want to work with us?" had too much going on for Summit Pathways. The
roles are now titles only, one line each (Sales development representative, Account executive,
Sales manager, Recruiter, Client relationship manager), with "all remote" said once in the label;
the level tags, one-line descriptions and repeated "Remote" are gone.

Also 25 Nov (Daniel): the talent heading is now **"Grow with us."** ("Grow" in the accent),
replacing Sam's "Want to work with us?". It fits both a role and training and stays clearly for
individuals, beside the closing's "Want to partner with us?" for companies. Sam to see it.

Still waiting on Sam: the final revenue figure, the copy Loom, and the booking destination
(calendar link or email) for "Partner with us". Later: separate pages for Summit Institute,
Summit Sales (Sam as figurehead, his YouTube, VSLs) and Summit Pathways.

## 24 Nov 2026: stress test before Sam's preview

Daniel asked for a stress test before sending Sam the preview link
(https://summit-group-preview.vercel.app, a Vercel project deployed from a prebuilt `dist/`,
not from Git). Checked: 13 widths from 320 to 2560px, phones held sideways, keyboard order and
focus, rapid clicks, axe in every state (menus open, FAQ open, chips picked), reduced motion,
reduced transparency, forced colours, more contrast, no JavaScript, 200% text, and speed on a
slowed mid-range phone (LCP 0.5s, CLS 0, 60fps scrolling, 134 KB). Fixed:
- **"Start with a conversation" on arrival:** the headline waited until it was 15% inside the
  screen, so readers saw the lead under an empty gap and a sliver of a word. It now rises just
  before it arrives (`motion.ts`).
- **Pale box behind that headline (Daniel saw it, most likely in Safari):** for about a second
  after arriving, a lighter box sat round the heading. The section's glows were discs under
  `filter: blur(64px)`, and the rise restyled the words every frame, so Safari repainted the
  blur only inside the heading's rectangle. The glows are now radial gradients (16rem wider, so
  they fade over the same distance), and the rise is one transform string, run on the
  compositor. Not reproducible in Chrome here; check on an iPhone and in Safari.
- **Phone held sideways:** the menu ran off the bottom; it now scrolls inside itself.
- **Menus close when the page scrolls away** from them (`closeOnPageScroll` in `ui.ts`).
- **Heatmap** scrolled sideways from 721 to about 990px; tablets and small laptops now show the
  last 40 weeks (phones 20). It is no longer an empty keyboard stop.
- **Tap targets:** the phone logo link (22px) and footer links (34px) are 44px tall.
- **FAQ label** now matches the other sections (blue `.label`).
- **No JavaScript:** the phone menu button, which could do nothing, is hidden.
- Small phones: the tablet counters and the heatmap range note no longer break mid-phrase.
- Business links in the phone menu land with their illustration just under the header.

**Revenue block, later on 24 Nov (Daniel):** the "Estimate" tag is gone (the note still says the
figure is estimated). There is more room under the About statement (about 100px on desktop),
and on desktop the gauge leads again: 28rem across (the visual review had taken it to 21rem),
a 56px figure and a fuller pool of blue light. Tablets and phones keep their sizes.

**Revenue gauge builds up slower (Daniel, 24 Nov):** it now sweeps over 2.6s on an ease-in-out
curve (`Gauge` `duration` prop, `data-duration` in `gauge.ts`), instead of the 0.9s spring the
Summit Institute gauge keeps. The "+" waits until the count lands (`[data-counting]`).

**Client revenue is now a real estimate (Daniel, 24 Nov):** SSI's profile reports R12.8m+ in
commissions paid to its South African talent in the last 3 months; setters earn 7.5% of each
sale, so client sales came to R12.8m / 0.075 = R170.7m. Daniel asked for dollars: at R17.5 to the
dollar (the rate on 22 to 23 Nov) that is about $9.75m, shown as **$9.7M+** with an "Estimate"
tag. The note avoids "earn", "income" and "commission" (claims governance test). Still awaiting
sign-off (`signOffs.clientRevenueFigure`).

**Open:** the SSI profile says 350+ placements since June 2025; the site says 450+ (from the
16 Nov brand strategy review). Confirm which is current. The closing "Book a conversation" still
points at its own section until the booking link exists. Safari was not tested by machine (no
WebKit here); check the preview on an iPhone.

## 24 Nov 2026: visual review applied

Daniel shared another AI's 16-point visual review of the homepage (1512px desktop, 384px
phone). He saw it locally side by side with the old version, then approved all of it.
- **Hero:** the headline is a narrower, balanced block (`max-width: 20ch`,
  `text-wrap: balance`), smaller on phones (5 lines, not 6). The sentence under it is larger
  and darker (78% ink).
- **Tablet:** on phones it tilts from its top edge with a gentler tilt, so it shows in the
  first screen. Placed people carry no tile box, so the brief leads, and the brief title is
  larger. Phones show 5 people and a "+7 more" tile.
- **Header:** links 15px, and anchors land 2rem below the bar (`scroll-padding-top`).
- **About:** the gauge is 21rem (was 26rem) with a 42px figure. "Example figure until
  confirmed" is a tag above the label (`clientRevenue.flag`).
- **Businesses:** less empty space; on phones the copy sits right under its scene.
- **How we work:** steps are numbered 01 to 04, joined by a faint line on desktop, with 15px
  text at 74% ink. Heatmap labels are larger; phones show the last 20 weeks
  (`placements.phoneWeeks`) at a readable size, with no sideways scroll.
- **Map:** a larger South Africa pin with a blue halo, stronger links, bigger and darker tags.
- **Chips, toggle, FAQ:** a picked chip has blue text and a firm blue edge, still clear glass.
  The chosen toggle side is blue on solid white. The FAQ plus is larger and outlined.
- **Footer:** darker links and copyright line; taller tap rows on phones.
- **Rhythm and motion:** `--sec` is smaller. Reveals are quicker (0.55s, 16px). The About
  statement starts at 38% ink, not 14%, so it reads before it inks in.
- The booking placeholder note remains: it needs the real booking link.
- Tests: the revenue test now expects the smaller gauge and the tag. The glass test counted
  three solid blue buttons; since the phone menu's went, it expects two.

## 24 Nov 2026: phone menu

- The "Book a conversation" button at the foot of the phone menu is gone (Daniel). The menu
  holds only the three businesses and the section links. The hero and "Start with a
  conversation" carry the call to action. The small-screen menu test checks it stays out.

## 23 Nov 2026: Liquid Glass, to Apple's guidelines

Daniel sent a reel about Apple's Liquid Glass and asked for it on the header and all the
buttons. Then he asked for it to follow Apple's own guidance (WWDC25 "Meet Liquid Glass").
The material is `--glass-*` in `tokens.css`; the rules it follows:

**Glass is the navigation layer.** Apple keeps glass for the layer that floats over content.
- Glass: the header bar, the "Our businesses" fold-out and the phone menu panel.
- The header bar is transparent frosted glass at Daniel's request (`--glass-clear`,
  `--glass-blur-clear`). It is nearly clear and heavily frosted, so the page shows through
  and the links stay legible; the scroll edge effect softens what passes under it.
- The menus are lighter frosted glass than before, still milky enough to read a list over
  the hero.
- Regular variant only.
- Bigger glass reads thicker: the menus get more frost and deeper shadows than the bar.

**Buttons are transparent frosted glass (Daniel's call).** Apple keeps content controls plain
at rest. Daniel asked first for buttons that blend "as if they were frosted glass", then for
"transparent buttons, and they should be frosted glass".
- Covered: buttons, the Recruit / Develop / Manage chips, the Training / A role switch and
  the FAQ "+".
- At rest each is nearly clear glass (`--frost-*` in `tokens.css`): the page, grid or glow
  behind shows through, heavily frosted, inside a crisp bright edge and a hairline outline.
- **Exception:** "Book a conversation" stays the brand's solid electric blue with white
  text, at Daniel's request. Pressed, it thins to tinted glass at 90% electric, which keeps
  white at 4.6:1.
- A picked chip and an open FAQ question use clear glass with a breath of electric, a blue
  edge and a blue tick or ×.
- **Pressed,** they still behave like Liquid Glass:
  - A brighter glass skin comes in.
  - Light spreads from under the fingertip (`--gx`/`--gy`, and a registered `--glow` that
    grows).
  - The capsule flexes on a Motion spring exported as a CSS `linear()` curve
    (`--glass-flex`).
  - The switch knob swells into a clear glass lens.
- **Reduce Transparency:** solid buttons.

**Never glass on glass.**
- What sits on the bar uses fills: the selection is a light fill and the menu button a plain
  symbol.
- The selection lifts into a glass lens only while pressed (`data-lift`, set in `ui.ts`).

**Tint only the primary action.** "Book a conversation" is the one blue element. Selections
(a picked chip, an open FAQ question) use a navy fill.

**Lit rim.**
- The bar and the menus draw it as a true 1px ring (a masked pseudo-element), brightest where
  it meets the light.
- On the bar, the rim and sheen lean toward the mouse (`initGlassLight` in `ui.ts`). This is
  the web's stand-in for glass catching light as the device moves. `--glass-sheen` and
  `--glass-rim` are re-declared on `.pill`, because a custom property resolves its `var()`
  where it is declared.
- Small controls draw the rim with fine inner highlights.

**Menus materialize rather than fade:** the frost comes in with the opacity and scale.

**Scroll edge effect:** once the page scrolls, content passing under the header softly blurs
and fades, in place of a hard edge.

**Shapes:**
- Capsules for buttons, chips and the switch.
- Concentric corners in the menus (fold-out 22px with 14px items; phone sheet 28px with 20px
  items).
- The squircle clip fallback in `ui.ts` is gone.

**Accessibility settings:**
- Reduce Transparency: solid header, menus and buttons, with no frost; the ring becomes a hairline.
- Increase Contrast: solid glass with an ink border.
- Reduce Motion: no flex or swell. The light and colour changes stay.

**FAQ:** the "Book a conversation" button beside the FAQ is gone (Daniel, 23 Nov). The hero
and "Start with a conversation" hold the call to action. (The phone menu's button went on
24 Nov.)

**Refresh jump fixed (23 Nov):** clicking a header link or "Book a conversation" used to write
"#section" into the address. Safari (and Firefox) follow that hash on refresh, so a refresh
jumped back to the last section clicked instead of staying put.
- In-page links now scroll smoothly to their section without touching the address, and move
  focus there (`initInPageLinks` in `ui.ts`).
- A link that arrives with a hash (a shared /#faq), or a hash typed in the address bar, still
  lands on its section; the hash is then cleared.
- Refreshes keep the reader's place. Covered by three e2e tests.

**Client revenue block reworked (23 Nov).** Daniel said it didn't flow and wanted it to draw
attention to the figure and the gauge.
- The hairline above it, and the rule under the About section, are gone.
- The gauge is larger (26rem). The figure inside it is at display size, as large as the
  gauge's centre allows (48px).
- A soft pool of the brand's blue light sits behind the gauge.
- The label is set calmer than the statement, so the order reads statement, figure, label,
  note.
- Covered by an e2e test.

**Not done:**
- True light-bending refraction. It needs SVG backdrop filters, which Safari (so every iPhone)
  does not support.
- Glass flipping to dark over dark content. Nothing dark sits under the header for long.

## 22 Nov 2026 changes (Daniel's review)

- **Hero tablet simplified (latest).** Daniel asked for the tablet to leave a picture in
  the head of someone who doesn't know the business and only scrolls past.
  - **Gone:** the dashboard: its sidebar, breadcrumbs, Brief in / Shortlist / Placed switcher,
    Summit-Ready gauge, status cards and time-stamped activity log.
  - **The picture now:** you tell SGI the team you need, and SGI finds the people, gets them
    ready and manages them, as your one contact.
    - Left: the example brief in large type ("Grow an outbound sales team · 12 people ·
      Placed in days, not weeks"), then the three steps in plain words: Recruit, Develop and
      Manage, with their existing one-line descriptions.
    - Right: a team of 12 seats.
  - **On scroll:** as the tablet comes into view, the seats fill with people (Recruit), each
    gets a Summit-Ready tick (Develop), then the whole team is framed as one, with "SGI, your
    one point of contact" (Manage). The steps light up in step. It is tied to the scroll, so
    it plays at the reader's pace and rewinds on the way up. On screens too tall to scroll it
    through, it plays once when the tablet is in view.
  - **Reduced motion and no JavaScript:** the tablet shows the finished team at rest.
  - **Code:** the tablet is no longer interactive (no buttons). `initPanel` is gone from
    `ui.ts`; the story is in `motion.ts`.
  - **Copy:** `illustrations.panel` is trimmed to what is shown, with `readyLabel` added. The
    team of 12 is still an invented example and needs a yes before launch.
  - **Profiles (later the same night):** Daniel found the person icons too general, so each
    seat is now a small profile: an initials avatar in a brand tone, first name and surname
    initial, role and city. Empty seats read "Open role" with the role waiting to be filled.
    Placed seats show the person; Summit-Ready ones get a tick on the avatar. On phones the
    city is dropped and the role may wrap. **The 12 names, roles and cities are invented for
    the illustration** (`illustrations.panel.team`): first name and initial only, no photos.
    They need a yes before launch, or real Summit-Ready placements with their consent.
- **The last two sections now stand on type alone (latest).** Daniel removed the illustration
  beside each: the "Your brief" card next to "Start with a conversation." and the Summit-Ready
  journey card next to "Looking for training or a role?". He asked for each section's authority
  to come through in its own design. The direction came from a design panel run on Emil Kowalski's
  principles. Three directions were proposed: keynote, editorial and statement-and-answer. The
  build is statement-and-answer, with the keynote's promise line grafted on.
  - **Start with a conversation** is the page's finale: one centred column, like the hero
    that opens the page.
    - The headline is the largest type since the hero: `--t-finale`, 88px at 1440 and 40px on
      phones. It sets on two lines with "conversation." in the accent, as the hero accents
      "higher.". It rises once out of line masks, as the hero's promise does.
    - The lead now ends, in full ink, with "SGI stays your point of contact while the work goes
      on.". This is the one-point-of-contact promise the card used to carry in small print.
    - Under the Recruit / Develop / Manage chips, a line answers the picks: "Not sure yet? Book
      anyway and tell us on the call." until something is picked, then "Your brief: Recruit and
      Manage.".
    - Each chip's plus turns into a tick in one fixed slot, so the centred row never shifts.
    - One button follows. The three-step row ("Pick a time", "Tell us what you need", "One point
      of contact throughout") is gone: the lead now says the third step at display size, and the
      picker and button say the first two. It is easy to bring back if wanted.
    - The glows frame the column like stage lights, with a white lift behind the words.
  - **Looking for training or a role?** is a question and answer in type:
    - The heading runs the full width, at full h2 size.
    - The question and the Training / A role toggle sit on the left. The answer is set large
      on the right (About statement size), opening with the business's name in full ink.
    - The word chosen in the heading ("training" or "a role") turns blue, so the question
      records the answer.
    - Both answers share one cell, so switching never moves the page.
    - It is left-aligned and smaller than the finale on purpose: individuals are the second
      audience.
  - **Contrast:** small grey and blue text over the glows moved off `--muted` and `--accent-text`,
    which drop to about 4.2:1 and 3.9:1 on a full glow. It now uses 72 to 78% ink, and
    `--action-hover` for the talent link. Blue `--accent-text` is now only used at 30px and
    above, where 3:1 applies.
  - **Copy:**
    - Changed: `closing.heading` gains an accent marker; the words are unchanged.
    - Added: `closing.call.said` ("Your brief: {needs}.", the first sentence of the existing
      summary).
    - Removed: `closing.steps`, the card's `call.label`, `call.lead` and `call.brief`, and
      `talentNote.journeyLabel`, `journey` and `badge`. Summit-Ready is still explained in How
      we work and the FAQ.
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
  the brand glows (sky behind the answer, peach behind the question, the same `--glow-*`
  tokens as the closing), which fades into the page colour on every edge.
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
  closing section still carry the call to action. (The small-screen menu kept it until
  24 Nov.) The selected item is now a liquid-glass lens (after Apple's Liquid Glass tab bars). It
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
picker (question, Recruit / Develop / Manage with their one-line details, and the reply
line "Your brief: …" under them), the talent chooser
(question, options, answers), the heatmap captions, "See how we work",
`audiences.visuals` (supplier names, "One point of contact", the working-hours caption about
the UK and Europe), and every label in `illustrations` (the hero tablet's example brief and
team, scene labels). The panels are marked "Illustration" on the page, but their numbers (a
team of 12, 8 coaching sessions and so on) are invented examples and need a yes before launch.

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
