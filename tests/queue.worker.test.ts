import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublishJobRow } from "@/lib/db/publishQueue";

vi.mock("@/lib/db/publishQueue", () => {
  return {
    listClaimablePendingJobs: vi.fn(),
    claimJob: vi.fn(),
    markJobDone: vi.fn(),
    requeueOrFail: vi.fn(),
  };
});

vi.mock("@/lib/queue/handlers", () => {
  return {
    HANDLERS: {
      buffer: vi.fn(),
    },
    isSupportedChannel: (c: string) => c === "buffer",
    SUPPORTED_CHANNELS: ["buffer"],
  };
});

import * as db from "@/lib/db/publishQueue";
import * as handlers from "@/lib/queue/handlers";
import { runQueueOnce } from "@/lib/queue/worker";

function makeJob(overrides: Partial<PublishJobRow> = {}): PublishJobRow {
  return {
    id: "job-1",
    channel: "buffer",
    status: "pending",
    payload_json: JSON.stringify({ channelId: "ch", text: "hi" }),
    scheduled_at: null,
    run_after: null,
    attempts: 0,
    max_attempts: 3,
    last_error: null,
    created_at: 0,
    updated_at: 0,
    ...overrides,
  };
}

describe("runQueueOnce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("후보 없음 — scanned/claimed 모두 0", async () => {
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([]);
    const r = await runQueueOnce();
    expect(r).toEqual({ scanned: 0, claimed: 0, outcomes: [] });
  });

  it("claim 실패(다른 워커가 점유) — outcome 없이 다음으로", async () => {
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([makeJob()]);
    vi.mocked(db.claimJob).mockResolvedValue(null);

    const r = await runQueueOnce();
    expect(r.scanned).toBe(1);
    expect(r.claimed).toBe(0);
    expect(r.outcomes).toHaveLength(0);
    expect(db.markJobDone).not.toHaveBeenCalled();
    expect(db.requeueOrFail).not.toHaveBeenCalled();
  });

  it("handler ok → markJobDone 호출 + outcome=ok", async () => {
    const job = makeJob();
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([job]);
    vi.mocked(db.claimJob).mockResolvedValue(job);
    vi.mocked(handlers.HANDLERS.buffer).mockResolvedValue({
      kind: "ok",
      externalId: "post-xyz",
    });

    const r = await runQueueOnce();
    expect(db.markJobDone).toHaveBeenCalledWith("job-1");
    expect(r.outcomes[0]).toMatchObject({
      id: "job-1",
      result: "ok",
      externalId: "post-xyz",
    });
  });

  it("handler retryable → requeueOrFail(원본 job, retry)", async () => {
    const job = makeJob({ attempts: 0 });
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([job]);
    vi.mocked(db.claimJob).mockResolvedValue(job);
    vi.mocked(handlers.HANDLERS.buffer).mockResolvedValue({
      kind: "retryable",
      error: "429",
    });
    vi.mocked(db.requeueOrFail).mockResolvedValue({ status: "pending", attempts: 1 });

    const r = await runQueueOnce();
    expect(db.requeueOrFail).toHaveBeenCalled();
    const calledJob = vi.mocked(db.requeueOrFail).mock.calls[0]?.[0];
    expect(calledJob?.attempts).toBe(0); // 원본 그대로 — fatal 점프 없음
    expect(r.outcomes[0]).toMatchObject({ result: "retry", attempts: 1 });
  });

  it("handler fatal → attempts 를 max-1 로 점프시켜 즉시 failed 유도", async () => {
    const job = makeJob({ attempts: 0, max_attempts: 3 });
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([job]);
    vi.mocked(db.claimJob).mockResolvedValue(job);
    vi.mocked(handlers.HANDLERS.buffer).mockResolvedValue({
      kind: "fatal",
      error: "token expired",
    });
    vi.mocked(db.requeueOrFail).mockResolvedValue({ status: "failed", attempts: 3 });

    const r = await runQueueOnce();
    const calledJob = vi.mocked(db.requeueOrFail).mock.calls[0]?.[0];
    expect(calledJob?.attempts).toBe(2); // max - 1 → requeueOrFail 가 +1 해서 failed
    const runAfter = vi.mocked(db.requeueOrFail).mock.calls[0]?.[2];
    expect(runAfter).toBe(0);
    expect(r.outcomes[0]).toMatchObject({ result: "failed", attempts: 3 });
  });

  it("handler throw → retryable 로 처리됨 (안전)", async () => {
    const job = makeJob();
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([job]);
    vi.mocked(db.claimJob).mockResolvedValue(job);
    vi.mocked(handlers.HANDLERS.buffer).mockRejectedValue(new Error("boom"));
    vi.mocked(db.requeueOrFail).mockResolvedValue({ status: "pending", attempts: 1 });

    const r = await runQueueOnce();
    expect(db.requeueOrFail).toHaveBeenCalled();
    expect(r.outcomes[0]?.result).toBe("retry");
  });

  it("payload JSON 깨짐 → retry 로 처리", async () => {
    const job = makeJob({ payload_json: "{not-json" });
    vi.mocked(db.listClaimablePendingJobs).mockResolvedValue([job]);
    vi.mocked(db.claimJob).mockResolvedValue(job);
    vi.mocked(db.requeueOrFail).mockResolvedValue({ status: "pending", attempts: 1 });

    const r = await runQueueOnce();
    expect(handlers.HANDLERS.buffer).not.toHaveBeenCalled();
    expect(r.outcomes[0]?.result).toBe("retry");
  });
});
