import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDG On Campus CRCE | Branded Link Manager",
  description:
    "Official branded short links for Google Developer Groups On Campus - Fr. Conceicao Rodrigues College of Engineering.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
