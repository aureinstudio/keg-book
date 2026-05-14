export type OutputSubfolder =
  | "blogger"
  | "naver-blog"
  | "newsletter"
  | "social-instagram"
  | "social-threads"
  | "card-news"
  | "shared";

export function sanitizeFilenameBase(s: string): string {
  const t = s
    .trim()
    .slice(0, 80)
    .replace(/[^\w가-힣-]+/gu, "_")
    .replace(/_+/g, "_");
  return t || "draft";
}

/**
 * Supabase Storage에 파일 저장.
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없으면 로컬 /tmp 에 저장(개발용 fallback).
 */
export async function writeOutputTextFile(
  subfolder: OutputSubfolder,
  filename: string,
  body: string,
): Promise<{ relativePath: string; url?: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "keg-outputs";

  if (supabaseUrl && serviceKey) {
    // ── Supabase Storage 경로: {subfolder}/{filename}
    const storagePath = `${subfolder}/${filename}`;
    const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "text/plain; charset=utf-8",
        "x-upsert": "true",
      },
      body,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Supabase Storage 업로드 실패 (${res.status}): ${detail}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
    return { relativePath: `${bucket}/${storagePath}`, url: publicUrl };
  }

  // ── 로컬 fallback (개발 환경)
  const { default: fs } = await import("node:fs/promises");
  const { default: path } = await import("node:path");
  const dir = path.join(process.cwd(), "_output", subfolder);
  await fs.mkdir(dir, { recursive: true });
  const fp = path.join(dir, filename);
  await fs.writeFile(fp, body, "utf8");
  return { relativePath: path.relative(process.cwd(), fp).replace(/\\/g, "/") };
}
