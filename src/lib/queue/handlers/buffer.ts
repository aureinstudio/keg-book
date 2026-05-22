import { createBufferTextPost } from "@/lib/buffer/createBufferPost";
import type { BufferJobPayload, HandlerResult } from "@/lib/queue/types";

/**
 * Buffer 발행 핸들러 — 큐 워커가 호출한다.
 * payload.channelId + text + images 로 Buffer API addToQueue/shareNow.
 *
 * 분류:
 * - 401 / token / unauthor → fatal (재시도 무의미 — 토큰 재발급 필요)
 * - 4xx 본문 검증 실패  → fatal
 * - 429 / 5xx / 네트워크  → retryable
 * - 기타                  → retryable (모름 → 안전한 쪽)
 */
export async function handleBufferJob(
  payload: BufferJobPayload,
): Promise<HandlerResult> {
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();
  if (!token) {
    return {
      kind: "fatal",
      error: "BUFFER_API_ACCESS_TOKEN 미설정",
    };
  }
  if (!payload.channelId || !payload.text) {
    return {
      kind: "fatal",
      error: "channelId 또는 text 누락",
    };
  }

  try {
    const res = await createBufferTextPost({
      accessToken: token,
      channelId: payload.channelId,
      text: payload.text,
      images: payload.images,
      mode: payload.mode ?? "addToQueue",
    });
    return { kind: "ok", externalId: res.postId };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const lower = raw.toLowerCase();

    // 영구 실패 (재시도 무의미)
    if (/401|unauthor|invalid\s*token|token\s*expired|forbidden/.test(lower)) {
      return { kind: "fatal", error: `Buffer 토큰 만료/권한 없음: ${raw}` };
    }
    if (/channel.*(disconnected|not.?found|locked)/.test(lower)) {
      return { kind: "fatal", error: `Buffer 채널 연결 문제: ${raw}` };
    }
    if (/validation|invalid\s*(input|argument)|missing\s*required/.test(lower)) {
      return { kind: "fatal", error: `Buffer 검증 실패: ${raw}` };
    }

    // 일시 실패 (재시도)
    if (/429|rate.?limit|too\s*many|timeout|network|fetch\s*failed|enotfound|econnreset|5\d\d/.test(lower)) {
      return { kind: "retryable", error: `Buffer 일시 오류: ${raw}` };
    }

    // 미분류는 안전한 쪽으로 — 일시 실패로 간주
    return { kind: "retryable", error: `Buffer 미분류 오류: ${raw}` };
  }
}
