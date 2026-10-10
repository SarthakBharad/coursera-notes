import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  agentRules: false,
  serverExternalPackages: ["shiki", "rehype-pretty-code"],
};

export default nextConfig;
