import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PROMISE = 'We recruit, develop and manage South African talent that takes your business higher.';
const CTA = 'Book a conversation';

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

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

  test('the hero call to action is clickable above the canvas', async ({ page }) => {
    const cta = page.locator('[data-funnel-waist]');
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-funnel-waist]') !== null,
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    );
    expect(hit).toBe(true);
    await expect(page.locator('[data-funnel-canvas]')).toHaveCSS('pointer-events', 'none');
    await cta.click();
    await expect(page).toHaveURL(/#book$/);
    await expect(page.locator('#book')).toBeInViewport();
  });

  test('shows the pre-launch notice instead of an invented booking link', async ({ page }) => {
    await expect(page.locator('[data-booking-pending]')).toBeVisible();
    const external = await page.$$eval('a[href^="http"], a[href^="mailto:"], a[href^="tel:"]', (els) => els.length);
    expect(external).toBe(0);
  });

  test('hero destinations link to the three business cards', async ({ page }) => {
    const names = ['Summit Institute', 'Summit Sales', 'Summit Pathways'];
    const links = page.getByRole('list', { name: 'Our three specialist businesses' }).getByRole('link');
    await expect(links).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const href = await links.nth(i).getAttribute('href');
      await expect(page.locator(href!)).toContainText(names[i]!);
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

  test('the funnel animates in view and pauses off-screen', async ({ page }) => {
    const hero = page.locator('[data-funnel]');
    await expect(hero).toHaveAttribute('data-funnel-state', 'animating');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(hero).toHaveAttribute('data-funnel-state', 'paused');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(hero).toHaveAttribute('data-funnel-state', 'animating');
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
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    expect(summary).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('renders a still frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-funnel]')).toHaveAttribute('data-funnel-state', 'static');
  });
});

test.describe('header navigation', () => {
  test('desktop: keyboard order runs logo, navigation, then the call to action', async ({ page }) => {
    await page.goto('/');
    test.skip(!isDesktop(page), 'inline navigation is desktop-only');
    const expected = ['Skip to main content', 'Summit Group International', 'About', 'Our businesses', 'How we work', 'Who we work with', CTA];
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
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'How we work' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    await toggle.click();
    await nav.getByRole('link', { name: 'Our businesses' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#businesses$/);
  });
});
