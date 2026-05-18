"use server";

import { auth } from "@/auth";
import { logActivity } from "@/lib/db/generations";

/**
 * 네이버 HTML 복사 완료를 activity_log에 기록한다.
 * 네이버는 공식 API가 없어 "복사 → 글쓰기 화면에 붙여넣기" 흐름이므로,
 * 복사 시점을 발행 의도로 보고 흔적을 남겨 history에서 추적 가능하게 한다.
 *
 * 실패해도 UX에는 영향 없게 throw 하지 않는다.
 */
export async function logNaverExport(input: {
  title: string;
  generationId?: string | null;
  tagCount?: number;
  bodyLen?: number;
}): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    await logActivity({
      userEmail: session?.user?.email ?? null,
      userName: session?.user?.name ?? null,
      action: "publish",
      targetType: "naver",
      targetId: input.generationId ?? undefined,
      detail: {
        title: input.title.slice(0, 200),
        method: "html-copy",
        generationId: input.generationId ?? null,
        tagCount: input.tagCount ?? 0,
        bodyLen: input.bodyLen ?? 0,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
