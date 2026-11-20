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

  test('the hero gauge sweeps up to its value', async ({ page }) => {
    const gauge = page.locator('[data-panel]').getByRole('meter', { name: 'Summit-Ready' });
    await expect(gauge).toHaveAttribute('aria-valuenow', '75', { timeout: 6000 });
    await expect(gauge.locator('[data-gauge-count]')).toHaveText('9');
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
    const cards = page.locator('#who-we-work-with .cards');
    await expect(cards).toHaveAttribute('data-float-paused', '');
    expect(await playing('#who-we-work-with .tz.floating')).toBe(false);
    await cards.scrollIntoViewIfNeeded();
    await expect(cards).not.toHaveAttribute('data-float-paused', /.*/);
    expect(await playing('#who-we-work-with .tz.floating')).toBe(true);
    if (isDesktop(page)) {
      await page.locator('#business-sales').scrollIntoViewIfNeeded();
      await expect(page.locator('[data-stage]')).not.toHaveAttribute('data-float-paused', /.*/);
      expect(await playing('[data-stage] .rep-card.floating')).toBe(true);
    }
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

  test('the brief panel steps through the stages and spotlights part of the brief', async ({ page }) => {
    const panel = page.locator('[data-panel]');
    const gauge = panel.getByRole('meter', { name: 'Summit-Ready' });
    await panel.getByRole('button', { name: 'Placed', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Placed', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(gauge).toHaveAttribute('aria-valuetext', '12 of 12 people Summit-Ready');
    await expect(gauge).toHaveAttribute('aria-valuenow', '100');

    const manage = panel.locator('.acc[data-focus="manage"]');
    await manage.click();
    await expect(manage).toHaveAttribute('aria-pressed', 'true');
    await expect(panel).toHaveAttribute('data-spot', 'manage');
    await manage.click();
    await expect(panel).not.toHaveAttribute('data-spot', /.+/);
  });

  test('the corporates card flips between three suppliers and one relationship', async ({ page }) => {
    const merge = page.locator('[data-merge]');
    await expect(merge).toHaveAttribute('data-state', 'after');
    await merge.getByRole('button', { name: 'Without SGI' }).click();
    await expect(merge).toHaveAttribute('data-state', 'before');
    await expect(merge.getByRole('button', { name: 'Without SGI' })).toHaveAttribute('aria-pressed', 'true');
    await merge.getByRole('button', { name: 'With SGI' }).click();
    await expect(merge).toHaveAttribute('data-state', 'after');
  });

  test('the talent chooser points to the right business', async ({ page }) => {
    const card = page.locator('[data-talent]');
    await expect(card.getByRole('link', { name: 'Meet Summit Institute' })).toBeVisible();
    await card.getByRole('button', { name: 'A role' }).click();
    await expect(card.getByRole('button', { name: 'A role' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.getByRole('link', { name: 'Meet Summit Pathways' })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Meet Summit Institute' })).toBeHidden();
  });

  test('the conversation picker builds a brief with SGI as the one contact', async ({ page }) => {
    const convo = page.locator('[data-convo]');
    await expect(convo.getByText('Not sure yet? Book anyway and tell us on the call.')).toBeVisible();
    await convo.getByRole('button', { name: 'Recruit' }).click();
    await convo.getByRole('button', { name: 'Manage' }).click();
    await expect(convo.getByRole('button', { name: 'Recruit' })).toHaveAttribute('aria-pressed', 'true');
    await expect(convo).toHaveAttribute('data-on', 'recruit manage');
    await expect(convo.locator('[data-convo-summary]')).toHaveText(
      'Your brief: Recruit and Manage. SGI is your one point of contact.',
    );
    // The client deals with SGI only: no specialist business is named in this section.
    await expect(convo).not.toContainText(/Summit (Institute|Sales|Pathways)/);
    await convo.getByRole('button', { name: 'Recruit' }).click();
    await expect(convo).toHaveAttribute('data-on', 'manage');
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
    await expect(page.locator('[data-count]').first()).toHaveText('450+');
    await expect(page.locator('.dash [data-gauge]')).toHaveAttribute('aria-valuenow', '75');
    // No floating: the illustrations hold still.
    await page.locator('#who-we-work-with .cards').scrollIntoViewIfNeeded();
    const moving = await page.$$eval('.floating', (els) =>
      els.some((el) =>
        el.getAnimations().some((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity),
      ),
    );
    expect(moving).toBe(false);
  });
});

test.describe('header navigation', () => {
  test('desktop: keyboard order runs logo, navigation, then the call to action', async ({ page }) => {
    await page.goto('/');
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const expected = ['Skip to main content', 'Summit Group International', 'Our businesses', 'How we work', 'Who we work with', 'FAQ', CTA];
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
