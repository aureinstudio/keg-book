import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

function buildClient(): AnySupabase {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다.\n" +
        ".env 파일에 SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 추가하세요.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Next.js hot-reload 대응 싱글톤
const g = globalThis as unknown as { _kegSupabase?: AnySupabase };

export function getDb(): AnySupabase {
  if (!g._kegSupabase) {
    g._kegSupabase = buildClient();
  }
  return g._kegSupabase;
}
