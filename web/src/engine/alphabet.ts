/**
 * Modern Enigma 96 Alphabet Definition
 * 
 * Index 0: ' ' (SPACE)
 * Index 1..94: ASCII 33..126 ('!' to '~')
 * Index 95: '\n' (ENTER / Newline)
 */

export const ALPHABET_CHARS: readonly string[] = (() => {
  const chars: string[] = [' '];
  for (let i = 33; i <= 126; i++) {
    chars.push(String.fromCharCode(i));
  }
  chars.push('\n');
  return Object.freeze(chars);
})();

export const ALPHABET_SIZE = 96;

/**
 * Fast O(1) character-to-index lookup using ASCII code boundaries
 */
export function charToIndex(ch: string): number {
  if (!ch || ch.length !== 1) return -1;
  const code = ch.charCodeAt(0);
  if (code === 32) return 0;   // Space -> 0
  if (code === 10) return 95;  // Line feed '\n' -> 95
  if (code >= 33 && code <= 126) return code - 32; // '!' (33) -> 1 ... '~' (126) -> 94
  return -1;
}

/**
 * Normalizes any numeric index safely into [0, 95], guarding against NaN/Infinity.
 */
export function normalizeMod96(index: number, fallback = 0): number {
  if (typeof index !== 'number' || !Number.isFinite(index)) {
    return fallback;
  }
  const intVal = Math.trunc(index);
  return ((intVal % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
}

/**
 * Fast O(1) index-to-character lookup
 */
export function indexToChar(index: number): string {
  const norm = normalizeMod96(index);
  return ALPHABET_CHARS[norm] ?? '';
}

export function formatGlyph(index: number): string {
  const norm = normalizeMod96(index);
  if (norm === 0) return '[Space]';
  if (norm === 95) return '[Enter]';
  return ALPHABET_CHARS[norm] ?? '?';
}

export function sanitizeInput(text: string): string {
  if (typeof text !== 'string' || !text) return '';
  // Normalize CRLF and CR to LF
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (charToIndex(ch) !== -1) {
      result += ch;
    }
  }
  return result;
}
