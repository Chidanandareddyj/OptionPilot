export type BearerHeader = { present: false } | { present: true; token: string };

// `Authorization: Bearer` is the bearer path even when the token is empty or
// invalid. Callers must not fall back to cookies once this returns present.
export function readBearerHeader(header: string | null): BearerHeader {
  if (header === null) return { present: false };
  const trimmed = header.trim();
  if (!/^Bearer\b/i.test(trimmed)) return { present: false };
  const match = /^Bearer\s+(\S.*)$/i.exec(trimmed);
  return { present: true, token: match?.[1]?.trim() ?? "" };
}
