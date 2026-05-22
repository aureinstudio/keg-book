/**
 * 발행 큐 cron 트리거 — Vercel Cron 또는 외부 스케줄러가 호출한다.
 *
 * 인증: `Authorization: Bearer <CRON_SECRET>` 헤더 필수.
 * 미들웨어 (`src/middleware.ts`) 의 세션 게이트를 우회하기 위해 자체 인증을 둔다.
 * (운영 안전: 비밀이 미설정이면 503 으로 명시 차단)
 *
 * 운영:
 *   - GET / POST 둘 다 허용 (Vercel Cron 은 GET, 수동 트리거는 POST 가 자연스러움)
 *   - 한 호출 = 한 배치 (기본 10건)
 */

import { NextResponse } from "next/server";

import { runQueueOnce } from "@/lib/queue/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(message: string) {
  return NextResponse.json(
    { ok: false, error: "Unauthorized", message },
    { status: 401 },
  );
}

function checkAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "ServiceUnavailable",
        message: "CRON_SECRET 환경변수가 설정되지 않았습니다.",
      },
      { status: 503 },
    );
  }
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || match[1].trim() !== secret) {
    return unauthorized("CRON_SECRET 불일치");
  }
  return null;
}

async function handle(req: Request) {
  const denied = checkAuth(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const batchParam = url.searchParams.get("batch");
  const batchSize = (() => {
    const n = batchParam ? Number.parseInt(batchParam, 10) : 10;
    if (!Number.isFinite(n) || n <= 0) return 10;
    return Math.min(n, 50);
  })();

  try {
    const result = await runQueueOnce(batchSize);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: "WorkerFailed", message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
