"use server";

import { auth } from "@/auth";
import {
  sanitizeFilenameBase,
  writeOutputTextFile,
  type OutputSubfolder,
} from "@/lib/output/writeTextFile";

const ALLOWED: OutputSubfolder[] = [
  "blogger",
  "naver-blog",
  "newsletter",
  "social-instagram",
  "social-threads",
  "card-news",
  "shared",
];

export type SaveOutputDraftResult =
  | { ok: true; relativePath: string }
  | { ok: false; error: string };

export async function saveOutputDraftAction(input: {
  subfolder: OutputSubfolder;
  /** 파일명 접두에 쓸 짧은 설명 (날짜는 서버에서 붙임) */
  base: string;
  /** 예: `.md`, `.html`, `.txt` */
  ext: string;
  content: string;
}): Promise<SaveOutputDraftResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { ok: false, error: "로그인이 필요합니다." };
    }
    if (!ALLOWED.includes(input.subfolder)) {
      return { ok: false, error: "허용되지 않은 폴더입니다." };
    }
    const base = sanitizeFilenameBase(input.base);
    let ext = (input.ext || ".md").trim();
    if (!ext.startsWith(".")) ext = `.${ext}`;
    if (!/^\.[a-z0-9]+$/i.test(ext)) ext = ".md";
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${date}_${base}${ext}`;
    const { relativePath } = await writeOutputTextFile(
      input.subfolder,
      filename,
      input.content,
    );
    return { ok: true, relativePath };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return { ok: false, error: msg };
  }
}
