"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MousePointerClick,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Globe,
  TrendingUp,
} from "lucide-react";
import type { LinkAnalyticsSummary } from "@/lib/types";

interface Props {
  data: LinkAnalyticsSummary;
  baseUrl: string;
}

export default function AnalyticsView({ data, baseUrl }: Props) {
  const { link, totalClicks, clicksToday, clicksThisWeek, clicksThisMonth, deviceBreakdown, clicksOverTime, topReferrers, topCountries } = data;

  const maxDailyClicks = Math.max(...clicksOverTime.map((d) => d.count), 1);
  const totalTrackedDevices =
    deviceBreakdown.desktop +
    deviceBreakdown.mobile +
    deviceBreakdown.tablet +
    deviceBreakdown.other || 1;

  const desktopPct = Math.round((deviceBreakdown.desktop / totalTrackedDevices) * 100);
  const mobilePct = Math.round((deviceBreakdown.mobile / totalTrackedDevices) * 100);
  const tabletPct = Math.round((deviceBreakdown.tablet / totalTrackedDevices) * 100);
  const otherPct = Math.max(0, 100 - (desktopPct + mobilePct + tabletPct));

  return (
    <div className="container">
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

      {/* Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span className="mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gdg-blue)" }}>
              /{link.slug}
            </span>
            <span className={`badge ${link.is_active ? "badge-active" : "badge-disabled"}`}>
              {link.is_active ? "Active" : "Disabled"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {link.title || "Link Analytics"}
          </h1>
          <a
            href={link.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              marginTop: "0.25rem",
            }}
          >
            {link.destination_url}
            <ExternalLink size={13} />
          </a>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href={`/admin/links/${link.id}/qr`} className="btn btn-secondary btn-sm">
            View QR
          </Link>
          <Link href={`/admin/links/${link.id}/edit`} className="btn btn-secondary btn-sm">
            Edit Link
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Clicks</span>
          <span className="stat-value">{totalClicks.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Today</span>
          <span className="stat-value" style={{ color: "var(--gdg-blue)" }}>
            {clicksToday.toLocaleString()}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">This Week</span>
          <span className="stat-value" style={{ color: "var(--gdg-green)" }}>
            {clicksThisWeek.toLocaleString()}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value" style={{ color: "var(--gdg-yellow)" }}>
            {clicksThisMonth.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Grid: Activity Chart & Device Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Clicks Over Time (Past 7 Days) */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>Clicks Over Time (Past 7 Days)</h3>
            <TrendingUp size={16} color="var(--gdg-blue)" />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.75rem",
              height: "180px",
              paddingTop: "1rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {clicksOverTime.map((item) => {
              const heightPct = Math.max(12, Math.round((item.count / maxDailyClicks) * 100));
              const dateLabel = new Date(item.date).toLocaleDateString("en-US", {
                weekday: "narrow",
                month: "numeric",
                day: "numeric",
              });

              return (
                <div
                  key={item.date}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.4rem",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {item.count}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "36px",
                      height: `${heightPct}%`,
                      backgroundColor: "var(--gdg-blue)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                    title={`${item.date}: ${item.count} clicks`}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1.5rem" }}>
            Device Breakdown
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Desktop */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Monitor size={15} color="var(--gdg-blue)" /> Desktop
                </span>
                <span>{deviceBreakdown.desktop} ({desktopPct}%)</span>
              </div>
              <div style={{ height: "8px", backgroundColor: "var(--bg-subtle)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${desktopPct}%`, height: "100%", backgroundColor: "var(--gdg-blue)" }} />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Smartphone size={15} color="var(--gdg-green)" /> Mobile
                </span>
                <span>{deviceBreakdown.mobile} ({mobilePct}%)</span>
              </div>
              <div style={{ height: "8px", backgroundColor: "var(--bg-subtle)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${mobilePct}%`, height: "100%", backgroundColor: "var(--gdg-green)" }} />
              </div>
            </div>

            {/* Tablet */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Tablet size={15} color="var(--gdg-yellow)" /> Tablet
                </span>
                <span>{deviceBreakdown.tablet} ({tabletPct}%)</span>
              </div>
              <div style={{ height: "8px", backgroundColor: "var(--bg-subtle)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${tabletPct}%`, height: "100%", backgroundColor: "var(--gdg-yellow)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrers & Countries */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Top Referrers */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem" }}>
            Top Referrers
          </h3>
          {topReferrers.length > 0 ? (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topReferrers.map((ref) => (
                <li
                  key={ref.referer}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ color: "var(--text-primary)" }}>{ref.referer}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{ref.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No referrer data recorded yet.</p>
          )}
        </div>

        {/* Top Countries */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem" }}>
            Top Countries
          </h3>
          {topCountries.length > 0 ? (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topCountries.map((c) => (
                <li
                  key={c.country}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ color: "var(--text-primary)" }}>{c.country}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{c.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No geolocation data recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
