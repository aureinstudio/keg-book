import { getDb } from "./supabase";

export type PublishJobStatus = "pending" | "processing" | "done" | "failed" | "cancelled";

export type PublishJobRow = {
  id: string;
  channel: string;
  status: PublishJobStatus;
  payload_json: string;
  scheduled_at: number | null;
  run_after: number | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: number;
  updated_at: number;
};

export async function enqueuePublishJob(input: {
  channel: string;
  payload: unknown;
  scheduledAt?: number | null;
  runAfter?: number | null;
  maxAttempts?: number;
}): Promise<PublishJobRow> {
  const db = getDb();
  const now = Date.now();
  const id = crypto.randomUUID();

  const row: PublishJobRow = {
    id,
    channel: input.channel,
    status: "pending",
    payload_json: JSON.stringify(input.payload ?? {}),
    scheduled_at: input.scheduledAt ?? null,
    run_after: input.runAfter ?? null,
    attempts: 0,
    max_attempts: input.maxAttempts ?? 3,
    last_error: null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await db.from("publish_jobs").insert(row);
  if (error) throw new Error(`enqueuePublishJob 실패: ${error.message}`);

  return row;
}

export async function getPublishJobById(id: string): Promise<PublishJobRow | null> {
  const db = getDb();
  const { data, error } = await db
    .from("publish_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as PublishJobRow;
}

export async function listPublishJobs(limit = 80): Promise<PublishJobRow[]> {
  const db = getDb();
  const { data, error } = await db
    .from("publish_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listPublishJobs 실패: ${error.message}`);
  return (data ?? []) as PublishJobRow[];
}

export async function updatePublishJobStatus(
  id: string,
  status: PublishJobStatus,
  patch?: { lastError?: string | null; attemptsDelta?: number },
): Promise<void> {
  const db = getDb();
  const now = Date.now();

  if (patch?.attemptsDelta) {
    // attempts 증분은 RPC 또는 read-then-write로 처리
    const existing = await getPublishJobById(id);
    if (!existing) throw new Error("작업을 찾을 수 없습니다.");

    const { error } = await db
      .from("publish_jobs")
      .update({
        status,
        updated_at: now,
        last_error: patch.lastError ?? existing.last_error,
        attempts: existing.attempts + patch.attemptsDelta,
      })
      .eq("id", id);
    if (error) throw new Error(`updatePublishJobStatus 실패: ${error.message}`);
  } else {
    const { error } = await db
      .from("publish_jobs")
      .update({
        status,
        updated_at: now,
        last_error: patch?.lastError ?? null,
      })
      .eq("id", id);
    if (error) throw new Error(`updatePublishJobStatus 실패: ${error.message}`);
  }
}

/**
 * 워커 전용 — `pending` 상태이면서 실행 가능 시각이 도래한 잡을 조회.
 * 실제 claim 은 별도 (atomic UPDATE) 단계에서 수행한다.
 */
export async function listClaimablePendingJobs(
  limit = 10,
): Promise<PublishJobRow[]> {
  const db = getDb();
  const now = Date.now();
  const { data, error } = await db
    .from("publish_jobs")
    .select("*")
    .eq("status", "pending")
    .or(`run_after.is.null,run_after.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`listClaimablePendingJobs 실패: ${error.message}`);
  return (data ?? []) as PublishJobRow[];
}

/**
 * 잡을 원자적으로 claim — `status = 'pending'` 조건과 함께 UPDATE.
 * 다른 워커가 동시에 같은 잡을 claim 시도하면 한 쪽만 성공한다 (Supabase 가
 * UPDATE...WHERE 의 row count 를 반환).
 *
 * @returns claim 성공 시 갱신된 row, 실패(이미 다른 워커가 가져감)면 null.
 */
export async function claimJob(id: string): Promise<PublishJobRow | null> {
  const db = getDb();
  const now = Date.now();
  const { data, error } = await db
    .from("publish_jobs")
    .update({ status: "processing", updated_at: now })
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) {
    // 경합 시점 race condition 은 정상 — 에러 throw 하지 않음
    if (/no\s*rows|0\s*rows/i.test(error.message)) return null;
    throw new Error(`claimJob 실패: ${error.message}`);
  }
  return (data as PublishJobRow | null) ?? null;
}

export async function markJobDone(id: string): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const { error } = await db
    .from("publish_jobs")
    .update({ status: "done", updated_at: now, last_error: null })
    .eq("id", id);
  if (error) throw new Error(`markJobDone 실패: ${error.message}`);
}

/**
 * 실패 후 재시도 가능하면 pending 상태로 되돌리고 run_after 를 미루며
 * attempts 를 증가시킨다. max_attempts 도달 시 failed 로 종료한다.
 */
export async function requeueOrFail(
  job: PublishJobRow,
  errorMessage: string,
  nextRunAfter: number,
): Promise<{ status: "pending" | "failed"; attempts: number }> {
  const db = getDb();
  const now = Date.now();
  const nextAttempts = job.attempts + 1;
  const reachedMax = nextAttempts >= job.max_attempts;

  if (reachedMax) {
    const { error } = await db
      .from("publish_jobs")
      .update({
        status: "failed",
        attempts: nextAttempts,
        last_error: errorMessage.slice(0, 500),
        updated_at: now,
      })
      .eq("id", job.id);
    if (error) throw new Error(`requeueOrFail(failed) 실패: ${error.message}`);
    return { status: "failed", attempts: nextAttempts };
  }

  const { error } = await db
    .from("publish_jobs")
    .update({
      status: "pending",
      attempts: nextAttempts,
      last_error: errorMessage.slice(0, 500),
      run_after: nextRunAfter,
      updated_at: now,
    })
    .eq("id", job.id);
  if (error) throw new Error(`requeueOrFail(retry) 실패: ${error.message}`);
  return { status: "pending", attempts: nextAttempts };
}

export async function publishJobStats(): Promise<Record<PublishJobStatus | "total", number>> {
  const db = getDb();
  const { data, error } = await db
    .from("publish_jobs")
    .select("status");

  const out: Record<PublishJobStatus | "total", number> = {
    pending: 0, processing: 0, done: 0, failed: 0, cancelled: 0, total: 0,
  };

  if (error || !data) return out;

  for (const row of data as { status: PublishJobStatus }[]) {
    out[row.status] = (out[row.status] ?? 0) + 1;
    out.total += 1;
  }
  return out;
}
