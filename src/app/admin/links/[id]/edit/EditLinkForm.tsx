"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, AlertTriangle } from "lucide-react";
import { updateLinkAction } from "@/lib/actions";
import type { LinkItem } from "@/lib/types";

interface Props {
  link: LinkItem;
}

export default function EditLinkForm({ link }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(link.slug);
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url);
  const [title, setTitle] = useState(link.title || "");
  const [description, setDescription] = useState(link.description || "");
  const [isActive, setIsActive] = useState(link.is_active);

  // Format existing ISO string to input datetime-local format
  const initialExpiry = link.expires_at
    ? new Date(link.expires_at).toISOString().slice(0, 16)
    : "";
  const [expiresAt, setExpiresAt] = useState(initialExpiry);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSlugChanged = slug !== link.slug;

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const res = await updateLinkAction(link.id, formData);
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
            Edit Link: /{link.slug}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Modify redirect destination or campaign settings
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
                className="form-input form-prefix-input"
              />
            </div>
            {isSlugChanged && (
              <div
                className="alert alert-warning"
                style={{ marginTop: "0.5rem", padding: "0.65rem 0.85rem", fontSize: "0.8rem" }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Warning:</strong> Changing the slug will change the public URL. Any previously distributed QR codes or URLs using the old slug will stop working.
                </span>
              </div>
            )}
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
            <span className="form-hint">Clear date to keep active indefinitely.</span>
          </div>

          {/* Active status */}
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
              Link is Active (Public visitors will be redirected)
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
            <Link href="/admin" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? "Saving..." : "Save Changes"}
              {!isPending && <Save size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
