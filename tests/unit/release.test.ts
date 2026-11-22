import { describe, expect, it } from 'vitest';
import { getReleaseIssues } from '../../src/lib/release.ts';
import { bookingUrlFrom, checkUrl } from '../../src/lib/urls.ts';

const ids = (env: Record<string, string | undefined>) => getReleaseIssues(env).map((issue) => issue.id);

describe('checkUrl', () => {
  it('accepts https URLs', () => {
    expect(checkUrl('https://example.com/book')).toEqual({ state: 'ok', url: 'https://example.com/book' });
  });

  it('treats blank values as missing', () => {
    expect(checkUrl(undefined)).toEqual({ state: 'missing' });
    expect(checkUrl('   ')).toEqual({ state: 'missing' });
  });

  it('rejects insecure or script URLs', () => {
    expect(checkUrl('http://example.com').state).toBe('invalid');
    expect(checkUrl('javascript:alert(1)').state).toBe('invalid');
    expect(checkUrl('not a url').state).toBe('invalid');
  });

  it('accepts mailto only where allowed', () => {
    expect(checkUrl('mailto:hello@example.com').state).toBe('invalid');
    expect(checkUrl('mailto:hello@example.com', { allowMailto: true }).state).toBe('ok');
    expect(bookingUrlFrom('mailto:hello@example.com')).toBe('mailto:hello@example.com');
    expect(bookingUrlFrom('http://example.com')).toBeNull();
  });
});

describe('getReleaseIssues', () => {
  it('blocks release while the booking destination, origin and indexing are unset', () => {
    expect(ids({})).toEqual(expect.arrayContaining(['booking-destination', 'site-url', 'indexing']));
  });

  it('reports an invalid booking URL distinctly', () => {
    const issue = getReleaseIssues({ PUBLIC_BOOKING_URL: 'http://insecure.example' }).find(
      (i) => i.id === 'booking-destination',
    );
    expect(issue?.message).toMatch(/not a valid/);
  });

  it('clears the configuration items once a launch environment is supplied', () => {
    const launch = ids({
      PUBLIC_BOOKING_URL: 'https://example.com/book',
      PUBLIC_SITE_URL: 'https://example.com',
      PUBLIC_ALLOW_INDEXING: 'true',
    });
    expect(launch).not.toContain('booking-destination');
    expect(launch).not.toContain('site-url');
    expect(launch).not.toContain('indexing');
  });

  it('keeps the interim logo files and open sign-offs on the list', () => {
    expect(ids({})).toEqual(
      expect.arrayContaining([
        'logo-files',
        'sign-off:homepageCopy',
        'sign-off:pathwaysName',
        'sign-off:placementsFigure',
        'sign-off:legalDetails',
        'sign-off:clientRevenueFigure',
      ]),
    );
  });
});
