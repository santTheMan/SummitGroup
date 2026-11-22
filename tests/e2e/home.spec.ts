import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PROMISE = 'We recruit, develop and manage South African talent that takes your business higher.';
const CTA = 'Book a conversation';

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

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
    await expect(page).toHaveURL(/#book$/);
    await expect(page.locator('#book')).toBeInViewport();
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
    await expect(labels).toHaveCount(4);
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
    const gauge = page.getByRole('img', { name: /Revenue generated for clients in the past 3 months: \$428,000/ });
    await gauge.scrollIntoViewIfNeeded();
    await expect(gauge.locator('[data-gauge-count]')).toHaveText('$428,000', { timeout: 6000 });
    await expect(gauge.locator('path[data-on]')).toHaveCount(26);
    await expect(page.locator('.revenue')).toContainText('not SGI revenue');
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

  test('the dot map marks South Africa and the three client markets', async ({ page }) => {
    const map = page.locator('[data-map]');
    await expect(map.getByRole('img', { name: /South Africa.*United States.*United Kingdom.*Australia/ })).toBeVisible();
    const pins = map.locator('.map-pin');
    await expect(pins).toHaveCount(4);
    for (const name of ['South Africa', 'United States', 'United Kingdom', 'Australia']) {
      await expect(pins.filter({ hasText: name })).toHaveCount(1);
    }
    // Every marked country has dots of its own, and South Africa links to each client market
    for (const id of ['710', '840', '826', '036']) {
      expect(await map.locator(`path.map-dots[data-map-id="${id}"]`).getAttribute('d')).toMatch(/h0/);
    }
    await expect(map.locator('path.map-link')).toHaveCount(3);
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

  test('the illustrations float while on screen and rest off screen', async ({ page }) => {
    const playing = (sel: string) =>
      page.$eval(sel, (el) => el.getAnimations().some((a) => a.playState === 'running'));
    // The business scenes: the sticky stage on desktop, the inline scenes on smaller screens
    const desktop = isDesktop(page);
    const floats = page.locator(desktop ? '[data-stage]' : '.feat-inline[data-floats]').first();
    const floating = desktop ? '[data-stage] .rep-card.floating' : '.feat-inline[data-floats] .floating';
    await expect(floats).toHaveAttribute('data-float-paused', '');
    expect(await playing(floating)).toBe(false);
    await (desktop ? page.locator('#business-sales') : floats).scrollIntoViewIfNeeded();
    await expect(floats).not.toHaveAttribute('data-float-paused', /.*/);
    expect(await playing(floating)).toBe(true);
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
    await expect(card.getByRole('link', { name: 'Meet Summit Institute' })).toBeVisible();
    await card.getByRole('button', { name: 'A role' }).click();
    await expect(card.getByRole('button', { name: 'A role' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.getByRole('link', { name: 'Meet Summit Pathways' })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Meet Summit Institute' })).toBeHidden();
  });

  test('the talent heading records the choice, and the answer swaps in place', async ({ page }) => {
    const card = page.locator('[data-talent]');
    const accent = 'rgb(34, 100, 210)';
    const training = card.locator('[data-word="training"]');
    const role = card.locator('[data-word="role"]');
    await expect(training).toHaveText('training');
    await expect(role).toHaveText('a role');
    await expect(training).toHaveCSS('color', accent);
    const before = await card.locator('.answers').boundingBox();
    await card.getByRole('button', { name: 'A role' }).click();
    await expect(role).toHaveCSS('color', accent);
    await expect(training).not.toHaveCSS('color', accent);
    const after = await card.locator('.answers').boundingBox();
    // Both answers share one cell, so switching never moves the page below.
    expect(Math.round(after!.height)).toBe(Math.round(before!.height));
  });

  test('both sections stand on type alone, and the finale states SGI as the one contact', async ({ page }) => {
    await expect(page.locator('#book .call, #book .cta-grid, .op-sec .journey')).toHaveCount(0);
    await expect(page.locator('#book').getByText('SGI stays your point of contact while the work goes on.')).toBeVisible();
    await expect(page.locator('#book-title .accent')).toHaveText('conversation.');
    const size = (id: string) => page.locator(id).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    // The finale headline is the page's closing word: never smaller than the hero's.
    expect(await size('#book-title')).toBeGreaterThanOrEqual(await size('#hero-title'));
    expect(await size('#book-title')).toBeGreaterThan(await size('#talent-title'));
  });

  test('the conversation picker builds a brief with SGI as the one contact', async ({ page }) => {
    const convo = page.locator('[data-convo]');
    await expect(convo.getByText('Not sure yet? Book anyway and tell us on the call.')).toBeVisible();
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

  test('pointing at a country label quietens the other marked countries', async ({ page }) => {
    test.skip(!isDesktop(page), 'hover is for mouse screens');
    const map = page.locator('[data-map]');
    await map.scrollIntoViewIfNeeded();
    await map.locator('.map-pin[data-map-id="036"]').hover();
    await expect(map).toHaveAttribute('data-focus', '');
    await expect(map.locator('path.map-dots[data-map-id="036"]')).toHaveCSS('opacity', '1');
    await expect(map.locator('path.map-dots[data-map-id="840"]')).toHaveCSS('opacity', '0.35');
    await page.mouse.move(5, 5);
    await expect(map).not.toHaveAttribute('data-focus', /.*/);
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
    await expect(page.locator('.revenue [data-gauge-count]')).toHaveText('$428,000');
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

  test('the FAQ closes the page, and the header lens only marks it once it is reached', async ({ page }) => {
    await page.goto('/');
    const order = await page.$$eval('main > section', (els) => els.map((el) => el.id || el.className.split(' ')[0]));
    expect(order.slice(-3)).toEqual(['book', 'op-sec', 'faq']);
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const faq = page.locator('[data-nav-item="faq"]');
    await page.locator('#book').evaluate((el) => el.scrollIntoView());
    await expect(page.locator('[data-nav-item][data-selected]')).toHaveCount(0);
    await page.locator('#faq').evaluate((el) => el.scrollIntoView());
    await expect(faq).toHaveAttribute('data-selected', '');
  });

  test('the header carries no booking button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nav] .pill > a.button, [data-nav] .nav-links a.button')).toHaveCount(0);
  });

  test('desktop: a liquid-glass lens marks the section being read and follows the pointer', async ({ page }) => {
    await page.goto('/');
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const glass = page.locator('[data-nav-glass]');
    await expect(glass).toHaveCSS('opacity', '0');

    await page.locator('#how-we-work').evaluate((el) => el.scrollIntoView());
    const how = page.locator('[data-nav-item="how-we-work"]');
    await expect(how).toHaveAttribute('data-selected', '');
    await expect(glass).toHaveCSS('opacity', '1');
    await expect
      .poll(async () => {
        const [g, l] = await Promise.all([glass.boundingBox(), how.boundingBox()]);
        return Math.round(Math.abs(g!.x - l!.x) + Math.abs(g!.width - l!.width));
      })
      .toBeLessThan(2);

    const faq = page.locator('[data-nav-item="faq"]');
    await faq.hover();
    await expect
      .poll(async () => {
        const [g, l] = await Promise.all([glass.boundingBox(), faq.boundingBox()]);
        return Math.round(Math.abs(g!.x - l!.x));
      })
      .toBeLessThan(2);
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

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    await toggle.click();
    await nav.getByRole('link', { name: 'How we work' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#how-we-work$/);
  });
});
