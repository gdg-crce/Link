import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdminEmail } from "@/lib/auth";
import { LogOut, ExternalLink, Link2, Plus, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAuthorized = false;
  if (user?.email) {
    if (isAuthorizedAdminEmail(user.email)) {
      isAuthorized = true;
    } else {
      try {
        const { data: adminRecord } = await supabase
          .from("admin_users")
          .select("email")
          .ilike("email", user.email.trim().toLowerCase())
          .maybeSingle();
        if (adminRecord) isAuthorized = true;
      } catch {
        // ignore
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Admin Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "rgba(11, 15, 25, 0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="container"
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link
              href="/admin"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <div className="gdg-logo-mark">
                <span className="gdg-dot blue" />
                <span className="gdg-dot red" />
                <span className="gdg-dot yellow" />
                <span className="gdg-dot green" />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>GDG CRCE</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px",
                    backgroundColor: "var(--bg-subtle)",
                  }}
                >
                  Admin
                </span>
              </div>
            </Link>

            {/* Nav links */}
            {user && isAuthorized && (
              <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Link
                  href="/admin"
                  className="btn btn-ghost btn-sm"
                  style={{ gap: "0.4rem" }}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                <Link
                  href="/admin/links/new"
                  className="btn btn-ghost btn-sm"
                  style={{ gap: "0.4rem" }}
                >
                  <Plus size={14} />
                  New Link
                </Link>
              </nav>
            )}
          </div>

          {/* User actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <a
              href="https://gdgcrce.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              title="Open GDG CRCE Official Website"
            >
              <ExternalLink size={14} />
              <span style={{ display: "none" }} className="table-desktop">GDG CRCE</span>
            </a>


            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    maxWidth: "160px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </span>

                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    style={{ gap: "0.35rem" }}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/admin/login" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main style={{ flex: 1, padding: "2rem 0 3rem" }}>{children}</main>

      {/* Minimal Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "1.25rem",
          textAlign: "center",
          fontSize: "0.775rem",
          color: "var(--text-muted)",
        }}
      >
        <div className="container">
          GDG On Campus CRCE • Link Management System • link.gdgcrce.com
        </div>
      </footer>
    </div>
  );
}
