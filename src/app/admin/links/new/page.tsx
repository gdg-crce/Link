"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Globe, AlertCircle, Sparkles } from "lucide-react";
import { createLinkAction } from "@/lib/actions";

export default function NewLinkPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically sanitize input to lowercase without spaces
    const sanitized = e.target.value.toLowerCase().replace(/\s+/g, "-");
    setSlug(sanitized);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("destination_url", destinationUrl);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("is_active", String(isActive));
    if (expiresAt) {
      formData.append("expires_at", expiresAt);
    }

    startTransition(async () => {
      const res = await createLinkAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/admin");
        router.refresh();
      }
    });
  };

  return (
    <div className="container-narrow">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/admin"
          className="btn btn-ghost btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", paddingLeft: 0 }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>

      <div className="card" style={{ padding: "2.25rem 2rem", boxShadow: "var(--shadow-md)" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Create New Short Link
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Create a branded redirect on <code>link.gdgcrce.com</code>
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Slug */}
          <div className="form-group">
            <label className="form-label" htmlFor="slug">
              Short Slug *
            </label>
            <div className="form-input-prefix-wrapper">
              <span className="form-prefix">link.gdgcrce.com/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="submission"
                className="form-input form-prefix-input"
              />
            </div>
            <span className="form-hint">
              Use lowercase letters, numbers, hyphens or underscores (e.g. <code>register</code>, <code>bitnbuild</code>).
            </span>
          </div>

          {/* Destination URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="destination_url">
              Destination URL *
            </label>
            <input
              id="destination_url"
              name="destination_url"
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://forms.google.com/..."
              className="form-input"
            />
            <span className="form-hint">
              The external web destination (Google Form, Discord invite, etc.).
            </span>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Internal Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="BitNBuild 2026 Submission Form"
              className="form-input"
            />
            <span className="form-hint">Human-readable label for dashboard organization.</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary submission link for the annual hackathon."
              className="form-textarea"
            />
          </div>

          {/* Expiration */}
          <div className="form-group">
            <label className="form-label" htmlFor="expires_at">
              Expiration Date & Time (Optional)
            </label>
            <input
              id="expires_at"
              name="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="form-input"
            />
            <span className="form-hint">
              Leave blank if the link should remain active indefinitely.
            </span>
          </div>

          {/* Active status checkbox */}
          <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--gdg-blue)" }}
            />
            <label htmlFor="is_active" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
              Enable link immediately upon creation
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
            <Link href="/admin" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? "Creating Link..." : "Create Link"}
              {!isPending && <Plus size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
