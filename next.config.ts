import type { NextConfig } from "next";

const basePath =
  process.env.GITHUB_PAGES === "true"
    ? process.env.PAGES_BASE_PATH ?? "/iwed"
    : "/iwed";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // GitHub Pages serves static files; local development keeps normal Next.js behavior.
  ...(process.env.GITHUB_PAGES === "true"
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
