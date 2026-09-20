import Link from "next/link";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
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
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
            marginBottom: "1.25rem",
          }}
        >
          <AlertCircle size={28} />
        </div>

        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--gdg-red)",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}
        >
          404 Error
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "0.75rem",
          }}
        >
          This link doesn&apos;t exist
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            marginBottom: "2rem",
          }}
        >
          The GDG link you&apos;re looking for could not be found or may have been removed by an administrator.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary" style={{ width: "100%" }}>
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
