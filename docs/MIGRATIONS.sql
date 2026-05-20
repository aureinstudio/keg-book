-- =========================================================================
-- keg-book Supabase 스키마 (publish_jobs / generations / activity_log)
-- =========================================================================
-- 이 파일은 Supabase SQL Editor 또는 psql 로 한 번 실행하여 테이블을 구성한다.
-- 각 블록은 idempotent(IF NOT EXISTS) 하므로 재실행해도 안전하다.
--
-- 적용 순서:
--   1) publish_jobs        — 채널별 발행 큐 (src/lib/db/publishQueue.ts)
--   2) generations         — Gemini 생성 결과 보관 (src/lib/db/generations.ts)
--   3) activity_log        — 사용자 행동/배포 흔적 기록
--   4) 인덱스
--   5) RLS (Row Level Security) — 서비스 키만 접근하도록 default deny
-- =========================================================================

-- 1) publish_jobs ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publish_jobs (
  id              UUID        PRIMARY KEY,
  channel         TEXT        NOT NULL,
  status          TEXT        NOT NULL
    CHECK (status IN ('pending','processing','done','failed','cancelled')),
  payload_json    TEXT        NOT NULL,
  scheduled_at    BIGINT      NULL,
  run_after       BIGINT      NULL,
  attempts        INTEGER     NOT NULL DEFAULT 0,
  max_attempts    INTEGER     NOT NULL DEFAULT 3,
  last_error      TEXT        NULL,
  created_at      BIGINT      NOT NULL,
  updated_at      BIGINT      NOT NULL
);

-- 2) generations -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword         TEXT        NOT NULL,
  product_name    TEXT        NULL,
  target_audience TEXT        NULL,
  context         TEXT        NULL,
  raw_json        JSONB       NOT NULL,
  user_email      TEXT        NULL,
  user_name       TEXT        NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) activity_log ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT        NULL,
  user_name       TEXT        NULL,
  action          TEXT        NOT NULL,       -- 'generate' | 'publish' | 'schedule' 등
  target_type     TEXT        NOT NULL,       -- 'blogger' | 'naver' | 'buffer' | 'generation' …
  target_id       TEXT        NULL,
  detail          JSONB       NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) 인덱스 ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS publish_jobs_status_created_idx
  ON public.publish_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS publish_jobs_channel_idx
  ON public.publish_jobs (channel);
CREATE INDEX IF NOT EXISTS publish_jobs_run_after_idx
  ON public.publish_jobs (run_after)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS generations_created_idx
  ON public.generations (created_at DESC);
CREATE INDEX IF NOT EXISTS generations_keyword_idx
  ON public.generations (keyword);

CREATE INDEX IF NOT EXISTS activity_log_created_idx
  ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_target_idx
  ON public.activity_log (target_type, target_id);

-- 5) RLS (default deny — service_role 키로만 서버에서 접근) ---------------
ALTER TABLE public.publish_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log  ENABLE ROW LEVEL SECURITY;

-- 익명·anon 키 사용 시 모든 접근 차단 (이 앱은 service_role 키로만 호출).
-- 정책 자체를 두지 않으면 RLS 가 모든 row 를 hide 함 → default deny.
-- 필요 시 다음과 같은 정책 추가:
-- CREATE POLICY publish_jobs_service ON public.publish_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
