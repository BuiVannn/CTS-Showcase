export interface CountParts {
  /** numeric target, or null when the value has no leading digits */
  target: number | null;
  /** zero-pad width to preserve (only when the original was zero-padded, e.g. "05") */
  pad: number;
  /** trailing non-numeric suffix to re-append (e.g. "+") */
  suffix: string;
  /** the original value, returned verbatim when target is null */
  raw: string;
}

export function parseCountValue(value: string): CountParts {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return { target: null, pad: 0, suffix: "", raw: value };
  const digits = match[1];
  const pad = digits.length > 1 && digits.startsWith("0") ? digits.length : 0;
  return { target: parseInt(digits, 10), pad, suffix: match[2] ?? "", raw: value };
}

export function formatCount(n: number, pad: number, suffix: string): string {
  return String(Math.round(n)).padStart(pad, "0") + suffix;
}
