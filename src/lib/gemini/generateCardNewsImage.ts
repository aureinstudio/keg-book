import { GoogleGenAI } from "@google/genai";

/** 카드뉴스 1장 슬라이드용 (Nano Banana). */
const IMAGE_MODEL = "gemini-2.5-flash-image";

type InlineData = { data?: string; mimeType?: string };
type Part = { text?: string; inlineData?: InlineData };

/** 사용자가 업로드한 스타일 레퍼런스 이미지 (base64 + mimeType). */
export type ReferenceImage = { data: string; mimeType: string };

export async function generateCardNewsPngBuffer(params: {
  apiKey: string;
  prompt: string;
  /** 스타일 레퍼런스 이미지 — 있으면 프롬프트 앞에 inlineData 파트로 주입. */
  referenceImages?: ReferenceImage[];
}): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  // 레퍼런스 이미지를 먼저, 그 다음 텍스트 프롬프트. 모델이 이미지 스타일을 참고한다.
  const parts: Part[] = [];
  for (const ref of params.referenceImages ?? []) {
    if (ref?.data && ref?.mimeType) {
      parts.push({ inlineData: { data: ref.data, mimeType: ref.mimeType } });
    }
  }
  parts.push({ text: params.prompt });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      // 이 모델은 텍스트+이미지 둘 다 반환할 수 있어서 명시
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  // 응답에서 inlineData.data (base64 PNG) 추출
  const responseParts: Part[] = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    const b64 = part?.inlineData?.data;
    if (typeof b64 === "string" && b64.length > 0) {
      return Buffer.from(b64, "base64");
    }
  }

  // 이미지가 없으면 텍스트 응답에서 힌트 추출 (안전 필터 등)
  const textHint =
    responseParts
      .map((p) => p?.text?.trim())
      .filter(Boolean)
      .join(" ")
      .slice(0, 280) ||
    response?.text?.trim().slice(0, 280);

  throw new Error(
    textHint
      ? `이미지가 반환되지 않았습니다. 모델 응답: ${textHint}`
      : "이미지가 반환되지 않았습니다. 프롬프트·안전 필터·API 키 권한을 확인하세요.",
  );
}
