import { NextResponse } from "next/server";

import { getMailyConfig } from "@/lib/maily/mailyClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const { apiKey, baseUrl, subscribersPath } = getMailyConfig();
  return NextResponse.json({
    configured: Boolean(apiKey),
    baseUrl,
    subscribersPath,
    docs: "https://maily.so/app/guides/dev/dev-api",
  });
}
