import {
  listRecentActivity,
  listRecentGenerations,
  type ActivityLog,
  type Generation,
} from "./generations";

/**
 * 발행 히스토리 — generation 1건에 어떤 채널에서 언제 발행/예약되었는지를 합친 뷰 모델.
 *
 * activity_log에 다음 형태로 기록되어 있다:
 *  - blogger: action="publish",  target_type="blogger",  target_id=postId,
 *             detail={ generationId, postUrl, title, labelCount }
 *  - naver:   action="publish",  target_type="naver",    target_id=generationId(or null),
 *             detail={ generationId, method:"html-copy", title, tagCount, bodyLen }
 *  - buffer:  action="schedule", target_type="buffer",   target_id=postId,
 *             detail={ generationId, channelId, textPreview, imageCount, carouselSkippedReason }
 *
 * "발행"의 의미는 채널마다 다르다:
 *  - Blogger: Google Blogger에 초안으로 저장된 시점
 *  - 네이버:  사용자가 HTML을 클립보드에 복사한 시점 (네이버 공식 API 없음)
 *  - Buffer:  IG/Threads 큐에 들어간 시점 (실제 게시는 Buffer가 처리)
 */

export type PublishChannel =
  | "blogger"
  | "naver"
  | "buffer-instagram"
  | "buffer-threads"
  | "buffer";

export type PublishRecord = {
  channel: PublishChannel;
  publishedAt: number;
  externalUrl: string | null;
  /** blogger postId / buffer postId / naver는 null */
  targetId: string | null;
  /** 사용자에게 보여줄 한 줄 요약 */
  summary: string;
  /** 원본 activity_log 행 id (디버그/링크용) */
  activityId: number;
};

export type GenerationWithPublish = Generation & {
  publishes: PublishRecord[];
  /** 가장 마지막 발행 시각 (정렬용). 없으면 null */
  lastPublishedAt: number | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function pickString(rec: Record<string, unknown>, k: string): string | null {
  const v = rec[k];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * activity_log 1행을 PublishRecord로 변환한다.
 * generationId를 식별할 수 없으면 null 반환 (히스토리에 묶이지 못함).
 */
function toPublishRecord(
  log: ActivityLog,
): { generationId: string; record: PublishRecord } | null {
  if (log.action !== "publish" && log.action !== "schedule") return null;
  const detail = asRecord(log.detail);
  // generationId 추정 — detail.generationId 우선, 네이버는 target_id가 generationId일 수 있음
  const generationId =
    pickString(detail, "generationId") ??
    (log.target_type === "naver" ? log.target_id : null);
  if (!generationId) return null;

  const targetType = log.target_type ?? "";
  const channelId = pickString(detail, "channelId");

  let channel: PublishChannel;
  if (targetType === "blogger") channel = "blogger";
  else if (targetType === "naver") channel = "naver";
  else if (targetType === "buffer") {
    // Buffer는 인스타/Threads를 channelId로 구분 — 단, channelId만으로는 모름.
    // 현 시점엔 "buffer" 통합 라벨로 표시하고, 향후 channelId→플랫폼 매핑 캐시 도입 가능.
    channel = "buffer";
  } else return null;

  // 한 줄 요약 (UI 직접 표시용)
  let summary = "";
  if (channel === "blogger") {
    summary =
      pickString(detail, "title") ??
      pickString(detail, "postUrl") ??
      "Blogger 초안 저장";
  } else if (channel === "naver") {
    const method = pickString(detail, "method") ?? "";
    summary =
      pickString(detail, "title") ??
      (method === "html-copy" ? "네이버용 HTML 복사" : "네이버 내보내기");
  } else {
    // buffer
    const preview = pickString(detail, "textPreview") ?? "";
    const imgs = typeof detail.imageCount === "number" ? detail.imageCount : 0;
    const skipped = pickString(detail, "carouselSkippedReason");
    summary =
      (preview ? `“${preview.slice(0, 40)}…”` : "Buffer 큐 추가") +
      (imgs > 0 ? ` · 이미지 ${imgs}장` : "") +
      (skipped ? ` (캐러셀 누락:${skipped})` : "") +
      (channelId ? ` · ch:${channelId.slice(0, 8)}` : "");
  }

  return {
    generationId,
    record: {
      channel,
      publishedAt: log.created_at,
      externalUrl: pickString(detail, "postUrl"),
      targetId: log.target_id ?? null,
      summary,
      activityId: log.id,
    },
  };
}

/**
 * 최근 generation N건 + 그에 묶인 발행 기록들.
 * - generations와 activity_log를 메모리에서 join (Supabase JSON 필터 회피)
 * - activityLimit은 generationLimit 대비 넉넉하게 — 한 generation당 다수 채널 발행 가능
 */
export async function getPublishHistory(
  generationLimit = 30,
  activityLimit = 300,
): Promise<GenerationWithPublish[]> {
  const [generations, activities] = await Promise.all([
    listRecentGenerations(generationLimit).catch(() => [] as Generation[]),
    listRecentActivity(activityLimit).catch(() => [] as ActivityLog[]),
  ]);

  // generationId → PublishRecord[]
  const byGeneration = new Map<string, PublishRecord[]>();
  for (const a of activities) {
    const parsed = toPublishRecord(a);
    if (!parsed) continue;
    const arr = byGeneration.get(parsed.generationId) ?? [];
    arr.push(parsed.record);
    byGeneration.set(parsed.generationId, arr);
  }

  // 각 generation에 발행 기록 부착 + 정렬
  return generations.map((g) => {
    const publishes = (byGeneration.get(g.id) ?? []).slice().sort(
      (a, b) => b.publishedAt - a.publishedAt,
    );
    const lastPublishedAt =
      publishes.length > 0 ? publishes[0].publishedAt : null;
    return { ...g, publishes, lastPublishedAt };
  });
}

/** 한 generation 안에서 채널 묶음을 만든다 — UI 카드 그리는 데 사용. */
export function groupPublishesByChannel(
  publishes: PublishRecord[],
): Partial<Record<PublishChannel, PublishRecord[]>> {
  const out: Partial<Record<PublishChannel, PublishRecord[]>> = {};
  for (const p of publishes) {
    const arr = out[p.channel] ?? [];
    arr.push(p);
    out[p.channel] = arr;
  }
  return out;
}
