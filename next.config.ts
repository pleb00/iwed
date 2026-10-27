import type { NextConfig } from "next";

const pagesBasePath =
  process.env.GITHUB_PAGES === "true" ? process.env.PAGES_BASE_PATH || "" : "";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: pagesBasePath },
  // GitHub Pages serves static files; local development keeps normal Next.js behavior.
  ...(process.env.GITHUB_PAGES === "true"
    ? {
        output: "export" as const,
        basePath: pagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
