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
