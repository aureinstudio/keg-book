import { GoogleGenAI } from "@google/genai";

/** 카드뉴스 1장 슬라이드용(문서: gemini-2.5-flash-image). */
const IMAGE_MODEL = "gemini-2.5-flash-image";

export async function generateCardNewsPngBuffer(params: {
  apiKey: string;
  prompt: string;
}): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: params.prompt,
  });

  const b64 = response.data;
  if (b64) {
    return Buffer.from(b64, "base64");
  }

  const hint = response.text?.trim().slice(0, 280);
  throw new Error(
    hint
      ? `이미지가 반환되지 않았습니다. 모델 응답: ${hint}`
      : "이미지가 반환되지 않았습니다. 프롬프트·정책(안전 필터)을 확인하세요.",
  );
}
