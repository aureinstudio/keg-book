"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import type { PublishJobRow } from "@/lib/db/publishQueue";

import { cancelJobAction, enqueueJobAction, listJobsAction, statsAction, type QueueFormState } from "./actions";

const initial: QueueFormState = { ok: true, message: "" };

const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text)",
};

export function QueueWorkbench() {
  const [state, formAction, pending] = useActionState(enqueueJobAction, initial);
  const [cancelPending, startCancel] = useTransition();
  const [jobs, setJobs] = useState<PublishJobRow[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [mailyStatus, setMailyStatus] = useState<{ configured: boolean } | null>(null);

  async function refresh() {
    const [j, s] = await Promise.all([listJobsAction(), statsAction()]);
    setJobs(j);
    setStats(s as Record<string, number>);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (state.message) {
      setFlash(state.message);
      const t = setTimeout(() => setFlash(null), 3200);
      if (state.ok) void refresh();
      return () => clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    void fetch("/api/maily/status")
      .then((r) => r.json() as Promise<{ configured: boolean }>)
      .then(setMailyStatus)
      .catch(() => setMailyStatus({ configured: false }));
  }, []);

  const isError = (msg: string) => msg.includes("실패") || msg.includes("올바르지");

  return (
    <div className="flex flex-col gap-5">
      {flash && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: isError(flash) ? "#FAFAFA" : "#F5F5F5",
            color: isError(flash) ? "#404040" : "#171717",
            border: `1px solid ${isError(flash) ? "#D4D4D4" : "#D4D4D4"}`,
          }}
          role="status"
        >
          {flash}
        </p>
      )}

      {/* 메일리 API 상태 */}
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="mb-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          메일리 API (서버 프록시)
        </h2>
        <div className="space-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <p>
            상태:{" "}
            <code className="rounded px-1 py-0.5" style={{ backgroundColor: "var(--color-surface-2)" }}>
              GET /api/maily/status
            </code>{" "}
            · 구독자:{" "}
            <code className="rounded px-1 py-0.5" style={{ backgroundColor: "var(--color-surface-2)" }}>
              GET /api/maily/subscribers?page=1
            </code>{" "}
            (키 필요)
          </p>
          <p>
            연동:{" "}
            {mailyStatus === null ? (
              <span style={{ color: "var(--color-text-faint)" }}>확인 중…</span>
            ) : mailyStatus.configured ? (
              <span style={{ color: "var(--color-text)" }}>● MAILY_API_KEY 설정됨</span>
            ) : (
              <span style={{ color: "var(--color-text-faint)" }}>키 없음 — 뉴스레터 HTML·복사만 사용 가능</span>
            )}
          </p>
        </div>
      </section>

      {/* 작업 추가 */}
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          작업 추가
        </h2>
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              채널
            </span>
            <select
              name="channel"
              className="rounded-lg px-3 py-2 text-sm"
              style={{ ...inputStyle, maxWidth: "20rem" }}
              defaultValue="blogger"
            >
              <option value="blogger">blogger</option>
              <option value="buffer">buffer</option>
              <option value="maily">maily</option>
              <option value="gemini">gemini</option>
              <option value="other">other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              payload (JSON, 선택)
            </span>
            <textarea
              name="payload"
              rows={4}
              placeholder='예: {"postId":"...","title":"..."}'
              className="rounded-lg px-3 py-2 font-mono text-xs"
              style={inputStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              예약 시각 (선택)
            </span>
            <input
              type="datetime-local"
              name="scheduled"
              className="rounded-lg px-3 py-2 text-sm"
              style={{ ...inputStyle, maxWidth: "20rem" }}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-on)",
            }}
          >
            {pending ? "추가 중…" : "큐에 넣기"}
          </button>
        </form>
      </section>

      {/* 통계 */}
      {stats && (
        <div
          className="flex flex-wrap gap-4 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
          {[
            { label: "● 대기",   value: stats.pending ?? 0,    color: "var(--color-text-muted)" },
            { label: "◐ 처리중", value: stats.processing ?? 0, color: "var(--color-text)" },
            { label: "✓ 완료",   value: stats.done ?? 0,       color: "var(--color-text)" },
            { label: "✗ 실패",   value: stats.failed ?? 0,     color: "var(--color-text)" },
            { label: "◌ 취소",   value: stats.cancelled ?? 0,  color: "var(--color-text-faint)" },
            { label: "Σ 전체",   value: stats.total ?? 0,      color: "var(--color-text)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span style={{ color: "var(--color-text-faint)" }}>{label}</span>
              <span className="font-semibold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 작업 목록 */}
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            최근 작업
          </h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded px-2 py-1 text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--color-accent)", backgroundColor: "transparent" }}
          >
            새로고침
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-faint)" }}
              >
                <th className="py-2 pr-3 font-medium">상태</th>
                <th className="py-2 pr-3 font-medium">채널</th>
                <th className="py-2 pr-3 font-medium">생성</th>
                <th className="py-2 pr-3 font-medium">payload</th>
                <th className="py-2 font-medium">동작</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-b align-top"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="py-2 pr-3 font-mono" style={{ color: "var(--color-text-muted)" }}>
                    {j.status}
                  </td>
                  <td className="py-2 pr-3" style={{ color: "var(--color-text)" }}>
                    {j.channel}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-3" style={{ color: "var(--color-text-faint)" }}>
                    {new Date(j.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td
                    className="max-w-[240px] truncate py-2 pr-3 font-mono text-[10px]"
                    style={{ color: "var(--color-text-faint)" }}
                    title={j.payload_json}
                  >
                    {j.payload_json}
                  </td>
                  <td className="py-2">
                    {j.status === "pending" ? (
                      <button
                        type="button"
                        disabled={cancelPending}
                        onClick={() =>
                          startCancel(async () => {
                            const r = await cancelJobAction(j.id);
                            setFlash(r.message);
                            await refresh();
                          })
                        }
                        className="text-xs transition-colors hover:underline disabled:opacity-50"
                        style={{ color: "#171717" }}
                      >
                        취소
                      </button>
                    ) : (
                      <span style={{ color: "var(--color-text-faint)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <p className="py-6 text-center text-sm" style={{ color: "var(--color-text-faint)" }}>
              아직 작업이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
