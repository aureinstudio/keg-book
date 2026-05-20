import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMailyConfig } from "@/lib/maily/mailyClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { apiKey, baseUrl, subscribersPath } = getMailyConfig();
  return NextResponse.json({
    configured: Boolean(apiKey),
    baseUrl,
    subscribersPath,
    docs: "https://maily.so/app/guides/dev/dev-api",
  });
}
