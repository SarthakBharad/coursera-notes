import localFont from "next/font/local";

/** Stardom (Fontshare) — headings and the wordmark. */
export const stardom = localFont({
  src: "./fonts/Stardom-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-stardom",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** General Sans (Fontshare) — body text and UI. */
export const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/GeneralSans-SemiboldItalic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/GeneralSans-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-general-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});
