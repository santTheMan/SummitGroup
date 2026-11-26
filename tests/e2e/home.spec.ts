import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PROMISE = 'We recruit, develop and manage South African talent that takes your business higher.';
const CTA = 'Partner with us';

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/** A screen point on a map country's own shape (not a coastline gap, not its marker). */
const onCountry = (map: Locator, id: string) =>
  map.evaluate((el, id) => {
    // A flagged country is a <use> of its outline, in the camera's coordinates
    const country = el.querySelector<SVGGraphicsElement>(`.map-country[data-map-id="${id}"]`)!;
    const camera = el.querySelector<SVGGElement>('[data-map-camera]')!;
    const box = country.getBBox();
    for (let i = 1; i < 24; i++) {
      for (let j = 1; j < 24; j++) {
        const q = new DOMPoint(box.x + (box.width * i) / 24, box.y + (box.height * j) / 24);
        const p = q.matrixTransform(camera.getScreenCTM()!);
        if (document.elementFromPoint(p.x, p.y) === country) return { x: p.x, y: p.y };
      }
    }
    throw new Error(`no point on country ${id}`);
  }, id);

/** Waits for the hero entrance to finish, so nothing is mid-flight when a test clicks or audits. */
async function settle(page: Page) {
  await expect(page.locator('.device-wrap')).toHaveCSS('opacity', '1');
  await page.waitForTimeout(400);
}

test.describe('SGI home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the approved promise as the only h1', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(PROMISE);
    await expect(page).toHaveTitle(/Summit Group International/);
  });

  test('has one banner, main and contentinfo landmark and ordered headings', async ({ page }) => {
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    const levels = await page.$$eval('h1, h2, h3', (els) => els.map((el) => Number(el.tagName[1])));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  test('every in-page link points at an element that exists', async ({ page }) => {
    const missing = await page.$$eval('a[href^="#"]', (links) =>
      links
        .map((a) => a.getAttribute('href') ?? '')
        .filter((href) => href.length > 1 && !document.getElementById(href.slice(1))),
    );
    expect(missing).toEqual([]);
  });

  test('every primary button is the same call to action with the same destination', async ({ page }) => {
    const buttons = page.locator('a.button--primary');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveText(CTA);
      hrefs.add((await buttons.nth(i).getAttribute('href')) ?? '');
    }
    expect(hrefs.size).toBe(1);
    await expect(page.getByText(/get started/i)).toHaveCount(0);
  });

  test('the hero call to action leads to the booking section', async ({ page }) => {
    const cta = page.locator('.hero-cta');
    await settle(page);
    await cta.click();
    await expect(page.locator('#book')).toBeInViewport();
    // The address keeps no #book, so a refresh stays where the reader is
    await expect(page).toHaveURL(/\/$/);
  });

  test('a refresh keeps the reader where they were, even after clicking a section link', async ({ page }) => {
    await settle(page);
    const link = page.locator('.hero-cta');
    await link.click();
    await expect(page.locator('#book')).toBeInViewport();
    await expect(page).not.toHaveURL(/#/);
    // Scroll somewhere else, then refresh: the page must not jump back to #book
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForTimeout(1200);
    await expect(page.locator('#book')).not.toBeInViewport();
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - 1200)).toBeLessThan(80);
  });

  test('a link that arrives with a section hash lands there, then clears the hash', async ({ page }) => {
    // A fresh load, as when someone opens a shared link
    await page.goto('about:blank');
    await page.goto('/#faq');
    await expect(page.locator('#faq')).toBeInViewport();
    await expect(page).not.toHaveURL(/#faq/);
    // A hash typed into the address bar of the open page (a same-page hash change) lands and clears
    // too. The reader scrolls first, as anyone would; until then the browser keeps the page
    // pinned to the hash it opened on.
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      location.hash = 'how-we-work';
    });
    await expect(page.locator('#how-we-work')).toBeInViewport();
    await expect(page).not.toHaveURL(/#how-we-work/);
  });

  test('shows the pre-launch notice instead of an invented booking link', async ({ page }) => {
    await expect(page.locator('[data-booking-pending]')).toBeVisible();
    const external = await page.$$eval('a[href^="http"], a[href^="mailto:"], a[href^="tel:"]', (els) => els.length);
    expect(external).toBe(0);
  });

  test('every business link lands on that business', async ({ page }) => {
    const names = { institute: 'Summit Institute', sales: 'Summit Sales', pathways: 'Summit Pathways' };
    for (const [id, name] of Object.entries(names)) {
      await expect(page.locator(`#business-${id}`)).toContainText(name);
      await expect(page.locator(`#biz-panel a[href="#business-${id}"]`)).toContainText(name);
    }
  });

  test('the hero shows SGI as the one point of contact, naming no specialist business', async ({ page }) => {
    await expect(page.locator('.hero')).not.toContainText(/Summit (Institute|Sales|Pathways)|Institute|Pathways/);
    await expect(page.locator('[data-panel]')).toContainText('Your contact: SGI');
  });

  test('the hero tablet tells one story: a team of 12 filled, made Summit-Ready and managed as one', async ({ page }) => {
    const story = page.locator('[data-team-story]');
    await expect(story.locator('[data-seat]')).toHaveCount(12);
    await expect(story.locator('[data-step]')).toHaveText([/Recruit/, /Develop/, /Manage/]);
    // The old dashboard is gone: no sidebar, stage switcher, gauge or activity log.
    await expect(story.locator('.side, .seg, [data-gauge], .recent, button')).toHaveCount(0);

    // Scrolled past, the whole team is in, Summit-Ready and framed as one, every step done.
    await page.locator('#about').evaluate((el) => el.scrollIntoView());
    await expect(story).toHaveAttribute('data-managed', '');
    await expect(story.locator('[data-seat][data-s="2"]')).toHaveCount(12);
    await expect(story.locator('[data-step][data-state="done"]')).toHaveCount(3);
    await expect(story.locator('[data-count="ready"]')).toHaveText('12');
    await expect(story.getByText('SGI, your one point of contact')).toBeVisible();

    // Each seat is a profile: initials, name and role (invented for the illustration, no photos).
    const lead = story.locator('[data-seat]').first();
    await expect(lead.locator('.seat-initials')).toHaveText('LK');
    await expect(lead.locator('.seat-name b')).toBeVisible();
    await expect(lead.locator('.seat-name b')).toHaveText('Lerato K.');
    await expect(lead.locator('.seat-role')).toHaveText('Team lead');
    await expect(story.locator('[data-seat] img')).toHaveCount(0);

    // Where the story is tied to the scroll, it rewinds on the way back up, to open roles.
    if (isDesktop(page)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(story.locator('[data-seat][data-s="0"]')).toHaveCount(12);
      await expect(story).not.toHaveAttribute('data-managed', '');
      await expect(lead.locator('.seat-name i')).toHaveText('Open role');
      await expect(lead.locator('.seat-name b')).toHaveCSS('opacity', '0');
    }
  });

  test('the hero panel stands alone, with no floating cards beside it', async ({ page }) => {
    await expect(page.locator('.hero [data-float], .hero .floats')).toHaveCount(0);
    await expect(page.locator('.hero')).not.toContainText(/New brief|Update from SGI|Shortlist ready/);
  });

  test('section labels are plain text, with no pulsing dot', async ({ page }) => {
    const labels = page.locator('p.label');
    // About, Our businesses, How we work, Who we work with, and FAQ (24 Nov: same label as the rest)
    await expect(labels).toHaveCount(5);
    const marks = await labels.evaluateAll((els) =>
      els.map((el) => {
        const dot = getComputedStyle(el, '::before');
        return { content: dot.content, animation: dot.animationName };
      }),
    );
    for (const mark of marks) {
      expect(mark.content).toBe('none');
      expect(mark.animation).toBe('none');
    }
  });

  test('the About section has no 450+ / 1 / 3 figures row', async ({ page }) => {
    const about = page.locator('#about');
    await expect(about.locator('[data-stats], .stats, [data-count]')).toHaveCount(0);
    await expect(about).not.toContainText(/placements since June 2025|point of contact for every client|specialist businesses in one group/);
  });

  test('the client revenue gauge sweeps up and counts to its figure', async ({ page }) => {
    // Sam, 24 Nov 2026: managed clients, $600K to $1M a month
    const gauge = page.getByRole('img', {
      name: /Revenue generated for the clients we manage, every month: \$600 thousand plus a month/,
    });
    await gauge.scrollIntoViewIfNeeded();
    await expect(gauge.locator('[data-gauge-count]')).toHaveText('600K', { timeout: 6000 });
    await expect(gauge.locator('.revenue-value')).toHaveText('$600K+');
    // 60% full: $600K of the $1M top of Sam's range
    await expect(gauge.locator('path[data-on]')).toHaveCount(24);
    await expect(page.locator('.revenue')).toContainText('not SGI revenue');
  });

  test('the revenue figure leads: a large gauge and figure, on a pool of light, with no rules', async ({ page }) => {
    const revenue = page.locator('.revenue');
    await revenue.scrollIntoViewIfNeeded();
    const look = await page.evaluate(() => {
      const px = (sel: string, prop: string) => parseFloat(getComputedStyle(document.querySelector(sel)!).getPropertyValue(prop));
      return {
        figure: px('.revenue-value', 'font-size'),
        label: px('.revenue-label', 'font-size'),
        statement: px('.statement-text', 'font-size'),
        gaugeWidth: document.querySelector('.revenue-gauge')!.getBoundingClientRect().width,
        pool: getComputedStyle(document.querySelector('.revenue')!, '::before').backgroundImage,
        sectionRule: px('#about', 'border-bottom-width'),
        hairlines: document.querySelectorAll('.revenue-rule').length,
      };
    });
    // The figure is the largest thing in the block; the label sits calmer than the statement
    expect(look.figure).toBeGreaterThan(look.label);
    expect(look.label).toBeLessThanOrEqual(look.statement);
    // Review, 24 Nov: a little smaller (21rem), so it sits with its explanation
    expect(look.gaugeWidth).toBeGreaterThanOrEqual(isDesktop(page) ? 320 : 260);
    // No tag above the label (Daniel removed "Estimate", 24 Nov); the note still says it is estimated
    await expect(revenue.locator('.revenue-flag')).toHaveCount(0);
    await expect(revenue.locator('.revenue-note')).toContainText('between $600K and $1M a month');
    expect(look.pool).toContain('radial-gradient');
    expect(look.sectionRule).toBe(0);
    expect(look.hairlines).toBe(0);
  });

  test('who we work with: three audiences as text beside the map, no illustrations or booking links', async ({ page }) => {
    const section = page.locator('#who-we-work-with');
    await expect(section.locator('.card')).toHaveCount(3);
    await expect(section.locator('[data-merge], [data-tz], [data-pipe], .floating')).toHaveCount(0);
    await expect(section.locator('.card-title')).toHaveText([
      'South African corporates and banks',
      'International clients',
      'Partners and funders',
    ]);
    await expect(section.getByRole('link', { name: CTA })).toHaveCount(0);
    await expect(section.locator('.card--1')).toContainText('We work 24/7, in line with your needs.');
    await expect(section).not.toContainText(/shared|Johannesburg|working hours/i);
  });

  test('the choropleth fills South Africa and Sam\u2019s six client markets', async ({ page }) => {
    const map = page.locator('[data-map]');
    await expect(
      map.getByRole('img', { name: /South Africa.*United States.*United Kingdom.*Germany.*Switzerland.*Malta.*Japan/ }),
    ).toBeVisible();
    // bklit's Choropleth (Click to Zoom example): every country is a filled outline over a
    // 10° graticule, with no labels on the map; the legend names every market
    expect(await map.locator('.map-country').count()).toBeGreaterThan(150);
    await expect(map.locator('path.map-graticule')).toHaveCount(1);
    await expect(map.locator('.map-legend')).toContainText('United States, United Kingdom, Germany, Switzerland, Malta, Japan');
    await expect(map).not.toContainText('Australia');
    await expect(map.locator('.map-country--home')).toHaveAttribute('data-map-id', '710');
    for (const id of ['840', '826', '276', '756', '392']) {
      await expect(map.locator(`.map-country--client[data-map-id="${id}"]`)).toHaveCount(1);
    }
    // Daniel, 25 Nov: only the markets carry flags, each cropped to its own country
    await expect(map.locator('.map-flag')).toHaveCount(6);
    for (const id of ['710', '840', '826', '276', '756', '392']) {
      await expect(map.locator(`.map-flag[data-map-id="${id}"] use[href="#flag-art-${id}"]`).first()).toBeAttached();
    }
    // The US mainland and Alaska each get a whole flag
    await expect(map.locator('.map-flag[data-map-id="840"] use[href="#flag-art-840"]')).toHaveCount(2);
    // A marker on every market; Malta, too small for the outlines, wears its flag on its marker
    await expect(map.locator('.map-marker')).toHaveCount(7);
    await expect(map.locator('.map-country[data-map-id="470"]')).toHaveCount(0);
    await expect(map.locator('.map-marker[data-map-id="470"] use[href="#flag-art-470"]')).toBeAttached();
    // The legend shows each market's flag
    await expect(map.locator('.map-legend .map-chip')).toHaveCount(7);
    // A link from South Africa to each client market, and the map fades into the page
    await expect(map.locator('path.map-link')).toHaveCount(6);
    expect(await map.locator('.map-clip').evaluate((el) => getComputedStyle(el).maskImage)).toMatch(/linear-gradient/);
  });

  test('the placements heatmap adds up to the approved 450', async ({ page }) => {
    const total = await page.$$eval('[data-hm] i[data-n]', (cells) =>
      cells.reduce((sum, c) => sum + Number((c as HTMLElement).dataset.n), 0),
    );
    expect(total).toBe(450);
    await expect(page.getByRole('img', { name: /Placements since June 2025/ })).toBeVisible();
  });

  test('the business stage follows the scroll both ways', async ({ page }) => {
    test.skip(!isDesktop(page), 'the sticky stage is desktop-only');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    const stage = page.locator('[data-stage]');
    const at = (id: string) =>
      page.evaluate((sel) => {
        const el = document.querySelector(sel)!;
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + 100);
      }, `#business-${id}`);
    await at('pathways');
    await expect(stage).toHaveAttribute('data-scene', '2');
    await at('sales');
    await expect(stage).toHaveAttribute('data-scene', '1');
    await at('institute');
    await expect(stage).toHaveAttribute('data-scene', '0');
  });

  test('the business illustrations are one set of still, readable cards', async ({ page }) => {
    // Daniel, 25 Nov: redrawn as one set. The same card for each business, type no
    // smaller than 12px, nothing that looks pressable, and no looping motion.
    const desktop = isDesktop(page);
    const scope = desktop ? '[data-stage]' : '.feat-inline';
    await page.locator(desktop ? '#business-sales' : '#business-sales .feat-inline').scrollIntoViewIfNeeded();
    const cards = page.locator(`${scope} .card`);
    await expect(cards).toHaveCount(3);
    for (const name of ['Summit Institute', 'Summit Sales', 'Summit Pathways']) {
      await expect(page.locator(`${scope} .card-name`, { hasText: name })).toHaveCount(1);
    }
    const look = await page.evaluate((sel) => {
      const root = [...document.querySelectorAll(sel)];
      const texts = root.flatMap((r) => [...r.querySelectorAll('.card *')]).filter(
        (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()),
      );
      return {
        minFont: Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize))),
        loops: root.flatMap((r) => r.getAnimations({ subtree: true })).filter((a) => a.effect?.getTiming().iterations === Infinity).length,
        pressable: root.flatMap((r) => [...r.querySelectorAll('button, a, .setup-btn, .chip')]).length,
      };
    }, scope);
    expect(look.minFont).toBeGreaterThanOrEqual(12);
    expect(look.loops).toBe(0);
    expect(look.pressable).toBe(0);
  });

  test('marks previews noindex by default', async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('has no horizontal overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('logs no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.reload();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('the skip link moves focus to the main content', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('passes axe WCAG 2.2 AA checks', async ({ page }) => {
    await settle(page);
    // The About statement's visible words are an aria-hidden copy that inks in from faint
    // as it scrolls into reading position (the full sentence is in the accessible text).
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .exclude('[data-statement] > [aria-hidden="true"]')
      .analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    expect(summary).toEqual([]);
  });
});

test.describe('interactions (reduced motion, so nothing moves under the pointer)', () => {
  test.use({ reducedMotion: 'reduce' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('with reduced motion the hero tablet shows the finished team at rest', async ({ page }) => {
    const story = page.locator('[data-team-story]');
    await expect(story).toHaveAttribute('data-managed', '');
    await expect(story.locator('[data-seat][data-s="2"]')).toHaveCount(12);
    await expect(story.locator('[data-step][data-state="done"]')).toHaveCount(3);
    await expect(story.locator('[data-count="people"]')).toHaveText('12');
    await expect(story.getByRole('button')).toHaveCount(0);
  });

  test('the talent chooser points to the right business', async ({ page }) => {
    const card = page.locator('[data-talent]');
    // "A role" comes first (Sam, 24 Nov 2026), then Training
    await expect(card.getByRole('button', { name: 'A role' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.getByRole('link', { name: 'Meet Summit Pathways' })).toBeVisible();
    await card.getByRole('button', { name: 'Training' }).click();
    await expect(card.getByRole('button', { name: 'Training' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.getByRole('link', { name: 'Meet Summit Institute' })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Meet Summit Pathways' })).toBeHidden();
  });

  test('grow with us: the roles SGI hires for, and the answer swaps in place', async ({ page }) => {
    const card = page.locator('[data-talent]');
    // Daniel, 25 Nov: "Grow with us." (was "Want to work with us?")
    await expect(card.locator('#talent-title')).toHaveText('Grow with us.');
    await expect(card.locator('#talent-title .accent')).toHaveText('Grow');
    // Daniel, 25 Nov: titles only, "all remote" said once
    await expect(card.locator('.role-title')).toHaveText([
      'Sales development representative',
      'Account executive',
      'Sales manager',
      'Recruiter',
      'Client relationship manager',
    ]);
    await expect(card.locator('.roles-k')).toHaveText('Roles we hire for, all remote');
    await expect(card.locator('.role-level, .role-detail, .role-where')).toHaveCount(0);
    const before = await card.locator('.answers').boundingBox();
    await card.getByRole('button', { name: 'Training' }).click();
    await expect(card.locator('.roles')).toBeHidden();
    const after = await card.locator('.answers').boundingBox();
    // Both answers share one cell, so switching never moves the page below.
    expect(Math.round(after!.height)).toBe(Math.round(before!.height));
  });

  test('both sections stand on type alone, and the finale states SGI as the one contact', async ({ page }) => {
    await expect(page.locator('#book .call, #book .cta-grid, .op-sec .journey')).toHaveCount(0);
    await expect(page.locator('#book').getByText('SGI stays your point of contact while the work goes on.')).toBeVisible();
    await expect(page.locator('#book-title .accent')).toHaveText('partner');
    const size = (id: string) => page.locator(id).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    // The finale headline is the page's closing word: never smaller than the hero's.
    expect(await size('#book-title')).toBeGreaterThanOrEqual(await size('#hero-title'));
    expect(await size('#book-title')).toBeGreaterThan(await size('#talent-title'));
  });

  test('the conversation picker builds a brief with SGI as the one contact', async ({ page }) => {
    const convo = page.locator('[data-convo]');
    await expect(convo.getByText('Not sure yet? Get in touch anyway, and we will shape the brief with you.')).toBeVisible();
    const row = () => convo.locator('[data-need]').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    const before = await row();
    await convo.getByRole('button', { name: 'Recruit' }).click();
    await convo.getByRole('button', { name: 'Manage' }).click();
    await expect(convo.getByRole('button', { name: 'Recruit' })).toHaveAttribute('aria-pressed', 'true');
    await expect(convo).toHaveAttribute('data-on', 'recruit manage');
    await expect(convo.locator('[data-convo-summary]')).toHaveText(
      'Your brief: Recruit and Manage. SGI is your one point of contact.',
    );
    // The visible reply under the needs answers the picks, and pressing never shifts the centred row.
    await expect(convo.locator('[data-convo-said]')).toHaveText('Your brief: Recruit and Manage.');
    expect(await row()).toEqual(before);
    // The client deals with SGI only: no specialist business is named in this section.
    await expect(convo).not.toContainText(/Summit (Institute|Sales|Pathways)/);
    await convo.getByRole('button', { name: 'Recruit' }).click();
    await expect(convo).toHaveAttribute('data-on', 'manage');
  });

  test('Start with a conversation sits on an open wash that fades into the page, not a boxed card', async ({ page }) => {
    const section = page.locator('#book');
    await expect(section.locator('[data-cta-card], .cta-card')).toHaveCount(0);
    const wash = section.locator('.cta-wash');
    await expect(wash).toHaveCount(1);
    const look = await wash.evaluate((el) => {
      const cs = getComputedStyle(el);
      const sec = el.parentElement!.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      return {
        mask: cs.maskImage || cs.getPropertyValue('-webkit-mask-image'),
        radius: getComputedStyle(el.parentElement!).borderTopLeftRadius,
        fullWidth: Math.abs(box.width - document.documentElement.clientWidth) < 2 && Math.abs(box.height - sec.height) < 2,
      };
    });
    // Transparent at both ends of the vertical mask: the page runs in and out with no edge.
    expect(look.mask).toMatch(/^linear-gradient\(rgba\(0, 0, 0, 0\)/);
    expect(look.mask).toMatch(/transparent\)$|rgba\(0, 0, 0, 0\)\)$/);
    expect(look.radius).toBe('0px');
    expect(look.fullWidth).toBe(true);
  });

  test('pointing at a country names it in a tooltip and fades the others', async ({ page }) => {
    test.skip(!isDesktop(page), 'hover is for mouse screens');
    const map = page.locator('[data-map]');
    await map.scrollIntoViewIfNeeded();
    // Daniel, 25 Nov: another country (Brazil) shows no name and fades nothing
    const brazil = await onCountry(map, '076');
    await page.mouse.move(brazil.x, brazil.y, { steps: 3 });
    await page.waitForTimeout(300);
    await expect(map).not.toHaveAttribute('data-hover', /.*/);
    await expect(map.locator('[data-map-tip]')).not.toHaveAttribute('data-on', /.*/);
    const at = await onCountry(map, '392');
    await page.mouse.move(at.x - 40, at.y, { steps: 2 });
    await page.mouse.move(at.x, at.y, { steps: 4 });
    await expect(map).toHaveAttribute('data-hover', '');
    await expect(map.locator('[data-map-tip]')).toHaveAttribute('data-on', '');
    await expect(map.locator('[data-map-tip]')).toHaveText(/Japan\s*Clients\s*Tokyo/);
    // bklit's fadedOpacity: the others fade to 0.4
    await expect(map.locator('.map-flag[data-map-id="392"]')).toHaveCSS('opacity', '1');
    await expect(map.locator('.map-flag[data-map-id="840"]')).toHaveCSS('opacity', '0.4');
    await expect(map.locator('path.map-country:not([data-map-id])').first()).toHaveCSS('opacity', '0.4');
    // Japan's link stays bright, the others quieten
    await expect(map.locator('path.map-link[data-map-id="392"]')).toHaveCSS('opacity', '0.9');
    await expect(map.locator('path.map-link[data-map-id="840"]')).toHaveCSS('opacity', '0.25');
    await page.mouse.move(5, 5);
    await expect(map).not.toHaveAttribute('data-hover', /.*/);
    await expect(map.locator('[data-map-tip]')).not.toHaveAttribute('data-on', /.*/);
  });

  test('only SGI\u2019s markets zoom: another country does nothing, or flies back out', async ({ page }) => {
    const map = page.locator('[data-map]');
    await map.scrollIntoViewIfNeeded();
    const camera = map.locator('[data-map-camera]');
    const press = (p: { x: number; y: number }) =>
      isDesktop(page) ? page.mouse.click(p.x, p.y) : page.touchscreen.tap(p.x, p.y);
    // Brazil is not a market: it doesn't look clickable, and a click does nothing
    await expect(map.locator('path.map-country[data-map-id="076"]')).toHaveCSS('cursor', 'auto');
    await press(await onCountry(map, '076'));
    await expect(map).not.toHaveAttribute('data-focus', /.*/);
    await expect(camera).not.toHaveAttribute('transform', /.*/);
    // South Africa is: it zooms in
    await expect(map.locator('.map-country[data-map-id="710"]')).toHaveCSS('cursor', 'pointer');
    const sa = (await map.locator('.map-marker[data-map-id="710"] .map-marker-hit').boundingBox())!;
    await press({ x: sa.x + sa.width / 2, y: sa.y + sa.height / 2 });
    await expect(map).toHaveAttribute('data-focus', '');
    // Zoomed in, a click on a neighbouring country (not a market) flies back out
    const neighbour = await map.evaluate((el) => {
      const r = el.querySelector('.map-stage')!.getBoundingClientRect();
      for (let i = 2; i < 30; i++) {
        for (let j = 2; j < 30; j++) {
          const x = r.left + (r.width * i) / 30;
          const y = r.top + (r.height * j) / 30;
          if (document.elementFromPoint(x, y)?.matches('path.map-country:not([data-kind])')) return { x, y };
        }
      }
      throw new Error('no other country in view');
    });
    await press(neighbour);
    await expect(map).not.toHaveAttribute('data-focus', /.*/);
    await expect(camera).not.toHaveAttribute('transform', /.*/);
  });

  test('clicking a country flies the camera to it and tilts the map; Escape flies back', async ({ page }) => {
    test.skip(!isDesktop(page), 'pointer clicks on a mouse screen');
    const map = page.locator('[data-map]');
    await map.scrollIntoViewIfNeeded();
    const camera = map.locator('[data-map-camera]');
    const plane = map.locator('[data-map-plane]');
    const at = await onCountry(map, '392');
    await page.mouse.move(at.x, at.y);
    await expect(map.locator('[data-map-tip]')).toHaveAttribute('data-on', '');
    await page.mouse.click(at.x, at.y);
    await expect(map).toHaveAttribute('data-focus', '');
    // Daniel, 25 Nov: no name tag once a country is clicked, even with the pointer on it
    await expect(map.locator('[data-map-tip]')).not.toHaveAttribute('data-on', /.*/);
    await page.mouse.move(at.x + 1, at.y + 1);
    await expect(map.locator('[data-map-tip]')).not.toHaveAttribute('data-on', /.*/);
    // Japan is east of centre: the camera zooms in and the plane looks from the east
    await expect(camera).toHaveAttribute('transform', /scale\(6\.0000\)/);
    await expect(plane).toHaveAttribute('style', /rotateX\(24deg\) rotateY\(-18deg\)/);
    await expect(map.locator('path.map-graticule')).toHaveCSS('opacity', '0');
    await page.keyboard.press('Escape');
    await expect(map).not.toHaveAttribute('data-focus', /.*/);
    await expect(camera).not.toHaveAttribute('transform', /.*/);
    await expect(plane).not.toHaveAttribute('style', /rotate/);
    // A marker flies to its point (4×)
    const malta = map.locator('.map-marker[data-map-id="470"] .map-marker-core');
    const box = (await malta.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(camera).toHaveAttribute('transform', /scale\(4\.0000\)/);
    await page.keyboard.press('Escape');
    await expect(camera).not.toHaveAttribute('transform', /.*/);
  });

  test('on phones the example brief is a compact illustration that fits on one screen', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 720, 'phones only');
    const device = page.locator('.device');
    const box = (await device.boundingBox())!;
    const screen = page.viewportSize()!;
    // Daniel, 25 Nov: smaller on phones (it was 366 × 849 on a 390 × 844 screen)
    expect(box.width).toBeLessThanOrEqual(320);
    expect(box.height).toBeLessThan(screen.height * 0.75);
    // Recruit, Develop and Manage share one row, and the ticks sit inside their circles
    const tops = await page.locator('.tab-steps li').evaluateAll((ls) => ls.map((l) => Math.round(l.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    const inside = await page.locator('.st-n').first().evaluate((n) => {
      const c = n.getBoundingClientRect();
      const t = n.querySelector('.st-tick')!.getBoundingClientRect();
      return t.top >= c.top && t.bottom <= c.bottom;
    });
    expect(inside).toBe(true);
  });

  test('on touch screens, a tap on each crowded European market zooms to that market, with no name tag', async ({ page }) => {
    test.skip(isDesktop(page), 'taps are for touch screens');
    const map = page.locator('[data-map]');
    await map.scrollIntoViewIfNeeded();
    // Their tap areas overlap on a phone: the market nearest the tap must win
    for (const id of ['826', '276', '756', '470']) {
      const box = (await map.locator(`.map-marker[data-map-id="${id}"] .map-marker-hit`).boundingBox())!;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await expect(map.locator('[data-focused]')).toHaveAttribute('data-map-id', id);
      await expect(map.locator('[data-map-tip]')).not.toHaveAttribute('data-on', /.*/);
      await page.keyboard.press('Escape');
      await expect(map).not.toHaveAttribute('data-focus', /.*/);
    }
  });

  test('FAQ rows open and close', async ({ page }) => {
    const row = page.getByRole('button', { name: 'What does Summit-Ready mean?' });
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    await row.click();
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('trained, tested and supported before they reach you').first()).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows everything in place, with nothing hidden for an entrance', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', 'on');
    await expect(page.locator('.hero-word').first()).toHaveCSS('transform', 'none');
    await expect(page.locator('.device-wrap')).toHaveCSS('opacity', '1');
    await expect(page.locator('.revenue .revenue-value')).toHaveText('$600K+');
    await expect(page.locator('[data-team-story] [data-seat][data-s="2"]')).toHaveCount(12);
    // No floating: the illustrations hold still.
    await page.locator('#businesses').scrollIntoViewIfNeeded();
    const moving = await page.$$eval('.floating', (els) =>
      els.some((el) =>
        el.getAnimations().some((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity),
      ),
    );
    expect(moving).toBe(false);
  });
});

test.describe('header navigation', () => {
  test('the header is a pill centred at the top of the screen', async ({ page }) => {
    await page.goto('/');
    const pill = await page.locator('[data-nav] .pill').boundingBox();
    const width = page.viewportSize()!.width;
    expect(Math.abs(pill!.x + pill!.width / 2 - width / 2)).toBeLessThan(2);
    expect(pill!.y).toBeLessThan(24);
  });

  test('the FAQ closes the page, and the header\u2019s water drop only marks it once it is reached', async ({ page }) => {
    await page.goto('/');
    const order = await page.$$eval('main > section', (els) => els.map((el) => el.id || el.className.split(' ')[0]));
    expect(order.slice(-3)).toEqual(['book', 'op-sec', 'faq']);
    // The FAQ carries no booking button: the hero and the conversation section hold it
    await expect(page.locator('#faq .button, #faq a[href^="#book"]')).toHaveCount(0);
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const faq = page.locator('[data-nav-item="faq"]');
    await page.locator('#book').evaluate((el) => el.scrollIntoView());
    await expect(page.locator('[data-nav-item][data-selected]')).toHaveCount(0);
    await page.locator('#faq').evaluate((el) => el.scrollIntoView());
    await expect(faq).toHaveAttribute('data-selected', '');
  });

  test('glass refracts at its rim in Chromium: one filter per size, the frost lightened', async ({ page }) => {
    // Daniel, 25 Nov: real glass bends light at its edge (refract.ts, after the reel he sent)
    await page.goto('/');
    // The card on show: the desktop stage's, or the one inline on smaller screens
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLElement>('.scene .card')].some((c) => c.offsetWidth && c.style.getPropertyValue('--refract')),
    );
    const r = await page.evaluate(() => {
      const filters = [...document.querySelectorAll('svg filter[id^="lg-"]')];
      const f = filters[0];
      return {
        on: document.documentElement.hasAttribute('data-refract'),
        filters: filters.length,
        steps: f ? [...f.children].map((c) => c.tagName) : [],
        pill: getComputedStyle(document.querySelector('.pill')!, '::before').backdropFilter,
        card: getComputedStyle([...document.querySelectorAll<HTMLElement>('.scene .card')].find((c) => c.offsetWidth)!).backdropFilter,
        menu: getComputedStyle(document.querySelector('[data-biz-panel]')!).backdropFilter,
      };
    });
    expect(r.on).toBe(true);
    expect(r.filters).toBeGreaterThanOrEqual(2);
    // The rim map, then red, green and blue each displaced by its own amount, recombined
    expect(r.steps.filter((t) => t === 'feDisplacementMap')).toHaveLength(3);
    expect(r.steps[0]).toBe('feImage');
    expect(r.pill).toMatch(/^url\("#lg-\d+"\) blur\(7px\)/);
    expect(r.card).toMatch(/^url\("#lg-\d+"\) blur\(12px\)/);
    // Menus that materialize keep their frost: refraction is not animatable
    expect(r.menu).not.toContain('url(');
  });

  test('glass: a Liquid Glass header, frosted glass buttons, and no glass on glass', async ({ page }) => {
    await page.goto('/');
    const g = await page.evaluate(() => {
      const filter = (el: Element | null, pseudo?: string) => {
        if (!el) return 'missing';
        const cs = getComputedStyle(el, pseudo);
        return cs.backdropFilter || cs.getPropertyValue('-webkit-backdrop-filter') || 'none';
      };
      const capsule = (el: Element) => {
        const h = el.getBoundingClientRect().height;
        return h === 0 || parseFloat(getComputedStyle(el).borderTopLeftRadius) >= h / 2 - 1;
      };
      return {
        bar: filter(document.querySelector('.pill'), '::before'),
        barRing: getComputedStyle(document.querySelector('.pill')!, '::after').backgroundImage,
        water: filter(document.querySelector('[data-nav-water]')),
        burger: filter(document.querySelector('[data-burger]')),
        buttons: [...document.querySelectorAll('.button:not(.button--primary)')].map((b) => `${filter(b)}|${filter(b, '::before')}`),
        primary: [...document.querySelectorAll('.button--primary')].map((b) => `${filter(b)}|${getComputedStyle(b).backgroundColor}`),
        chips: [...document.querySelectorAll('[data-need]')].map((c) => filter(c)),
        capsules: [...document.querySelectorAll('.button, [data-need], .toggle, .toggle-knob')].every(capsule),
      };
    });
    // The navigation layer is the glass, with a lit rim drawn as a ring
    expect(g.bar).toContain('blur');
    expect(g.barRing).toContain('linear-gradient');
    // Never glass on glass: the water on the bar is drawn, not another glass layer
    expect(g.water).toBe('none');
    expect(g.burger).toBe('none');
    // Buttons and chips are transparent glass at rest: the page behind them shows through.
    // The frosted buttons are LiquidButton's (26 Nov): in Chromium the backdrop is warped by
    // #liquid-glass; elsewhere they keep a frosted blur.
    expect(g.buttons.length).toBeGreaterThan(0);
    for (const b of g.buttons) expect(b).toMatch(/^(url\("#liquid-glass"\)|blur\(\d+px\).*)\|none$/);
    for (const c of g.chips) expect(c).toMatch(/^(url\("#liquid-glass"\)|blur\(\d+px\))/);
    // ...except "Partner with us", which stays solid electric blue
    // The hero's and the closing's (the phone menu's went on 24 Nov)
    expect(g.primary.length).toBeGreaterThanOrEqual(2);
    for (const p of g.primary) expect(p).toBe('none|rgb(34, 100, 210)');
    // Capsules, as Apple's controls are
    expect(g.capsules).toBe(true);

    // The fold-out materializes: its frost comes in as it opens
    if (isDesktop(page)) {
      const panel = page.locator('[data-biz-panel]');
      expect(await panel.evaluate((el) => getComputedStyle(el).backdropFilter)).toMatch(/blur\(0px\)/);
      await page.locator('[data-biz-trigger]').click();
      await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).backdropFilter)).toMatch(/blur\(2\dpx\)/);
    }
  });

  test('desktop: pressed, controls lift into Liquid Glass and settle back', async ({ page }) => {
    await page.goto('/');
    test.skip(!isDesktop(page), 'pointer press');
    await page.waitForTimeout(1600);

    // The primary button: light gathers where the pointer lands, the glass skin comes in, it flexes
    const cta = page.locator('.hero .button--primary');
    const box = (await cta.boundingBox())!;
    await page.mouse.move(box.x + 24, box.y + box.height / 2);
    await page.mouse.down();
    expect(await cta.evaluate((el) => el.style.getPropertyValue('--gx'))).toBe('24px');
    await expect.poll(() => cta.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^matrix\(1\.0[3-6]/);
    await expect.poll(() => cta.evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('1');
    await expect.poll(() => cta.evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('1');
    await page.mouse.move(5, 400); // release away, so the press does not follow the link
    await page.mouse.up();
    await expect.poll(() => cta.evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('0');
    await expect.poll(() => cta.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1)/);

    // A header link, tapped, plays its icon's little scene (Nimbus "Waterline")
    await page.locator('[data-nav-item="how-we-work"]').click();
    await expect(page.locator('[data-nav-item="how-we-work"] .nv-ico')).toHaveAttribute('data-fx', 'pop');
  });

  test('the header carries no booking button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nav] .pill > a.button, [data-nav] .nav-links a.button')).toHaveCount(0);
  });

  test('desktop: a water drop marks the section being read and moves to the link clicked', async ({ page }) => {
    // Daniel, 26 Nov: Nimbus UI's "Waterline" liquid navbar (liquid-nav.ts)
    await page.goto('/');
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const pill = page.locator('[data-nav] .pill');
    // Drawn in WebGL (a CSS drop stands in without it), on a canvas 14px past the bar all round
    await expect(pill).toHaveAttribute('data-water', 'gl');
    const [c, p] = await Promise.all([page.locator('[data-nav-water]').boundingBox(), pill.boundingBox()]);
    expect(Math.round(c!.width - p!.width)).toBe(28);
    // Every link carries an icon
    await expect(page.locator('[data-nav-item] .nv-ico svg')).toHaveCount(4);
    // At the top no link applies, so there is no drop
    await expect(page.locator('[data-nav-item][data-selected]')).toHaveCount(0);

    await page.locator('#how-we-work').evaluate((el) => el.scrollIntoView());
    await expect(page.locator('[data-nav-item="how-we-work"]')).toHaveAttribute('data-selected', '');

    // A click sends the drop to that link at once, and its icon plays its scene
    const faq = page.locator('[data-nav-item="faq"]');
    await faq.click();
    await expect(faq).toHaveAttribute('data-selected', '');
    await expect(faq.locator('.nv-ico')).toHaveAttribute('data-fx', 'wave');

    // Opening "Our businesses" brings the drop to it
    await page.locator('[data-biz-trigger]').click();
    await expect(page.locator('[data-biz-trigger]')).toHaveAttribute('data-selected', '');
  });

  test('desktop: keyboard order runs logo, then navigation', async ({ page }) => {
    await page.goto('/');
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const expected = ['Skip to main content', 'Summit Group International', 'Our businesses', 'How we work', 'Who we work with', 'FAQ'];
    for (const name of expected) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.querySelector('img')?.getAttribute('alt') ?? el?.textContent?.trim() ?? '';
      });
      expect(label).toBe(name);
    }
  });

  test('small screens: the menu opens, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/');
    test.skip(isDesktop(page), 'menu toggle is for small screens');
    const toggle = page.getByRole('button', { name: 'Menu' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const nav = page.getByRole('navigation', { name: 'Site menu' });
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'How we work' })).toBeVisible();
    // No booking button in the phone menu (Daniel, 24 Nov 2026)
    await expect(nav.getByRole('link', { name: /partner with us/i })).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    await toggle.click();
    await nav.getByRole('link', { name: 'How we work' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#how-we-work')).toBeInViewport();
    await expect(page).not.toHaveURL(/#/);
  });
});
