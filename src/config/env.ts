import { bookingUrlFrom, checkUrl } from '../lib/urls.ts';

const env = import.meta.env;

/** Approved booking destination, or null until it is configured. */
export const bookingUrl = bookingUrlFrom(env.PUBLIC_BOOKING_URL);

/** Production origin, or null until it is configured. */
export const siteUrl = (() => {
  const result = checkUrl(env.PUBLIC_SITE_URL);
  return result.state === 'ok' ? result.url : null;
})();

/** Search indexing stays off unless the launch build opts in explicitly. */
export const allowIndexing = env.PUBLIC_ALLOW_INDEXING === 'true';

/**
 * Where every "Book a conversation" button points. Until an approved booking
 * destination exists, buttons scroll to the closing section instead of
 * linking to an invented address.
 */
export const ctaHref = bookingUrl ?? '#book';
