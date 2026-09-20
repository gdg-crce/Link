"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateSlug, validateDestinationUrl } from "@/lib/validation";
import { isAuthorizedAdminEmail } from "@/lib/auth";
import type { LinkItem, LinkStats, LinkAnalyticsSummary } from "@/lib/types";

// ==========================================
// Admin Authorization Helper
// ==========================================

async function verifyAdminUser(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return {
      authorized: false,
      user: null,
      error: "Unauthorized. Please sign in.",
    };
  }

  // 1. Check environment variable
  if (isAuthorizedAdminEmail(user.email)) {
    return { authorized: true, user, error: null };
  }

  // 2. Check admin_users database table
  try {
    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("email")
      .ilike("email", user.email.trim().toLowerCase())
      .maybeSingle();

    if (adminRecord) {
      return { authorized: true, user, error: null };
    }
  } catch {
    // ignore db error
  }

  return {
    authorized: false,
    user,
    error: "Forbidden: Your email is not authorized to manage links.",
  };
}

// ==========================================
// Authentication Actions
// ==========================================

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = (formData.get("returnUrl") as string) || "/admin";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    console.error("Supabase signIn error:", error);
    return { error: error.message || "Invalid email or password. Please try again." };
  }

  // Check if this signed-in user is an authorized admin
  const authCheck = await verifyAdminUser(supabase);
  if (!authCheck.authorized) {
    await supabase.auth.signOut();
    return {
      error: "Access Denied: Your email is not on the authorized administrator list.",
    };
  }

  revalidatePath("/admin");
  redirect(returnUrl);

}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/admin/login");
}

// ==========================================
// Link Management Actions
// ==========================================

export async function createLinkAction(formData: FormData) {
  const supabase = await createClient();
  const authCheck = await verifyAdminUser(supabase);
  if (!authCheck.authorized || !authCheck.user) {
    return { error: authCheck.error || "Unauthorized." };
  }
  const user = authCheck.user;

  const rawSlug = formData.get("slug") as string;
  const rawUrl = formData.get("destination_url") as string;
  const title = (formData.get("title") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("is_active") === "true";
  const rawExpiresAt = formData.get("expires_at") as string;

  // Validate Slug
  const slugValidation = validateSlug(rawSlug);
  if (!slugValidation.valid || !slugValidation.cleanSlug) {
    return { error: slugValidation.error || "Invalid slug." };
  }
  const cleanSlug = slugValidation.cleanSlug;

  // Validate Destination URL
  const urlValidation = validateDestinationUrl(rawUrl);
  if (!urlValidation.valid || !urlValidation.cleanUrl) {
    return { error: urlValidation.error || "Invalid destination URL." };
  }
  const cleanUrl = urlValidation.cleanUrl;

  // Validate expiration if provided
  let expiresAt: string | null = null;
  if (rawExpiresAt) {
    const d = new Date(rawExpiresAt);
    if (isNaN(d.getTime())) {
      return { error: "Invalid expiry date/time." };
    }
    expiresAt = d.toISOString();
  }

  // Check slug uniqueness
  const { data: existingLink } = await supabase
    .from("links")
    .select("id")
    .ilike("slug", cleanSlug)
    .maybeSingle();

  if (existingLink) {
    return {
      error: `Slug '${cleanSlug}' is already in use. Please choose a different slug.`,
    };
  }

  // Insert link
  const { data: newLink, error: insertError } = await supabase
    .from("links")
    .insert({
      slug: cleanSlug,
      destination_url: cleanUrl,
      title,
      description,
      is_active: isActive,
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Link insertion error:", insertError);
    return { error: "Failed to create link. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath(`/${cleanSlug}`);
  return { success: true, link: newLink as LinkItem };
}

export async function updateLinkAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const authCheck = await verifyAdminUser(supabase);
  if (!authCheck.authorized || !authCheck.user) {
    return { error: authCheck.error || "Unauthorized." };
  }

  const rawSlug = formData.get("slug") as string;
  const rawUrl = formData.get("destination_url") as string;
  const title = (formData.get("title") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("is_active") === "true";
  const rawExpiresAt = formData.get("expires_at") as string;

  // Validate Slug
  const slugValidation = validateSlug(rawSlug);
  if (!slugValidation.valid || !slugValidation.cleanSlug) {
    return { error: slugValidation.error || "Invalid slug." };
  }
  const cleanSlug = slugValidation.cleanSlug;

  // Validate Destination URL
  const urlValidation = validateDestinationUrl(rawUrl);
  if (!urlValidation.valid || !urlValidation.cleanUrl) {
    return { error: urlValidation.error || "Invalid destination URL." };
  }
  const cleanUrl = urlValidation.cleanUrl;

  // Check if slug conflicts with another link
  const { data: existingLink } = await supabase
    .from("links")
    .select("id")
    .ilike("slug", cleanSlug)
    .neq("id", id)
    .maybeSingle();

  if (existingLink) {
    return {
      error: `Slug '${cleanSlug}' is already used by another link.`,
    };
  }

  let expiresAt: string | null = null;
  if (rawExpiresAt) {
    const d = new Date(rawExpiresAt);
    if (isNaN(d.getTime())) {
      return { error: "Invalid expiry date/time." };
    }
    expiresAt = d.toISOString();
  }

  const { data: updatedLink, error: updateError } = await supabase
    .from("links")
    .update({
      slug: cleanSlug,
      destination_url: cleanUrl,
      title,
      description,
      is_active: isActive,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Link update error:", updateError);
    return { error: "Failed to update link." };
  }

  revalidatePath("/admin");
  revalidatePath(`/${cleanSlug}`);
  return { success: true, link: updatedLink as LinkItem };
}

export async function toggleLinkStatusAction(id: string, newStatus: boolean) {
  const supabase = await createClient();
  const authCheck = await verifyAdminUser(supabase);
  if (!authCheck.authorized || !authCheck.user) {
    return { error: authCheck.error || "Unauthorized." };
  }

  const { error } = await supabase
    .from("links")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "Failed to update link status." };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteLinkAction(id: string) {
  const supabase = await createClient();
  const authCheck = await verifyAdminUser(supabase);
  if (!authCheck.authorized || !authCheck.user) {
    return { error: authCheck.error || "Unauthorized." };
  }

  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) {
    return { error: "Failed to delete link." };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ==========================================
// Data Queries (Admin)
// ==========================================

export async function getLinks(): Promise<LinkItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching links:", error);
    return [];
  }

  return (data || []) as LinkItem[];
}

export async function getLinkById(id: string): Promise<LinkItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as LinkItem;
}

export async function getDashboardStats(): Promise<LinkStats> {
  const supabase = await createClient();

  const { data: links, error } = await supabase
    .from("links")
    .select("is_active, click_count");

  if (error || !links) {
    return {
      totalLinks: 0,
      activeLinks: 0,
      disabledLinks: 0,
      totalClicks: 0,
      clicksToday: 0,
    };
  }

  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.is_active).length;
  const disabledLinks = totalLinks - activeLinks;
  const totalClicks = links.reduce((acc, l) => acc + (Number(l.click_count) || 0), 0);

  // Query clicks recorded today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from("link_clicks")
    .select("*", { count: "exact", head: true })
    .gte("clicked_at", todayStart.toISOString());

  return {
    totalLinks,
    activeLinks,
    disabledLinks,
    totalClicks,
    clicksToday: todayCount || 0,
  };
}

export async function getLinkAnalytics(id: string): Promise<LinkAnalyticsSummary | null> {
  const supabase = await createClient();

  const { data: link, error: linkErr } = await supabase
    .from("links")
    .select("*")
    .eq("id", id)
    .single();

  if (linkErr || !link) return null;

  // Fetch click events for this link (last 1000 events)
  const { data: clicks } = await supabase
    .from("link_clicks")
    .select("*")
    .eq("link_id", id)
    .order("clicked_at", { ascending: false })
    .limit(1000);

  const clickList = clicks || [];

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let clicksToday = 0;
  let clicksThisWeek = 0;
  let clicksThisMonth = 0;

  const deviceCounts: Record<string, number> = {
    desktop: 0,
    mobile: 0,
    tablet: 0,
    other: 0,
  };

  const referrersMap: Record<string, number> = {};
  const countriesMap: Record<string, number> = {};
  const dayBuckets: Record<string, number> = {};

  // Initialize last 7 days for the chart
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    dayBuckets[dateStr] = 0;
  }

  for (const c of clickList) {
    const t = new Date(c.clicked_at).getTime();
    if (t >= oneDayAgo) clicksToday++;
    if (t >= oneWeekAgo) clicksThisWeek++;
    if (t >= oneMonthAgo) clicksThisMonth++;

    // Device breakdown
    const dev = (c.device_type || "other").toLowerCase();
    if (dev in deviceCounts) {
      deviceCounts[dev]++;
    } else {
      deviceCounts.other++;
    }

    // Referrers
    const ref = c.referer ? new URL(c.referer, "http://localhost").hostname : "Direct / QR";
    referrersMap[ref] = (referrersMap[ref] || 0) + 1;

    // Countries
    const ctry = c.country || "Unknown";
    countriesMap[ctry] = (countriesMap[ctry] || 0) + 1;

    // Date bucket
    const dateStr = c.clicked_at.split("T")[0];
    if (dateStr in dayBuckets) {
      dayBuckets[dateStr]++;
    }
  }

  const clicksOverTime = Object.entries(dayBuckets).map(([date, count]) => ({
    date,
    count,
  }));

  const topReferrers = Object.entries(referrersMap)
    .map(([referer, count]) => ({ referer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCountries = Object.entries(countriesMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    link: link as LinkItem,
    totalClicks: link.click_count || clickList.length,
    clicksToday,
    clicksThisWeek,
    clicksThisMonth,
    deviceBreakdown: {
      desktop: deviceCounts.desktop,
      mobile: deviceCounts.mobile,
      tablet: deviceCounts.tablet,
      other: deviceCounts.other,
    },
    clicksOverTime,
    topReferrers,
    topCountries,
  };
}
