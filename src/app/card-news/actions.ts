"use server";

import { generateCardNewsPngBuffer } from "@/lib/gemini/generateCardNewsImage";
import { sanitizeFilenameBase, writeOutputTextFile } from "@/lib/output/writeTextFile";
import fs from "node:fs/promises";
import path from "node:path";

export type CardNewsFormState =
  | null
  | {
      ok: true;
      promptPath: string;
      pngPath?: string;
      skippedImage?: boolean;
    }
  | { ok: false; error: string; promptPath?: string };

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

  const { relativePath: promptPath } = await writeOutputTextFile(
    "card-news",
    `${stem}_prompt.txt`,
    prompt,
  );

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return {
      ok: true,
      promptPath,
      skippedImage: true,
    };
  }

  try {
    const buf = await generateCardNewsPngBuffer({ apiKey: key, prompt });
    const outDir = path.join(process.cwd(), "_output", "card-news");
    await fs.mkdir(outDir, { recursive: true });
    const pngName = `${stem}.png`;
    const pngFp = path.join(outDir, pngName);
    await fs.writeFile(pngFp, buf);
    return {
      ok: true,
      promptPath,
      pngPath: path.relative(process.cwd(), pngFp).replace(/\\/g, "/"),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "이미지 생성 오류";
    return {
      ok: false,
      promptPath,
      error: msg,
    };
  }
}
