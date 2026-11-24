
interface TokenPayload {
  sub?: string;
  exp?: number;
}

export function decodeTokenPayload(
  token: string | null,
): TokenPayload | null {
  if (!token) return null;

  try {
    const part = token.split(".")[1];

    if (!part) return null;

    const base64 = part
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      base64 +
      "=".repeat((4 - (base64.length % 4)) % 4);

    return JSON.parse(atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

export function getUsernameFromToken(
  token: string | null,
): string | null {
  const username = decodeTokenPayload(token)?.sub;

  return typeof username === "string"
    ? username
    : null;
}

export function isTokenExpired(
  token: string | null,
  nowMs: number = Date.now(),
): boolean {
  const payload = decodeTokenPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= nowMs;
}
