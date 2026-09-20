import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashIp, parseDeviceType, isExpired } from "@/lib/utils";
import { Clock, Ban, Home, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { RESERVED_SLUGS } from "@/lib/validation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Redirecting... | GDG CRCE Link`,
    description: `Redirecting link for /${slug}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SlugRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase().trim();

  // If slug is a reserved system path (e.g. favicon.ico, robots.txt, admin, api), return 404 immediately
  if (RESERVED_SLUGS.has(normalizedSlug)) {
    notFound();
  }

  // Create admin client for fast server-side query without auth session overhead
  const supabase = createAdminClient();
  if (!supabase) {
    notFound();
  }

  const { data: link, error } = await supabase
    .from("links")
    .select("id, slug, destination_url, title, is_active, expires_at, click_count")
    .ilike("slug", normalizedSlug)
    .single();

  if (error || !link) {
    notFound();
  }

  // 1. Check if disabled
  if (!link.is_active) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: "460px",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(148, 163, 184, 0.15)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "var(--text-secondary)",
              marginBottom: "1.25rem",
            }}
          >
            <Ban size={28} />
          </div>

          <div className="badge badge-disabled" style={{ marginBottom: "0.75rem" }}>
            Link Disabled
          </div>

          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            Link Currently Unavailable
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            This link is currently unavailable or has been temporarily paused by GDG organizers. Please contact the event team or check our official social channels.
          </p>

          <Link href="/" className="btn btn-secondary" style={{ width: "100%" }}>
            <Home size={16} />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // 2. Check if expired
  if (isExpired(link.expires_at)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: "460px",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--warning-bg)",
              border: "1px solid var(--warning-border)",
              color: "var(--warning-text)",
              marginBottom: "1.25rem",
            }}
          >
            <Clock size={28} />
          </div>

          <div className="badge badge-expired" style={{ marginBottom: "0.75rem" }}>
            Link Expired
          </div>

          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            This link has expired
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            The campaign or registration period associated with <code>/{link.slug}</code> has ended.
          </p>

          <Link href="/" className="btn btn-secondary" style={{ width: "100%" }}>
            <Home size={16} />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // 3. Link is active & valid -> Record click asynchronously without blocking redirect
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || null;
    const referer = headersList.get("referer") || null;
    const rawIp =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;
    const ipHash = hashIp(rawIp);
    const country = headersList.get("x-vercel-ip-country") || null;
    const deviceType = parseDeviceType(userAgent);

    // Call stored procedure or direct update
    // We do not await this with a long timeout or let any error crash the redirect
    void supabase
      .rpc("record_link_click", {
        target_link_id: link.id,
        p_user_agent: userAgent?.slice(0, 500) ?? null,
        p_referer: referer?.slice(0, 500) ?? null,
        p_ip_hash: ipHash,
        p_country: country,
        p_device_type: deviceType,
      })
      .then(({ error: rpcErr }) => {
        if (rpcErr) {
          // Fallback if RPC is not available: atomic update
          void supabase
            .from("links")
            .update({ click_count: (link.click_count || 0) + 1 })
            .eq("id", link.id);
          void supabase.from("link_clicks").insert({
            link_id: link.id,
            user_agent: userAgent?.slice(0, 500) ?? null,
            referer: referer?.slice(0, 500) ?? null,
            ip_hash: ipHash,
            country: country,
            device_type: deviceType,
          });
        }
      });
  } catch (trackingErr) {
    // Fail-safe: Analytics failures must never prevent redirect
    console.error("Link tracking error:", trackingErr);
  }

  // 4. Perform fast server-side redirect
  redirect(link.destination_url);
}
