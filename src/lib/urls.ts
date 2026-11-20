export type UrlCheck =
  | { state: 'missing' }
  | { state: 'invalid'; value: string }
  | { state: 'ok'; url: string };

/**
 * Validates a configured URL. Only https: is accepted (plus mailto: when
 * `allowMailto` is set) so a typo can never ship as a broken or insecure link.
 */
export function checkUrl(value: string | undefined, { allowMailto = false } = {}): UrlCheck {
  const trimmed = value?.trim();
  if (!trimmed) return { state: 'missing' };
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'https:' || (allowMailto && url.protocol === 'mailto:')) {
      return { state: 'ok', url: url.toString() };
    }
  } catch {
    // fall through to invalid
  }
  return { state: 'invalid', value: trimmed };
}

export function bookingUrlFrom(value: string | undefined): string | null {
  const result = checkUrl(value, { allowMailto: true });
  return result.state === 'ok' ? result.url : null;
}
