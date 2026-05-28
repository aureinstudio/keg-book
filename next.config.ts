import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // 카드뉴스 레퍼런스 이미지 다중 업로드 (최대 6장 × 5MB)
    serverActions: { bodySizeLimit: "32mb" },
  },
};

export default nextConfig;
