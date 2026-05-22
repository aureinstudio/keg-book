/**
 * 발행 큐 — 채널별 payload 스키마 + 핸들러 결과 타입.
 *
 * payload 는 `publish_jobs.payload_json` 에 JSON 문자열로 저장된다.
 * 핸들러는 채널별 payload 타입을 받아 외부 API 호출을 수행하고,
 * 성공/일시 실패/영구 실패 셋 중 하나의 결과를 반환한다.
 */

export type BufferJobPayload = {
  channelId: string;
  text: string;
  /** 첨부할 이미지 (인스타 캐러셀용). 공개 URL 만. */
  images?: Array<{ url: string; thumbnailUrl?: string }>;
  /** Buffer 게시 모드 — 기본 addToQueue */
  mode?: "addToQueue" | "shareNow" | "shareNext";
};

/** 향후 추가 — 현재는 Buffer 만 구현. */
export type JobPayload = BufferJobPayload;

/** 핸들러 결과 — 성공/일시실패(재시도)/영구실패(즉시 failed). */
export type HandlerResult =
  | { kind: "ok"; externalId?: string; note?: string }
  | { kind: "retryable"; error: string }
  | { kind: "fatal"; error: string };

export type ChannelKind = "buffer";

export type JobHandler<P> = (payload: P) => Promise<HandlerResult>;
