"use server";

import { generateAllChannels, type ChannelContent } from "@/lib/gemini/generateAllChannels";

export type GenerateResult =
  | { ok: true; data: ChannelContent; keyword: string }
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

  try {
    const data = await generateAllChannels({
      apiKey,
      anthropicApiKey,
      keyword,
      productName,
      targetAudience,
      context,
    });
    return { ok: true, data, keyword };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `생성 실패: ${msg}` };
  }
}
