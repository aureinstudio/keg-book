import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { getMailyConfig, mailySubscribersUrl } from "@/lib/maily/mailyClient";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { apiKey } = getMailyConfig();
  if (!apiKey) {
    return NextResponse.json(
      { error: "MAILY_API_KEY가 설정되지 않았습니다. 키 없이도 뉴스레터 HTML·복사는 동작합니다." },
      { status: 503 },
    );
  }

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const url = mailySubscribersUrl(page);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  const text = await res.text();
  const ct = res.headers.get("content-type") || "application/json";
  return new NextResponse(text, { status: res.status, headers: { "content-type": ct } });
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { apiKey } = getMailyConfig();
  if (!apiKey) {
    return NextResponse.json(
      { error: "MAILY_API_KEY가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const url = mailySubscribersUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  const ct = res.headers.get("content-type") || "application/json";
  return new NextResponse(text, { status: res.status, headers: { "content-type": ct } });
}
