/**
 * 발행 큐 워커 — `pending` 잡을 한 배치 처리하는 단발 실행 함수.
 *
 * 호출자 (cron route / 수동 트리거) 가 일정 간격으로 `runQueueOnce` 를 부른다.
 * 한 번 호출 = 한 배치 (기본 10건). long-running loop 는 의도적으로 두지 않는다 —
 * Vercel serverless 환경에서 안전하게 동작하기 위해서.
 *
 * 흐름:
 *   1. listClaimablePendingJobs 로 후보 조회 (status=pending AND run_after 도래)
 *   2. claimJob 으로 원자적 점유 (다른 워커와 race 시 한 쪽만 성공)
 *   3. payload 파싱 → 채널 핸들러 호출
 *   4. 결과별로 markJobDone / requeueOrFail
 */

import {
  type PublishJobRow,
  claimJob,
  listClaimablePendingJobs,
  markJobDone,
  requeueOrFail,
} from "@/lib/db/publishQueue";
import { nextRunAfter } from "@/lib/queue/backoff";
import { HANDLERS, isSupportedChannel } from "@/lib/queue/handlers";
import type { JobPayload } from "@/lib/queue/types";

export type WorkerJobOutcome =
  | { id: string; channel: string; result: "ok"; externalId?: string }
  | { id: string; channel: string; result: "retry"; attempts: number; error: string }
  | { id: string; channel: string; result: "failed"; attempts: number; error: string }
  | { id: string; channel: string; result: "skipped"; reason: string };

export type WorkerRunResult = {
  scanned: number;
  claimed: number;
  outcomes: WorkerJobOutcome[];
};

export async function runQueueOnce(batchSize = 10): Promise<WorkerRunResult> {
  const candidates = await listClaimablePendingJobs(batchSize);
  const outcomes: WorkerJobOutcome[] = [];
  let claimed = 0;

  for (const candidate of candidates) {
    const job = await claimJob(candidate.id);
    if (!job) {
      // 다른 워커가 먼저 점유 — 정상. 다음 잡으로.
      continue;
    }
    claimed += 1;
    outcomes.push(await processClaimedJob(job));
  }

  return { scanned: candidates.length, claimed, outcomes };
}

async function processClaimedJob(job: PublishJobRow): Promise<WorkerJobOutcome> {
  if (!isSupportedChannel(job.channel)) {
    const msg = `미지원 채널: ${job.channel}`;
    const r = await requeueOrFail(job, msg, 0).catch((e) => ({
      status: "failed" as const,
      attempts: job.attempts + 1,
      _e: e,
    }));
    // 미지원 채널은 max_attempts 까지 갈 필요 없이 즉시 failed 로 끝내는 것이
    // 이상적이나 (단순화), 현재 requeueOrFail 은 max 도달까지 retry 한다.
    // 여기서는 의미 전달만 — 어차피 다음 시도에도 동일하게 실패한다.
    return {
      id: job.id,
      channel: job.channel,
      result: r.status === "failed" ? "failed" : "retry",
      attempts: r.attempts,
      error: msg,
    };
  }

  let payload: JobPayload;
  try {
    payload = JSON.parse(job.payload_json) as JobPayload;
  } catch (e) {
    const msg = `payload JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`;
    const r = await requeueOrFail(job, msg, nextRunAfter(job.attempts));
    return {
      id: job.id,
      channel: job.channel,
      result: r.status === "failed" ? "failed" : "retry",
      attempts: r.attempts,
      error: msg,
    };
  }

  const handler = HANDLERS[job.channel];
  const result = await handler(payload).catch((e) => ({
    kind: "retryable" as const,
    error: e instanceof Error ? e.message : String(e),
  }));

  if (result.kind === "ok") {
    await markJobDone(job.id);
    return {
      id: job.id,
      channel: job.channel,
      result: "ok",
      externalId: result.externalId,
    };
  }

  // fatal 은 즉시 max_attempts 로 점프 — 재시도 무의미.
  const isFatal = result.kind === "fatal";
  const runAfter = isFatal ? 0 : nextRunAfter(job.attempts);
  const jobForFail: PublishJobRow = isFatal
    ? { ...job, attempts: job.max_attempts - 1 }
    : job;

  const r = await requeueOrFail(jobForFail, result.error, runAfter);
  return {
    id: job.id,
    channel: job.channel,
    result: r.status === "failed" ? "failed" : "retry",
    attempts: r.attempts,
    error: result.error,
  };
}
