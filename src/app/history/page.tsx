import type { Metadata } from "next";
import Link from "next/link";
import {
  listRecentGenerations,
  listRecentActivity,
  type ActivityLog,
  type Generation,
} from "@/lib/db/generations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "작업 기록 — keg-book" };

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  generate: { label: "콘텐츠 생성", color: "#4285F4" },
  publish: { label: "발행", color: "#34A853" },
  schedule: { label: "예약", color: "#F9AB00" },
  edit: { label: "편집", color: "#9C27B0" },
  archive: { label: "보관", color: "#5F6368" },
  signin: { label: "로그인", color: "#1A73E8" },
};

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  blogger: { label: "Blogger", color: "#EA4335" },
  naver: { label: "네이버", color: "#03C75A" },
  newsletter: { label: "뉴스레터", color: "#9C27B0" },
  instagram: { label: "인스타", color: "#E1306C" },
  threads: { label: "Threads", color: "#000" },
  buffer: { label: "Buffer", color: "#168EEA" },
  "card-news": { label: "카드뉴스", color: "#F9AB00" },
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HistoryPage() {
  const [generations, activity] = await Promise.all([
    listRecentGenerations(30).catch(() => [] as Generation[]),
    listRecentActivity(50).catch(() => [] as ActivityLog[]),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-16">
      {/* 헤더 */}
      <div className="mb-7 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#5F6368" }}
        >
          H
        </span>
        <div>
          <h1
            className="text-[18px] font-normal"
            style={{ color: "var(--color-text)" }}
          >
            작업 기록
          </h1>
          <p
            className="text-[12px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            최근 생성한 콘텐츠와 발행·예약 액션 추적
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 최근 생성 콘텐츠 */}
        <section
          className="rounded-2xl p-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-[14px] font-medium"
              style={{ color: "var(--color-text)" }}
            >
              ✦ 생성된 콘텐츠{" "}
              <span
                className="ml-1 text-[12px] font-normal"
                style={{ color: "var(--color-text-faint)" }}
              >
                ({generations.length})
              </span>
            </h2>
            <Link
              href="/generate"
              className="rounded-full px-3 py-1 text-[11px] font-medium text-white"
              style={{
                background:
                  "linear-gradient(135deg, #4285F4 0%, #9C27B0 100%)",
              }}
            >
              + 새 생성
            </Link>
          </div>

          {generations.length === 0 ? (
            <p
              className="py-8 text-center text-[13px]"
              style={{ color: "var(--color-text-faint)" }}
            >
              아직 생성된 콘텐츠가 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {generations.map((g) => (
                <li key={g.id}>
                  <div
                    className="rounded-xl p-3 transition-colors"
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[13px] font-medium"
                          style={{ color: "var(--color-text)" }}
                        >
                          「{g.keyword}」
                        </p>
                        <p
                          className="mt-0.5 truncate text-[11px]"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {g.product_name ? `${g.product_name} · ` : ""}
                          {formatTime(g.created_at)}
                          {g.user_name ? ` · ${g.user_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { ch: "blogger", path: "/" },
                        { ch: "naver", path: "/naver" },
                        { ch: "newsletter", path: "/newsletter" },
                        { ch: "instagram", path: "/social" },
                        { ch: "threads", path: "/social" },
                      ].map((c) => {
                        const cfg = CHANNEL_LABELS[c.ch];
                        return (
                          <Link
                            key={c.ch}
                            href={`${c.path}?from=${g.id}&channel=${c.ch}`}
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: `${cfg.color}18`,
                              color: cfg.color,
                            }}
                          >
                            → {cfg.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 활동 로그 */}
        <section
          className="rounded-2xl p-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2
            className="mb-4 text-[14px] font-medium"
            style={{ color: "var(--color-text)" }}
          >
            ⏱ 활동 로그{" "}
            <span
              className="ml-1 text-[12px] font-normal"
              style={{ color: "var(--color-text-faint)" }}
            >
              ({activity.length})
            </span>
          </h2>

          {activity.length === 0 ? (
            <p
              className="py-8 text-center text-[13px]"
              style={{ color: "var(--color-text-faint)" }}
            >
              아직 기록된 활동이 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {activity.map((a) => {
                const action = ACTION_LABELS[a.action] ?? {
                  label: a.action,
                  color: "#5F6368",
                };
                const detail = a.detail as Record<string, unknown> | null;
                const summary = detail?.keyword
                  ? `「${detail.keyword}」`
                  : detail?.title
                  ? `「${String(detail.title).slice(0, 30)}」`
                  : detail?.textPreview
                  ? `"${String(detail.textPreview).slice(0, 40)}…"`
                  : (a.target_type ? a.target_type : "");

                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-[12px] transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <span
                      className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: action.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p style={{ color: "var(--color-text)" }}>
                        <span
                          className="font-medium"
                          style={{ color: action.color }}
                        >
                          {action.label}
                        </span>
                        {summary && (
                          <span
                            className="ml-1.5"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {summary}
                          </span>
                        )}
                      </p>
                      <p
                        className="mt-0.5 text-[11px]"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        {a.user_name ?? a.user_email ?? "익명"} ·{" "}
                        {formatTime(a.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
