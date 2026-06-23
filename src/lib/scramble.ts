const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*#";

/**
 * Deterministic scramble frame. First `revealCount` chars are shown verbatim;
 * remaining non-space chars are replaced by a charset char chosen from
 * (frame + index). Spaces and length are preserved. No randomness so it is
 * pure and testable.
 */
export function scrambleText(
  target: string,
  revealCount: number,
  frame: number,
  charset: string = DEFAULT_CHARS
): string {
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (i < revealCount || ch === " ") {
      out += ch;
    } else {
      const idx = (frame + i * 7) % charset.length;
      out += charset[idx];
    }
  }
  return out;
}
