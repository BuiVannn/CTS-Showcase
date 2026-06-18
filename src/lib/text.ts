/** Split a string into words, trimming and collapsing whitespace. */
export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter((w) => w.length > 0);
}
