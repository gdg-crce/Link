import crypto from "crypto";

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://link.gdgcrce.com";
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // Use a secret salt or daily salt to protect user privacy
  const salt = process.env.IP_HASH_SALT || "gdg-crce-link-salt-2026";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex").slice(0, 16);
}

export function parseDeviceType(userAgent: string | null | undefined): string {
  if (!userAgent) return "Other";
  const ua = userAgent.toLowerCase();

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "Tablet";
  }
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return "Mobile";
  }
  if (/bot|crawler|spider|slurp|bingbot|googlebot/i.test(ua)) {
    return "Bot";
  }
  return "Desktop";
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}
