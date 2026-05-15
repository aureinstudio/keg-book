"use server";

import { generateAllChannels, type ChannelContent } from "@/lib/gemini/generateAllChannels";
import { auth } from "@/auth";
import { createGeneration, logActivity } from "@/lib/db/generations";
import { uploadPngBase64 } from "@/lib/db/storage";

export type GenerateResult =
  | { ok: true; data: ChannelContent; keyword: string; generationId: string | null }
  | { ok: false; error: string };

export async function generateContentAction(formData: FormData): Promise<GenerateResult> {
  const keyword = String(formData.get("keyword") ?? "").trim();
  const productName = String(formData.get("productName") ?? "").trim() || undefined;
  const targetAudience = String(formData.get("targetAudience") ?? "").trim() || undefined;
  const context = String(formData.get("context") ?? "").trim() || undefined;

  if (!keyword) {
    return { ok: false, error: "키워드를 입력해주세요." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.",
    };
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || undefined;

  // 로그인 사용자 정보 (없어도 동작)
  const session = await auth().catch(() => null);
  const userEmail = session?.user?.email ?? null;
  const userName = session?.user?.name ?? null;

  try {
    const data = await generateAllChannels({
      apiKey,
      anthropicApiKey,
      keyword,
      productName,
      targetAudience,
      context,
    });

    // 카드뉴스 base64 → Supabase Storage 업로드 (성공 시 URL로 대체)
    if (data.cardNews?.slides?.length) {
      const stamp = Date.now();
      const safeKeyword = keyword.replace(/[^a-zA-Z0-9가-힣]/g, "_").slice(0, 30);
      await Promise.all(
        data.cardNews.slides.map(async (slide, i) => {
          if (!slide.imageBase64) return;
          const url = await uploadPngBase64({
            base64: slide.imageBase64,
            pathPrefix: `generations/${stamp}_${safeKeyword}`,
            filename: `slide_${i + 1}.png`,
          });
          if (url) {
            slide.imageUrl = url;
            slide.imageBase64 = null; // 클라이언트/DB 페이로드 경량화
          }
        }),
      );
    }

    // DB 저장 — 실패해도 결과는 반환 (생성은 성공한 상태이므로)
    let generationId: string | null = null;
    try {
      const gen = await createGeneration({
        keyword,
        productName,
        targetAudience,
        context,
        rawJson: data,
        userEmail,
        userName,
      });
      generationId = gen.id;

      await logActivity({
        userEmail,
        userName,
        action: "generate",
        targetType: "generation",
        targetId: gen.id,
        detail: { keyword, productName },
      });
    } catch (dbErr) {
      console.warn("[generate] DB 저장 실패 (계속 진행):", dbErr);
    }

    return { ok: true, data, keyword, generationId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `생성 실패: ${msg}` };
  }
}
