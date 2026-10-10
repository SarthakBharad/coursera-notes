import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: every page is rendered at build time into `out/`.
  // Notes are read from `content/` during the build, so no server is needed.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  // Syntax highlighting runs in Node at build time; keep it out of the bundler.
  serverExternalPackages: ["shiki", "rehype-pretty-code"],
};

export default nextConfig;
