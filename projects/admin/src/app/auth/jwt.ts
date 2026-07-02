/**
 * Decodes the `sub` claim from a JWT for DISPLAY ONLY. It does not verify the signature — trusting
 * a token is the backend gate's responsibility; the admin UI only reads the subject to show who is
 * signed in. Returns `null` for anything that is not a well-formed token with a string `sub`.
 */
export function decodeJwtSubject(token: string): string | null {
  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }
  try {
    const claims = JSON.parse(base64UrlDecode(segments[1])) as { sub?: unknown };
    return typeof claims.sub === 'string' ? claims.sub : null;
  } catch {
    return null;
  }
}

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
}
