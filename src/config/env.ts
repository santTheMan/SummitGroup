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
 * A booking link may carry a `{needs}` placeholder (for example a Calendly
 * prefill such as `?a1={needs}`). The closing section fills it with what the
 * visitor picked; everywhere else it is left empty.
 */
const NEEDS_TOKEN = /\{needs\}|%7Bneeds%7D/gi;
export const bookingTemplate = bookingUrl && /\{needs\}|%7Bneeds%7D/i.test(bookingUrl) ? bookingUrl : null;

/**
 * Where every "Book a conversation" button points. Until an approved booking
 * destination exists, buttons scroll to the closing section instead of
 * linking to an invented address.
 */
export const ctaHref = bookingUrl ? bookingUrl.replace(NEEDS_TOKEN, '') : '#book';
