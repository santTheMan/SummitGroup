export interface Word {
  text: string;
  accent: boolean;
  /** True when no space separates this word from the one before ("*SGI*," → "SGI" + ","). */
  glue: boolean;
}

/**
 * Splits copy into words, marking those inside `*asterisks*` as accented.
 * "One *relationship* only" -> One / relationship (accent) / only.
 */
export function words(copy: string): Word[] {
  const out: Word[] = [];
  let space = true;
  copy.split(/(\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    const accent = part.startsWith('*') && part.endsWith('*');
    const text = accent ? part.slice(1, -1) : part;
    for (const token of text.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        space = true;
        continue;
      }
      out.push({ text: token, accent, glue: !space && out.length > 0 });
      space = false;
    }
  });
  return out;
}

/** Copy with the accent markers removed. */
export function plain(copy: string): string {
  return copy.replace(/\*/g, '');
}

/** "450+" -> { prefix: '', value: 450, suffix: '+' }; null when there is no number. */
export function splitNumber(value: string): { prefix: string; value: number; suffix: string } | null {
  const match = /^(\D*)(\d+)(\D*)$/.exec(value);
  if (!match) return null;
  return { prefix: match[1] ?? '', value: Number(match[2]), suffix: match[3] ?? '' };
}
