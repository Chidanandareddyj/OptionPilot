import { validateEmail } from "@/lib/auth/validation";

/** The website's name field stops at 32 characters, so the app does too. */
export const NAME_MAX_LENGTH = 32;

/** The first two letters of the name, in capitals (design 56 shows "CH" for Chidananda). Falls back to the email. */
export function initials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  return (Array.from(source).slice(0, 2).join("") || "?").toUpperCase();
}

export function validateDisplayName(name: string): string | null {
  const value = name.trim();
  if (value.length === 0) return "Enter your name.";
  return value.length > NAME_MAX_LENGTH ? `Use ${NAME_MAX_LENGTH} characters at most.` : null;
}

export { validateEmail };

/** A URL-safe handle for an organization, derived from its name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function validateSlug(slug: string): string | null {
  if (slug.length === 0) return "Enter a slug.";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? null : "Use lowercase letters, numbers and dashes.";
}

/** "iPhone · Safari" style label from a user agent string. Falls back to "Unknown device". */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : /okhttp|CFNetwork|Expo/i.test(ua)
                ? "OptionPilot app"
                : null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS/.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;
  const parts = [os, browser].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : "Unknown device";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "26 Oct 2026" in the device's own time zone. */
export function formatSessionDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** The phrase the person types to confirm deleting their account. */
export const DELETE_PHRASE = "DELETE";

export function matchesDeletePhrase(input: string): boolean {
  return input.trim() === DELETE_PHRASE;
}
