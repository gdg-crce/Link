export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "auth",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "static",
  "dashboard",
  "status",
  "public",
  "settings",
  "help",
  "about",
  "terms",
  "privacy",
  "links",
  "link",
]);

export function validateSlug(rawSlug: string): { valid: boolean; error?: string; cleanSlug?: string } {
  if (!rawSlug || typeof rawSlug !== "string") {
    return { valid: false, error: "Slug is required." };
  }

  const cleanSlug = rawSlug.trim().toLowerCase();

  if (cleanSlug.length < 2) {
    return { valid: false, error: "Slug must be at least 2 characters long." };
  }

  if (cleanSlug.length > 80) {
    return { valid: false, error: "Slug must be 80 characters or fewer." };
  }

  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(cleanSlug)) {
    return {
      valid: false,
      error: "Slug may only contain lowercase letters, numbers, hyphens, and underscores.",
    };
  }

  if (RESERVED_SLUGS.has(cleanSlug)) {
    return {
      valid: false,
      error: `'${cleanSlug}' is a reserved system path and cannot be used as a slug.`,
    };
  }

  return { valid: true, cleanSlug };
}

export function validateDestinationUrl(rawUrl: string): { valid: boolean; error?: string; cleanUrl?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "Destination URL is required." };
  }

  const cleanUrl = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(cleanUrl);
  } catch {
    return { valid: false, error: "Please enter a valid URL (including https:// or http://)." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Destination URL must use HTTP or HTTPS protocol." };
  }

  // Security check: disallow javascript:, data:, etc.
  const dangerousPatterns = /^(javascript|data|vbscript|file):/i;
  if (dangerousPatterns.test(cleanUrl)) {
    return { valid: false, error: "Invalid URL scheme detected." };
  }

  return { valid: true, cleanUrl };
}
