-- keg-book 발행 큐 테이블
-- Supabase Dashboard > SQL Editor 에서 실행하거나
-- supabase db push 로 적용하세요.

CREATE TABLE IF NOT EXISTS publish_jobs (
  id             TEXT        PRIMARY KEY NOT NULL,
  channel        TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending',
  payload_json   TEXT        NOT NULL DEFAULT '{}',
  scheduled_at   BIGINT,
  run_after      BIGINT,
  attempts       INTEGER     NOT NULL DEFAULT 0,
  max_attempts   INTEGER     NOT NULL DEFAULT 3,
  last_error     TEXT,
  created_at     BIGINT      NOT NULL,
  updated_at     BIGINT      NOT NULL,

  CONSTRAINT publish_jobs_status_check
    CHECK (status IN ('pending','processing','done','failed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_status_run
  ON publish_jobs (status, run_after);

-- Row Level Security (팀 내부 도구 — 서버에서만 service_role 로 접근)
ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;

-- service_role 은 RLS 를 우회하므로 별도 정책 불필요.
-- 필요 시 anon/authenticated 에게도 READ 허용하려면 아래 주석 해제:
-- CREATE POLICY "allow_read" ON publish_jobs FOR SELECT USING (true);
