"use server";

import { auth } from "@/auth";
import { createBufferTextPost } from "@/lib/buffer/createBufferPost";
import { getGeneration, logActivity } from "@/lib/db/generations";
import type { CardSlide } from "@/lib/gemini/generateCardNewsSlides";
import { redirect } from "next/navigation";

export async function submitBufferQueue(formData: FormData) {
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();
  if (!token) {
    redirect(
      "/social?bf=err&msg=" +
        encodeURIComponent("BUFFER_API_ACCESS_TOKEN이 설정되어 있지 않습니다."),
    );
  }
  const channelId = String(formData.get("channelId") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const generationId = String(formData.get("generationId") ?? "").trim();
  const attachCarousel = String(formData.get("attachCarousel") ?? "") === "1";

  if (!channelId || !text) {
    redirect(
      "/social?bf=err&msg=" +
        encodeURIComponent("채널과 본문을 모두 입력하세요."),
    );
  }

  const session = await auth().catch(() => null);

  // ── 카드뉴스 자동 첨부 (인스타 캐러셀)
  // ──────────────────────────────────────────
  // generationId가 있고 사용자가 첨부를 켜면, generation.raw_json.cardNews.slides[]의
  // imageUrl(Supabase Storage 공개 URL)을 순서대로 assets로 전달한다.
  let images: { url: string }[] = [];
  let attachedImageCount = 0;
  if (generationId && attachCarousel) {
    try {
      const gen = await getGeneration(generationId);
      const slides = (gen?.raw_json?.cardNews?.slides ?? []) as CardSlide[];
      images = slides
        .map((s) => s.imageUrl)
        .filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)))
        .map((url) => ({ url }));
      attachedImageCount = images.length;
    } catch (e) {
      // 첨부 실패해도 텍스트는 보낸다. 메시지만 남김.
      console.warn("[social] 캐러셀 첨부용 generation 조회 실패:", e);
    }
  }

  let postId: string;
  try {
    const res = await createBufferTextPost({
      accessToken: token,
      channelId,
      text,
      images,
    });
    postId = res.postId;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Buffer 큐 저장 실패";
    redirect("/social?bf=err&msg=" + encodeURIComponent(msg.slice(0, 220)));
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
    },
  }).catch(() => {});

  const params = new URLSearchParams({
    bf: "ok",
    postId,
  });
  if (attachedImageCount > 0) params.set("imgs", String(attachedImageCount));
  redirect("/social?" + params.toString());
}
