import { brandAssetStatus } from '../content/brand-assets.ts';
import { proof, signOffs } from '../content/site.ts';
import { checkUrl } from './urls.ts';

export interface ReleaseIssue {
  id: string;
  message: string;
}

export type ReleaseEnv = Record<string, string | undefined>;

/**
 * Everything that must be resolved before the site is published.
 * Used by `npm run check:release` and covered by unit tests.
 */
export function getReleaseIssues(env: ReleaseEnv): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];

  const booking = checkUrl(env.PUBLIC_BOOKING_URL, { allowMailto: true });
  if (booking.state === 'missing') {
    issues.push({
      id: 'booking-destination',
      message:
        'PUBLIC_BOOKING_URL is not set. Every "Book a conversation" button needs an approved destination (booking page, contact page or address).',
    });
  } else if (booking.state === 'invalid') {
    issues.push({
      id: 'booking-destination',
      message: `PUBLIC_BOOKING_URL "${booking.value}" is not a valid https: or mailto: URL.`,
    });
  }

  const site = checkUrl(env.PUBLIC_SITE_URL);
  if (site.state !== 'ok') {
    issues.push({
      id: 'site-url',
      message: 'PUBLIC_SITE_URL is not set to the production https: origin (needed for canonical and social-preview URLs).',
    });
  }

  if (env.PUBLIC_ALLOW_INDEXING !== 'true') {
    issues.push({
      id: 'indexing',
      message: 'PUBLIC_ALLOW_INDEXING is not "true", so the build is marked noindex. Set it only for the approved launch build.',
    });
  }

  if (brandAssetStatus !== 'final') {
    issues.push({
      id: 'logo-files',
      message:
        'The logo and favicons use interim PNGs from the 18 Nov pack. Swap in the Brand Pack v1.0 SVGs (see src/content/brand-assets.ts).',
    });
  }

  const labels: Record<keyof typeof signOffs, string> = {
    homepageCopy: 'Homepage copy (including drafted supporting sentences) is not signed off.',
    pathwaysName: '"Summit Pathways" is a working name and is not confirmed.',
    placementsFigure: 'The wording and scope of "450+ placements since June 2025" are not confirmed.',
    legalDetails: 'The registered company name and privacy/legal requirements are not confirmed.',
    clientRevenueFigure:
      'The client revenue gauge shows bklit’s example figure ($428,000, 66% fill). Confirm the real amount and period.',
  };
  for (const [key, approved] of Object.entries(signOffs) as [keyof typeof signOffs, boolean][]) {
    if (!approved) issues.push({ id: `sign-off:${key}`, message: labels[key] });
  }

  return issues;
}

/** Proof points that are cleared for display. */
export function publishedProof() {
  return proof.filter((point) => point.status === 'approved');
}
