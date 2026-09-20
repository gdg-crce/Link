import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShieldAlert, LogOut, ArrowLeft, Mail } from "lucide-react";

export default async function UnauthorizedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "Unknown user";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        padding: "1.5rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "2.5rem 2rem",
          textAlign: "center",
          border: "1px solid rgba(234, 67, 53, 0.25)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
          background:
            "linear-gradient(180deg, rgba(234, 67, 53, 0.05) 0%, rgba(17, 24, 39, 0.9) 100%)",
        }}
      >
        {/* Shield Alert Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(234, 67, 53, 0.12)",
            color: "var(--gdg-red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem auto",
            border: "1px solid rgba(234, 67, 53, 0.3)",
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            color: "var(--text-primary)",
          }}
        >
          Access Restricted
        </h1>

        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          The GDG Link Manager administration panel is protected and only accessible to authorized administrator email addresses.
        </p>

        {/* Current Signed-In Email Badge */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          <Mail size={16} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Signed in as:
          </span>
          <strong
            style={{
              fontSize: "0.85rem",
              color: "var(--text-primary)",
              wordBreak: "break-all",
            }}
          >
            {userEmail}
          </strong>
        </div>

        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginBottom: "2rem",
            lineHeight: 1.4,
          }}
        >
          If your account should have access, please ask your GDG Lead to add this email to the authorized administrator list in the environment or database.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
            >
              <LogOut size={16} />
              Sign Out / Switch Account
            </button>
          </form>

          <Link
            href="/"
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
          >
            <ArrowLeft size={16} />
            Back to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
