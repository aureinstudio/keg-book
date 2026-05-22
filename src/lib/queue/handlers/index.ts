import type { ChannelKind, HandlerResult, JobPayload } from "@/lib/queue/types";
import { handleBufferJob } from "./buffer";

/**
 * 채널 → 핸들러 매핑. 새 채널 추가 시 이 레지스트리만 갱신한다.
 *
 * 미지원 채널(예: "naver")은 fatal 로 종료해 큐에서 영구 실패 처리.
 * naver 는 자동 발행 자체가 불가능(공식 API 없음)하므로 enqueue 단계에서
 * 막는 것이 정석이나, 누락 시 워커가 안전하게 종료한다.
 */
export const HANDLERS: Record<string, (payload: JobPayload) => Promise<HandlerResult>> = {
  buffer: (p) => handleBufferJob(p as JobPayload),
};

export const SUPPORTED_CHANNELS: readonly ChannelKind[] = ["buffer"] as const;

export function isSupportedChannel(channel: string): channel is ChannelKind {
  return (SUPPORTED_CHANNELS as readonly string[]).includes(channel);
}
