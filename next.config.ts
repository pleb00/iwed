import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files; local development keeps normal Next.js behavior.
  ...(process.env.GITHUB_PAGES === "true"
    ? {
        output: "export" as const,
        basePath: process.env.PAGES_BASE_PATH || "",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
