/** True iff `email` is in the comma-separated `allowlist` (case-insensitive, trimmed). */
export function isAdminEmail(
  email: string | null | undefined,
  allowlist: string | undefined
): boolean {
  if (!email || !allowlist) return false;
  const set = allowlist
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return set.includes(email.trim().toLowerCase());
}

/** The Authentik self-registration (enrollment) URL, with a sensible default. */
export function resolveEnrollUrl(envValue: string | undefined): string {
  return envValue && envValue.length > 0
    ? envValue
    : "https://auth.ctslab.net/if/flow/default-enrollment-flow/";
}
