"use server";

import {
  enqueuePublishJob,
  getPublishJobById,
  listPublishJobs,
  publishJobStats,
  updatePublishJobStatus,
} from "@/lib/db/publishQueue";

export type QueueFormState = { ok: boolean; message: string; jobId?: string };

export async function enqueueJobAction(_prev: QueueFormState, formData: FormData): Promise<QueueFormState> {
  const channel = String(formData.get("channel") ?? "").trim();
  const payloadRaw = String(formData.get("payload") ?? "").trim();
  const scheduled = String(formData.get("scheduled") ?? "").trim();

  if (!channel) {
    return { ok: false, message: "채널을 선택하거나 입력하세요." };
  }

  let payload: unknown = {};
  if (payloadRaw) {
    try {
      payload = JSON.parse(payloadRaw) as unknown;
    } catch {
      return { ok: false, message: "payload는 유효한 JSON이어야 합니다." };
    }
  }

  let scheduledAt: number | null = null;
  if (scheduled) {
    const t = Date.parse(scheduled);
    if (Number.isNaN(t)) {
      return { ok: false, message: "예약 시각 형식이 올바르지 않습니다(ISO 날짜 권장)." };
    }
    scheduledAt = t;
  }

  try {
    const row = await enqueuePublishJob({
      channel,
      payload,
      scheduledAt,
      runAfter: scheduledAt,
    });
    return { ok: true, message: "큐에 추가했습니다.", jobId: row.id };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "큐 추가 실패" };
  }
}

export async function listJobsAction() {
  return listPublishJobs(80);
}

export async function statsAction() {
  return publishJobStats();
}

export async function cancelJobAction(jobId: string): Promise<QueueFormState> {
  try {
    const row = await getPublishJobById(jobId);
    if (!row) return { ok: false, message: "작업을 찾을 수 없습니다." };
    if (row.status !== "pending") {
      return { ok: false, message: "대기 중인 작업만 취소할 수 있습니다." };
    }
    await updatePublishJobStatus(jobId, "cancelled");
    return { ok: true, message: "취소했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "취소 실패" };
  }
}
