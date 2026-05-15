import { getDb } from "./supabase";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "card-news";

/**
 * base64 PNG → Supabase Storage 업로드 → 공개 URL 반환.
 * Storage 미설정/실패 시 null (호출자는 base64 fallback 사용).
 */
export async function uploadPngBase64(params: {
  base64: string;
  pathPrefix: string;
  filename: string;
}): Promise<string | null> {
  try {
    const db = getDb();
    const buf = Buffer.from(params.base64, "base64");
    const key = `${params.pathPrefix.replace(/^\/+|\/+$/g, "")}/${params.filename}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(key, buf, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.warn("[storage] upload failed:", error.message);
      return null;
    }

    const { data } = db.storage.from(BUCKET).getPublicUrl(key);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn("[storage] uploadPngBase64 error:", e instanceof Error ? e.message : e);
    return null;
  }
}
