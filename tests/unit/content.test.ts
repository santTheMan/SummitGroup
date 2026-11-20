import { describe, expect, it } from 'vitest';
import * as site from '../../src/content/site.ts';
import { publishedProof } from '../../src/lib/release.ts';

const APPROVED_PROMISE = 'We recruit, develop and manage South African talent that takes your business higher.';

/** Every string that can appear on the page (pending proof and internal notes excluded). */
function publishedStrings(): string[] {
  const out: string[] = [];
  const walk = (value: unknown, key = ''): void => {
    if (key === 'source' || key === 'status' || key === 'id' || key === 'accent') return;
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach((item) => walk(item));
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, k);
    }
  };
  const { proof: _proof, signOffs: _signOffs, ...rest } = site;
  walk(rest);
  walk(publishedProof());
  return out;
}

describe('approved copy', () => {
  it('uses the approved 13-word promise exactly', () => {
    expect(site.hero.headline).toBe(APPROVED_PROMISE);
    const words = site.hero.headline.split(/\s+/).length;
    expect(words).toBe(13);
    expect(words).toBeLessThanOrEqual(14);
  });

  it('names the three specialist businesses with their approved roles, in order', () => {
    expect(site.businesses.map(({ name, role }) => [name, role])).toEqual([
      ['Summit Institute', 'Develops skills'],
      ['Summit Sales', 'Manages and coaches sales teams'],
      ['Summit Pathways', 'Recruits and places talent'],
    ]);
  });

  it('maps each business to its palette colour', () => {
    expect(site.businesses.map((b) => b.accent)).toEqual(['deep', 'electric', 'sky']);
  });

  it('has one primary call to action', () => {
    expect(site.cta.label).toBe('Book a conversation');
    const text = publishedStrings().join('\n');
    expect(text).not.toMatch(/get started/i);
  });

  it('describes Summit-Ready as the standard', () => {
    const text = publishedStrings().join('\n');
    expect(text).toContain('trained, tested and supported before they reach you');
  });
});

describe('claims governance', () => {
  const banned: [RegExp, string][] = [
    [/350\+/, 'outdated placement figure (corrected to 450+)'],
    [/R\s?12[.,]8\s?m/i, 'talent-facing commissions statistic'],
    [/\$\s?1[.,]5\s?m/i, 'client result pending verified wording'],
    [/high[- ]ticket/i, 'sales-floor jargon'],
    [/\bsetters?\b/i, 'sales-floor jargon'],
    [/\bclosers?\b/i, 'sales-floor jargon'],
    [/guarantee/i, 'guarantees of results'],
    [/\b(largest|biggest|#1|number one|best)\b/i, 'unsupported superlatives'],
    [/B-?BBEE|certified|certification|accredited/i, 'unverified registration or certification claims'],
    [/\b\d+\+?\s*(events|attendees)\b/i, 'unconfirmed event or attendee counts'],
    [/\b(earn|income|salary|commission)/i, 'income promises'],
    [/calendly|@|\+27|\bwww\./i, 'unverified contact details'],
  ];

  const text = publishedStrings().join('\n');
  for (const [pattern, reason] of banned) {
    it(`publishes no ${reason}`, () => {
      expect(text).not.toMatch(pattern);
    });
  }

  it('publishes only approved proof points', () => {
    const published = publishedProof();
    expect(published.every((p) => p.status === 'approved')).toBe(true);
    expect(published.map((p) => p.value)).toEqual(['450+', '1', '3']);
    expect(published.find((p) => p.value === '450+')?.label).toBe('placements since June 2025');
  });

  it('keeps the $1.5m client result unpublished until its wording is verified', () => {
    const result = site.proof.find((p) => p.id === 'client-result');
    expect(result?.status).toBe('pending');
    expect(result?.label).toMatch(/not SGI revenue/i);
  });
});
