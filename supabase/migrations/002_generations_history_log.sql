-- ─────────────────────────────────────────────────────────────────
-- Phase 1: 콘텐츠 생성 이력 + 채널 초안 + 작업 로그
-- 적용: Supabase Dashboard → SQL Editor → paste & run
-- ─────────────────────────────────────────────────────────────────

-- 1) generations: /generate 1번 = 1 row (키워드 + 메타)
CREATE TABLE IF NOT EXISTS generations (
  id              TEXT        PRIMARY KEY NOT NULL,
  user_email      TEXT,
  user_name       TEXT,
  keyword         TEXT        NOT NULL,
  product_name    TEXT,
  target_audience TEXT,
  context         TEXT,
  raw_json        JSONB       NOT NULL,
  created_at      BIGINT      NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at
  ON generations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_user_email
  ON generations (user_email);

-- 2) channel_drafts: 1 generation → 5 row (채널별 발행 상태 독립 추적)
CREATE TABLE IF NOT EXISTS channel_drafts (
  id             TEXT        PRIMARY KEY NOT NULL,
  generation_id  TEXT        NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  channel        TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'draft',
  content_json   JSONB       NOT NULL,
  external_url   TEXT,
  updated_at     BIGINT      NOT NULL,
  CONSTRAINT channel_drafts_channel_check
    CHECK (channel IN ('blogger','naver','newsletter','instagram','threads','card-news')),
  CONSTRAINT channel_drafts_status_check
    CHECK (status IN ('draft','scheduled','published','archived'))
);

CREATE INDEX IF NOT EXISTS idx_channel_drafts_generation
  ON channel_drafts (generation_id);

CREATE INDEX IF NOT EXISTS idx_channel_drafts_status
  ON channel_drafts (channel, status);

-- 3) activity_log: 누가 언제 무엇을 했는지 (생성·발행·편집 등)
CREATE TABLE IF NOT EXISTS activity_log (
  id           BIGSERIAL   PRIMARY KEY,
  user_email   TEXT,
  user_name    TEXT,
  action       TEXT        NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  detail       JSONB,
  created_at   BIGINT      NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON activity_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user
  ON activity_log (user_email, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- RLS: 일단 활성화만 — 정책은 서비스 롤로 우회 (서버에서만 호출)
-- 필요 시 차후 user_email 기반 정책 추가
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE generations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log   ENABLE ROW LEVEL SECURITY;
