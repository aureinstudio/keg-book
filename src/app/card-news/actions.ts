"use server";

import { generateCardNewsPngBuffer } from "@/lib/gemini/generateCardNewsImage";
import { uploadPngBase64 } from "@/lib/db/storage";
import { sanitizeFilenameBase } from "@/lib/output/writeTextFile";

export type CardNewsFormState =
  | null
  | {
      ok: true;
      filename: string;
      imageUrl?: string;
      imageBase64?: string;
      skippedImage?: boolean;
    }
  | { ok: false; error: string };

export async function generateCardNewsFormAction(
  _prev: CardNewsFormState,
  formData: FormData,
): Promise<CardNewsFormState> {
  const prompt = String(formData.get("prompt") ?? "").trim();
  const baseRaw = String(formData.get("base") ?? "card-slide");
  if (!prompt) {
    return { ok: false, error: "프롬프트를 입력하세요." };
  }

  const base = sanitizeFilenameBase(baseRaw);
  const date = new Date().toISOString().slice(0, 10);
  const stem = `${date}_${base}`;
  const filename = `${stem}.png`;

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return {
      ok: true,
      filename,
      skippedImage: true,
    };
  }

  try {
    const buf = await generateCardNewsPngBuffer({ apiKey: key, prompt });
    const base64 = buf.toString("base64");

    // Supabase Storage 업로드 시도 — 실패해도 base64 폴백으로 진행
    const imageUrl = await uploadPngBase64({
      base64,
      pathPrefix: `manual/${date}`,
      filename,
    });

    return {
      ok: true,
      filename,
      imageUrl: imageUrl ?? undefined,
      imageBase64: imageUrl ? undefined : base64,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "이미지 생성 오류";
    return { ok: false, error: msg };
  }
}
