/**
 * Convert the LaTeX delimiters models emit (\[ \] for display, \( \) for inline)
 * to the $$…$$ / $…$ syntax remark-math understands. Function replacers keep
 * "$" from being treated as a replacement token.
 */
export function normalizeMath(input: string): string {
  return input
    .replace(/\\\[/g, () => "$$")
    .replace(/\\\]/g, () => "$$")
    .replace(/\\\(/g, () => "$")
    .replace(/\\\)/g, () => "$");
}
