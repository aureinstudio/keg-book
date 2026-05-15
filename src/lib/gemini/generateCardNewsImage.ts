import { GoogleGenAI } from "@google/genai";

/** 카드뉴스 1장 슬라이드용 (Nano Banana). */
const IMAGE_MODEL = "gemini-2.5-flash-image";

type InlineData = { data?: string; mimeType?: string };
type Part = { text?: string; inlineData?: InlineData };

export async function generateCardNewsPngBuffer(params: {
  apiKey: string;
  prompt: string;
}): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: params.prompt }] }],
    config: {
      // 이 모델은 텍스트+이미지 둘 다 반환할 수 있어서 명시
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  // 응답에서 inlineData.data (base64 PNG) 추출
  const parts: Part[] = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const b64 = part?.inlineData?.data;
    if (typeof b64 === "string" && b64.length > 0) {
      return Buffer.from(b64, "base64");
    }
  }

  // 이미지가 없으면 텍스트 응답에서 힌트 추출 (안전 필터 등)
  const textHint =
    parts
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
