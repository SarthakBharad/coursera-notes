import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeScript } from "@/components/ThemeScript";
import { site } from "@/lib/site";
import { generalSans, stardom } from "./fonts";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/home.css";
import "@/styles/program.css";
import "@/styles/reader.css";
import "@/styles/prose.css";
import "@/styles/palette.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author }],
  openGraph: { type: "website", siteName: site.name, title: site.name, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eeeeee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0720" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${stardom.variable} ${generalSans.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body id="top">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="page">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
