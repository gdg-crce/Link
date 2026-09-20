"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Download, Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import type { LinkItem } from "@/lib/types";

interface Props {
  link: LinkItem;
  shortUrl: string;
}

export default function QrCodeView({ link, shortUrl }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate high-res raster QR code
    QRCode.toDataURL(shortUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.error("QR generation error:", err);
      });

    // Generate vector SVG
    QRCode.toString(shortUrl, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((svg) => {
        setSvgString(svg);
      })
      .catch((err) => {
        console.error("QR SVG generation error:", err);
      });
  }, [shortUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`Copied: ${shortUrl}`);
    }
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `gdg-link-${link.slug}-qr.png`;
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdg-link-${link.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
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

      <div
        className="card"
        style={{
          padding: "2.5rem 2rem",
          textAlign: "center",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="badge badge-active" style={{ marginBottom: "0.75rem" }}>
            Branded QR Code
          </span>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {link.title || `/${link.slug}`}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            This QR code points directly to the short URL. If you update the destination later, the printed QR code remains valid!
          </p>
        </div>

        {/* Branded QR Card Frame */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "300px",
            width: "100%",
            margin: "1rem 0 2rem",
          }}
        >
          {/* GDG Header on QR badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.75rem" }}>
            <span className="gdg-dot blue" />
            <span className="gdg-dot red" />
            <span className="gdg-dot yellow" />
            <span className="gdg-dot green" />
            <span
              style={{
                color: "#1E293B",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              GDG On Campus CRCE
            </span>
          </div>

          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code for ${shortUrl}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "220px",
                height: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748B",
                fontSize: "0.85rem",
              }}
            >
              Generating QR...
            </div>
          )}

          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            link.gdgcrce.com/{link.slug}
          </div>
        </div>

        {/* Short Link display with Copy Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.5rem 0.875rem",
            maxWidth: "400px",
            width: "100%",
            marginBottom: "1.75rem",
          }}
        >
          <code
            style={{
              color: "var(--gdg-blue)",
              fontSize: "0.875rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shortUrl}
          </code>
          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.3rem 0.6rem", marginLeft: "0.5rem" }}
          >
            {copied ? <Check size={14} color="var(--gdg-green)" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Download Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={handleDownloadPng} disabled={!dataUrl} className="btn btn-primary">
            <Download size={16} />
            Download PNG (High-Res)
          </button>
          <button onClick={handleDownloadSvg} disabled={!svgString} className="btn btn-secondary">
            <Download size={16} />
            Download Vector SVG
          </button>
        </div>
      </div>
    </div>
  );
}
