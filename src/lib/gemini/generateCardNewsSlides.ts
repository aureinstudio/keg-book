import { GoogleGenAI } from "@google/genai";
import {
  generateCardNewsPngBuffer,
  type ReferenceImage,
} from "./generateCardNewsImage";

const FLASH_MODEL = "gemini-3-flash-preview";

export type CardSlide = {
  /** 카드 안내 (표지/본문/아웃트로 등) */
  role: "cover" | "body" | "outro";
  /** 헤드라인 (이미지에 들어갈 제목 텍스트) */
  headline: string;
  /** 이미지 생성용 프롬프트 — 영문·시각 묘사 위주 */
  imagePrompt: string;
  /** 생성된 PNG base64 (Storage 업로드 후 비워질 수 있음) */
  imageBase64: string | null;
  /** Supabase Storage 공개 URL (업로드 성공 시) */
  imageUrl?: string | null;
};

export type CardNewsContent = {
  slides: CardSlide[];
  /** 생성 중 오류 메시지 (전체 실패면 slides가 빈 배열) */
  error?: string;
};

function stripCodeBlock(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

const SLIDE_PROMPT_SYSTEM = `당신은 한국 교재 마케팅용 카드뉴스 슬라이드 기획자입니다.
교육·신뢰 톤을 유지하며, 과장 광고체는 사용하지 않습니다.
반드시 유효한 JSON만 응답하세요. 마크다운 코드블록 금지.`;

async function planSlides(params: {
  apiKey: string;
  keyword: string;
  productName?: string;
  targetAudience?: string;
  context?: string;
  count: number;
}): Promise<Omit<CardSlide, "imageBase64">[]> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  const meta = [
    params.productName ? `교재/제품명: ${params.productName}` : "",
    params.targetAudience ? `타겟 독자: ${params.targetAudience}` : "",
    params.context ? `추가 맥락: ${params.context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const roleHint =
    params.count === 1
      ? `["cover"]`
      : params.count === 3
      ? `["cover","body","body"]`
      : `["cover","body","body","body","outro"]`;

  const prompt = `다음 키워드를 ${params.count}장의 한국어 카드뉴스 슬라이드로 기획하세요.

키워드: ${params.keyword}
${meta}

규칙:
- 1번 슬라이드는 표지(cover) — 강력한 후킹 헤드라인
- 본문(body) 슬라이드는 핵심 포인트 1개씩
- 마지막이 outro면 행동유도(CTA) 메시지
- headline은 한국어 10~25자 — 이미지 위에 큰 글씨로 들어감
- imagePrompt는 영문 — 시각 묘사 위주. "Korean educational poster, flat illustration, soft pastel colors, modern editorial style" 같은 스타일 키워드 포함. 텍스트는 imagePrompt에 넣지 말 것 (텍스트는 별도 합성).

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "slides": [
    {
      "role": "cover" | "body" | "outro" (순서대로 ${roleHint}),
      "headline": "한국어 헤드라인 (10~25자)",
      "imagePrompt": "Detailed English visual prompt for Gemini image model"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SLIDE_PROMPT_SYSTEM,
      temperature: 0.8,
      maxOutputTokens: 2048,
    },
  });

  const raw = response.text?.trim() ?? "";
  const parsed = JSON.parse(stripCodeBlock(raw)) as {
    slides: Omit<CardSlide, "imageBase64">[];
  };
  return parsed.slides.slice(0, params.count);
}

/**
 * 키워드 → 카드뉴스 N장 시리즈 (프롬프트 자동 기획 + 병렬 이미지 생성).
 * 실패해도 부분 결과를 반환 (성공한 슬라이드만 imageBase64 채움).
 */
export async function generateCardNewsSlides(params: {
  apiKey: string;
  keyword: string;
  productName?: string;
  targetAudience?: string;
  context?: string;
  count?: number;
  /** 사용자가 업로드한 스타일 레퍼런스 이미지 — 있으면 모든 슬라이드에 스타일 참고로 주입. */
  referenceImages?: ReferenceImage[];
}): Promise<CardNewsContent> {
  const count = params.count ?? 3;
  const refs = params.referenceImages ?? [];
  const hasRefs = refs.length > 0;

  let plans: Omit<CardSlide, "imageBase64">[];
  try {
    plans = await planSlides({ ...params, count });
  } catch (e) {
    return {
      slides: [],
      error: `슬라이드 기획 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // 병렬 이미지 생성. 1장 실패는 그 슬라이드만 null로.
  const results = await Promise.allSettled(
    plans.map(async (plan) => {
      const styleClause = hasRefs
        ? "Match the visual style, color palette, composition and illustration treatment of the provided reference image(s) as closely as possible."
        : "flat editorial illustration style, soft pastel palette,";
      const styledPrompt = `${plan.imagePrompt}. Korean educational marketing card news visual, vertical 4:5 aspect, clean composition with empty space at top for headline text overlay, ${styleClause} no text in image.`;
      const buf = await generateCardNewsPngBuffer({
        apiKey: params.apiKey,
        prompt: styledPrompt,
        referenceImages: refs,
      });
      return buf.toString("base64");
    }),
  );

  const slides: CardSlide[] = plans.map((plan, i) => {
    const r = results[i];
    return {
      ...plan,
      imageBase64: r.status === "fulfilled" ? r.value : null,
    };
  });

  const failedCount = results.filter((r) => r.status === "rejected").length;
  return {
    slides,
    error:
      failedCount > 0
        ? `이미지 ${failedCount}/${count}장 생성 실패 (헤드라인은 표시됩니다)`
        : undefined,
  };
}
