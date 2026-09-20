"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  BarChart2,
  Edit2,
  Trash2,
  Power,
  AlertTriangle,
  Link as LinkIcon,
  MousePointerClick,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { LinkItem, LinkStats } from "@/lib/types";
import { formatDate, isExpired } from "@/lib/utils";
import { toggleLinkStatusAction, deleteLinkAction } from "@/lib/actions";

interface Props {
  links: LinkItem[];
  stats: LinkStats;
  baseUrl: string;
}

export default function AdminDashboardView({ links, stats, baseUrl }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "disabled" | "expired">("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async (slug: string) => {
    const fullUrl = `${baseUrl}/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // Fallback
      alert(`Copied: ${fullUrl}`);
    }
  };

  const handleToggleStatus = (link: LinkItem) => {
    startTransition(async () => {
      await toggleLinkStatusAction(link.id, !link.is_active);
    });
  };

  const confirmDelete = () => {
    if (!deletingLink) return;
    startTransition(async () => {
      await deleteLinkAction(deletingLink.id);
      setDeletingLink(null);
    });
  };

  // Filter links
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.slug.toLowerCase().includes(search.toLowerCase()) ||
      (link.title && link.title.toLowerCase().includes(search.toLowerCase())) ||
      link.destination_url.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const expired = isExpired(link.expires_at);
    if (filter === "active") return link.is_active && !expired;
    if (filter === "disabled") return !link.is_active;
    if (filter === "expired") return expired;

    return true;
  });

  return (
    <div className="container">
      {/* Top Banner / Heading */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Link Overview
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Manage branded redirects for GDG On Campus CRCE ({baseUrl})
          </p>
        </div>

        <Link href="/admin/links/new" className="btn btn-primary">
          <Plus size={16} />
          Create Link
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-label">Total Links</span>
            <LinkIcon size={16} color="var(--gdg-blue)" />
          </div>
          <span className="stat-value">{stats.totalLinks.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-label">Active Links</span>
            <Sparkles size={16} color="var(--gdg-green)" />
          </div>
          <span className="stat-value" style={{ color: "var(--gdg-green)" }}>
            {stats.activeLinks.toLocaleString()}
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-label">Total Clicks</span>
            <MousePointerClick size={16} color="var(--gdg-yellow)" />
          </div>
          <span className="stat-value">{stats.totalClicks.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-label">Clicks Today</span>
            <Calendar size={16} color="var(--gdg-red)" />
          </div>
          <span className="stat-value">{stats.clicksToday.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by slug, title, or destination..."
            className="form-input"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {(["all", "active", "disabled", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Links List - Desktop Table */}
      {filteredLinks.length > 0 ? (
        <>
          <div className="table-responsive table-desktop">
            <table className="table">
              <thead>
                <tr>
                  <th>Short Link</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Clicks</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => {
                  const expired = isExpired(link.expires_at);
                  const isCopied = copiedSlug === link.slug;

                  return (
                    <tr key={link.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {link.title || `/${link.slug}`}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--gdg-blue)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            /{link.slug}
                          </span>
                        </div>
                      </td>

                      <td>
                        <a
                          href={link.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.destination_url}
                          style={{
                            maxWidth: "260px",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--text-secondary)",
                            fontSize: "0.825rem",
                          }}
                        >
                          {link.destination_url}
                        </a>
                      </td>

                      <td>
                        {!link.is_active ? (
                          <span className="badge badge-disabled">Disabled</span>
                        ) : expired ? (
                          <span className="badge badge-expired">Expired</span>
                        ) : (
                          <span className="badge badge-active">Active</span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 600 }}>{link.click_count || 0}</span>
                      </td>

                      <td>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {formatDate(link.created_at)}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <button
                            onClick={() => handleCopy(link.slug)}
                            className="btn btn-secondary btn-sm"
                            title="Copy Short URL"
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            {isCopied ? (
                              <Check size={14} color="var(--gdg-green)" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>

                          <a
                            href={`/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Test Redirect"
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            <ExternalLink size={14} />
                          </a>

                          <Link
                            href={`/admin/links/${link.id}/qr`}
                            className="btn btn-secondary btn-sm"
                            title="QR Code"
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            <QrCode size={14} />
                          </Link>

                          <Link
                            href={`/admin/links/${link.id}/analytics`}
                            className="btn btn-secondary btn-sm"
                            title="Analytics"
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            <BarChart2 size={14} />
                          </Link>

                          <button
                            onClick={() => handleToggleStatus(link)}
                            className={`btn btn-sm ${
                              link.is_active ? "btn-secondary" : "btn-primary"
                            }`}
                            title={link.is_active ? "Disable Link" : "Enable Link"}
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            <Power size={14} />
                          </button>

                          <Link
                            href={`/admin/links/${link.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Link"
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            <Edit2 size={14} />
                          </Link>

                          <button
                            onClick={() => setDeletingLink(link)}
                            className="btn btn-danger btn-sm"
                            title="Delete Link"
                            style={{ padding: "0.375rem 0.5rem" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Links List - Mobile Cards */}
          <div className="cards-mobile">
            {filteredLinks.map((link) => {
              const expired = isExpired(link.expires_at);
              const isCopied = copiedSlug === link.slug;

              return (
                <div key={link.id} className="card" style={{ padding: "1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>
                        {link.title || `/${link.slug}`}
                      </h3>
                      <span className="mono" style={{ fontSize: "0.85rem", color: "var(--gdg-blue)" }}>
                        /{link.slug}
                      </span>
                    </div>

                    {!link.is_active ? (
                      <span className="badge badge-disabled">Disabled</span>
                    ) : expired ? (
                      <span className="badge badge-expired">Expired</span>
                    ) : (
                      <span className="badge badge-active">Active</span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {link.destination_url}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginBottom: "1rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span>Clicks: <strong style={{ color: "var(--text-primary)" }}>{link.click_count || 0}</strong></span>
                    <span>Created: {formatDate(link.created_at)}</span>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleCopy(link.slug)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      {isCopied ? <Check size={14} color="var(--gdg-green)" /> : <Copy size={14} />}
                      {isCopied ? "Copied" : "Copy"}
                    </button>

                    <Link
                      href={`/admin/links/${link.id}/qr`}
                      className="btn btn-secondary btn-sm"
                    >
                      <QrCode size={14} />
                      QR
                    </Link>

                    <Link
                      href={`/admin/links/${link.id}/analytics`}
                      className="btn btn-secondary btn-sm"
                    >
                      <BarChart2 size={14} />
                      Stats
                    </Link>

                    <Link
                      href={`/admin/links/${link.id}/edit`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit2 size={14} />
                    </Link>

                    <button
                      onClick={() => setDeletingLink(link)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card empty-state">
          <LinkIcon className="empty-icon" />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 600 }}>No links found</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "400px" }}>
            {search
              ? `No links matched your search "${search}". Try clearing the search query.`
              : "Get started by creating your first branded GDG short link."}
          </p>
          {!search && (
            <Link href="/admin/links/new" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
              <Plus size={16} />
              Create First Link
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLink && (
        <div className="modal-backdrop" onClick={() => setDeletingLink(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  color: "var(--danger-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  Delete /{deletingLink.slug}?
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                  This will permanently remove the short link and all associated redirect rules. Any QR codes or links already printed will stop working.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeletingLink(null)}
                className="btn btn-secondary"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn btn-danger"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
