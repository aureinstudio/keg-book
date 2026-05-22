"use server";

import { auth } from "@/auth";
import { createBufferTextPost } from "@/lib/buffer/createBufferPost";
import { listBufferChannels } from "@/lib/buffer/listBufferChannels";
import { getGeneration, logActivity } from "@/lib/db/generations";
import { enqueuePublishJob } from "@/lib/db/publishQueue";
import type { CardSlide } from "@/lib/gemini/generateCardNewsSlides";
import { redirect } from "next/navigation";

/**
 * Buffer가 던진 raw 에러 메시지를 사용자에게 보여줄 한 줄로 정규화한다.
 * - 401 / Unauthorized → 토큰 만료/회수 안내
 * - channel disconnected / not found → 채널 재연결 안내
 * - 그 외는 원문을 220자로 자른다(개인정보·내부 토큰 노출 방지 위해 길이 제한).
 */
function humanizeBufferError(raw: string): string {
  const s = raw.toLowerCase();
  if (/401|unauthor|invalid token|token expired|forbidden/.test(s)) {
    return "Buffer 토큰이 만료되었거나 권한이 없습니다. Buffer Publish 설정에서 API 토큰을 재발급해 환경설정을 갱신해 주세요.";
  }
  if (/channel.*(disconnected|not.?found|locked)/.test(s)) {
    return "선택한 채널이 연결 해제되었거나 잠겨 있습니다. Buffer 대시보드에서 채널을 다시 연결한 뒤 시도해 주세요.";
  }
  if (/rate.?limit|too many requests|429/.test(s)) {
    return "Buffer 요청이 너무 많습니다(rate limit). 잠시 후 다시 시도해 주세요.";
  }
  if (/network|fetch failed|enotfound|econnreset/.test(s)) {
    return "Buffer 서버에 도달할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  return raw.slice(0, 220);
}

function socialRedirect(params: Record<string, string | undefined>): never {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, v);
  }
  redirect(`/social${q.toString() ? `?${q}` : ""}`);
}

export async function submitBufferQueue(formData: FormData) {
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();
  if (!token) {
    // 환경변수 이름을 사용자 메시지에 노출하지 않는다(공격자에 힌트 제공 방지).
    console.warn("[social] BUFFER_API_ACCESS_TOKEN missing");
    socialRedirect({
      bf: "err",
      msg: "Buffer 연동이 구성되지 않았습니다. 관리자에게 문의해 주세요.",
    });
  }
  const channelId = String(formData.get("channelId") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const generationId = String(formData.get("generationId") ?? "").trim();
  const attachCarousel = String(formData.get("attachCarousel") ?? "") === "1";

  if (!channelId || !text) {
    socialRedirect({ bf: "err", msg: "채널과 본문을 모두 입력하세요." });
  }

  const session = await auth().catch(() => null);

  // ── 사전 채널 가드: disconnected/locked는 미리 거른다.
  // Buffer가 발행 시점에 던지는 raw 에러보다 사용자에게 빠른 피드백 제공.
  try {
    const chans = await listBufferChannels(token!);
    const found = chans.find((c) => c.id === channelId);
    if (!found) {
      socialRedirect({
        bf: "err",
        msg: "선택한 채널을 찾을 수 없습니다. Buffer 대시보드에서 채널 연결 상태를 확인해 주세요.",
      });
    } else if (found.isDisconnected) {
      socialRedirect({
        bf: "err",
        msg: `"${found.name}" 채널이 연결 해제되어 있습니다. Buffer에서 다시 연결한 뒤 시도해 주세요.`,
      });
    } else if (found.isLocked) {
      socialRedirect({
        bf: "err",
        msg: `"${found.name}" 채널이 잠겨 있습니다(플랜 한도/결제 이슈 가능). Buffer 대시보드를 확인해 주세요.`,
      });
    }
  } catch (e) {
    // 채널 목록 조회 자체가 실패하면 401 가능성 — 친절 메시지로.
    const raw = e instanceof Error ? e.message : "Buffer 채널 조회 실패";
    socialRedirect({ bf: "err", msg: humanizeBufferError(raw) });
  }

  // ── 카드뉴스 자동 첨부 (인스타 캐러셀)
  // ──────────────────────────────────────────
  // generationId가 있고 사용자가 첨부를 켜면, generation.raw_json.cardNews.slides[]의
  // imageUrl(Supabase Storage 공개 URL)을 순서대로 assets로 전달한다.
  let images: { url: string }[] = [];
  let attachedImageCount = 0;
  let carouselSkippedReason: string | null = null;
  if (generationId && attachCarousel) {
    try {
      const gen = await getGeneration(generationId);
      const slides = (gen?.raw_json?.cardNews?.slides ?? []) as CardSlide[];
      images = slides
        .map((s) => s.imageUrl)
        .filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)))
        .map((url) => ({ url }));
      attachedImageCount = images.length;
      if (attachedImageCount === 0) {
        carouselSkippedReason =
          slides.length === 0
            ? "no-slides"
            : "no-public-urls"; // 슬라이드는 있지만 모두 비공개/blob/data URL
      }
    } catch (e) {
      carouselSkippedReason = "fetch-failed";
      console.warn("[social] 캐러셀 첨부용 generation 조회 실패:", e);
    }
  }

  let postId: string;
  try {
    const res = await createBufferTextPost({
      accessToken: token!,
      channelId,
      text,
      images,
    });
    postId = res.postId;
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Buffer 큐 저장 실패";
    socialRedirect({ bf: "err", msg: humanizeBufferError(raw) });
  }

  await logActivity({
    userEmail: session?.user?.email ?? null,
    userName: session?.user?.name ?? null,
    action: "schedule",
    targetType: "buffer",
    targetId: postId,
    detail: {
      channelId,
      textPreview: text.slice(0, 120),
      imageCount: attachedImageCount,
      generationId: generationId || null,
      carouselRequested: attachCarousel,
      carouselSkippedReason,
    },
  }).catch(() => {});

  socialRedirect({
    bf: "ok",
    postId,
    ...(attachedImageCount > 0 ? { imgs: String(attachedImageCount) } : {}),
    ...(carouselSkippedReason ? { warn: carouselSkippedReason } : {}),
  });
}

/**
 * 즉시 발행 대신 발행 큐(`publish_jobs`)에 적재한다.
 * - 워커 (`/api/cron/publish`) 가 주기적으로 picking 해서 실제 Buffer 호출 수행.
 * - 사전 채널 가드·카드뉴스 캐러셀 수집은 `submitBufferQueue` 와 동일하게 적용 (사용자 피드백 일관성).
 * - `scheduledAt` 가 있으면 `run_after` 로 동일 값 사용 → 그 시각 이후 첫 워커 사이클에서 처리.
 */
export async function enqueueBufferQueue(formData: FormData) {
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();
  if (!token) {
    console.warn("[social] BUFFER_API_ACCESS_TOKEN missing");
    socialRedirect({
      bf: "err",
      msg: "Buffer 연동이 구성되지 않았습니다. 관리자에게 문의해 주세요.",
    });
  }
  const channelId = String(formData.get("channelId") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const generationId = String(formData.get("generationId") ?? "").trim();
  const attachCarousel = String(formData.get("attachCarousel") ?? "") === "1";
  const scheduledRaw = String(formData.get("scheduledAt") ?? "").trim();

  if (!channelId || !text) {
    socialRedirect({ bf: "err", msg: "채널과 본문을 모두 입력하세요." });
  }

  let scheduledAt: number | null = null;
  if (scheduledRaw) {
    const t = Date.parse(scheduledRaw);
    if (Number.isNaN(t)) {
      socialRedirect({
        bf: "err",
        msg: "예약 시각 형식이 올바르지 않습니다.",
      });
    } else if (t < Date.now() - 60_000) {
      // 1분 이내 과거는 허용(클럭 스큐) — 그 이상은 거부
      socialRedirect({
        bf: "err",
        msg: "예약 시각은 현재 시각 이후여야 합니다.",
      });
    }
    scheduledAt = t;
  }

  const session = await auth().catch(() => null);

  // 사전 채널 가드 — Buffer 즉시 발행 경로와 동일하게 disconnected/locked 우선 차단
  try {
    const chans = await listBufferChannels(token!);
    const found = chans.find((c) => c.id === channelId);
    if (!found) {
      socialRedirect({
        bf: "err",
        msg: "선택한 채널을 찾을 수 없습니다. Buffer 대시보드에서 채널 연결 상태를 확인해 주세요.",
      });
    } else if (found.isDisconnected) {
      socialRedirect({
        bf: "err",
        msg: `"${found.name}" 채널이 연결 해제되어 있습니다. Buffer에서 다시 연결한 뒤 시도해 주세요.`,
      });
    } else if (found.isLocked) {
      socialRedirect({
        bf: "err",
        msg: `"${found.name}" 채널이 잠겨 있습니다(플랜 한도/결제 이슈 가능). Buffer 대시보드를 확인해 주세요.`,
      });
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Buffer 채널 조회 실패";
    socialRedirect({ bf: "err", msg: humanizeBufferError(raw) });
  }

  // 카드뉴스 캐러셀 자동 첨부 — 즉시 발행 경로와 동일 규칙
  let images: { url: string }[] = [];
  let attachedImageCount = 0;
  let carouselSkippedReason: string | null = null;
  if (generationId && attachCarousel) {
    try {
      const gen = await getGeneration(generationId);
      const slides = (gen?.raw_json?.cardNews?.slides ?? []) as CardSlide[];
      images = slides
        .map((s) => s.imageUrl)
        .filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)))
        .map((url) => ({ url }));
      attachedImageCount = images.length;
      if (attachedImageCount === 0) {
        carouselSkippedReason =
          slides.length === 0 ? "no-slides" : "no-public-urls";
      }
    } catch (e) {
      carouselSkippedReason = "fetch-failed";
      console.warn("[social] 캐러셀 첨부용 generation 조회 실패:", e);
    }
  }

  let jobId: string;
  try {
    const row = await enqueuePublishJob({
      channel: "buffer",
      payload: {
        channelId,
        text,
        ...(images.length > 0 ? { images } : {}),
        mode: "addToQueue",
      },
      scheduledAt,
      runAfter: scheduledAt,
    });
    jobId = row.id;
  } catch (e) {
    const raw = e instanceof Error ? e.message : "큐 적재 실패";
    socialRedirect({ bf: "err", msg: raw.slice(0, 220) });
  }

  await logActivity({
    userEmail: session?.user?.email ?? null,
    userName: session?.user?.name ?? null,
    action: "schedule",
    targetType: "publish_job",
    targetId: jobId,
    detail: {
      channel: "buffer",
      channelId,
      textPreview: text.slice(0, 120),
      imageCount: attachedImageCount,
      generationId: generationId || null,
      carouselRequested: attachCarousel,
      carouselSkippedReason,
      scheduledAt,
    },
  }).catch(() => {});

  socialRedirect({
    bf: "queued",
    jobId,
    ...(attachedImageCount > 0 ? { imgs: String(attachedImageCount) } : {}),
    ...(carouselSkippedReason ? { warn: carouselSkippedReason } : {}),
    ...(scheduledAt ? { when: String(scheduledAt) } : {}),
  });
}
