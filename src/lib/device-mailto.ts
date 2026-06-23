/** Build a `mailto:` href whose subject is "<prefix> <appName>" (URL-encoded). */
export function deviceMailto(email: string, subjectPrefix: string, appName: string): string {
  const subject = `${subjectPrefix} ${appName}`.trim();
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
