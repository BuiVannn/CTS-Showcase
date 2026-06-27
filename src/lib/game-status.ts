export type EditIntent = "draft" | "pending" | "keep";

/**
 * Status of a game after an owner edits it.
 * - published: metadata-only edit stays published (live); a NEW build → pending (re-moderation).
 * - draft/rejected/pending: honour the submitted intent (submit → pending, save-draft → draft, keep → unchanged).
 */
export function nextStatusOnEdit(current: string, submitted: EditIntent, hasNewBuild: boolean): string {
  if (current === "published") return hasNewBuild ? "pending" : "published";
  if (submitted === "draft") return "draft";
  if (submitted === "pending") return "pending";
  return current; // "keep"
}
