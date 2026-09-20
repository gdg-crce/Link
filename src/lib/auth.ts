/**
 * Authentication and Admin Authorization Utilities
 */

export const DEFAULT_REDIRECT_URL =
  process.env.DEFAULT_REDIRECT_URL || "https://gdgcrce.com";

export const DEFAULT_ADMIN_EMAILS = [
  "varadaj47@gmail.com",
  "gdgcrce@gmail.com",
];

/**
 * Checks if the given email is in the list of authorized admin emails.
 * Reads from ADMIN_EMAILS environment variable (comma-separated) or hardcoded defaults.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check ADMIN_EMAILS environment variable (comma-separated list)
  const envAdmins = process.env.ADMIN_EMAILS || "";
  if (envAdmins) {
    const allowedList = envAdmins
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedList.includes(normalizedEmail)) {
      return true;
    }
  }

  // 2. Check default fallback admin list
  if (DEFAULT_ADMIN_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  return false;
}

