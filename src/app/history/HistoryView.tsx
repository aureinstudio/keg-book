"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ActivityLog } from "@/lib/db/generations";
import type {
  GenerationWithPublish,
  PublishChannel,
  PublishRecord,
} from "@/lib/db/publishHistory";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  generate: { label: "콘텐츠 생성", color: "#0A0A0A" },
  publish: { label: "발행", color: "#404040" },
  schedule: { label: "예약", color: "#737373" },
  edit: { label: "편집", color: "#525252" },
  archive: { label: "보관", color: "#5F6368" },
  signin: { label: "로그인", color: "#0A0A0A" },
};

/** 카드 안 채널 칩에 사용하는 라벨/색상 — generation 위에 어떤 채널이 발행됐는지 표시 */
const CHANNEL_META: Record<
  PublishChannel | "newsletter" | "card-news",
  { label: string; color: string; path: string }
> = {
  blogger: { label: "Blogger", color: "#262626", path: "/blogger" },
  naver: { label: "네이버", color: "#525252", path: "/naver" },
  buffer: { label: "Buffer", color: "#404040", path: "/social" },
  "buffer-instagram": { label: "인스타", color: "#404040", path: "/social" },
  "buffer-threads": { label: "Threads", color: "#000000", path: "/social" },
  newsletter: { label: "뉴스레터", color: "#525252", path: "/newsletter" },
  "card-news": { label: "카드뉴스", color: "#737373", path: "/card-news" },
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return formatTime(ms);
}

type Props = {
  generations: GenerationWithPublish[];
  activity: ActivityLog[];
};

export function HistoryView({ generations, activity }: Props) {
  const [q, setQ] = useState("");
  const [publishedOnly, setPublishedOnly] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"all" | PublishChannel>(
    "all",
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return generations.filter((g) => {
      if (needle) {
        const hay = [
          g.keyword,
          g.product_name ?? "",
          g.target_audience ?? "",
          g.user_name ?? "",
          g.user_email ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (publishedOnly && g.publishes.length === 0) return false;
      if (channelFilter !== "all") {
        const has = g.publishes.some((p) => p.channel === channelFilter);
        if (!has) return false;
      }
      return true;
    });
  }, [generations, q, publishedOnly, channelFilter]);

  const stats = useMemo(() => {
    const total = generations.length;
    const withPublish = generations.filter((g) => g.publishes.length > 0).length;
    const totalPublishes = generations.reduce(
      (sum, g) => sum + g.publishes.length,
      0,
    );
    return { total, withPublish, totalPublishes };
  }, [generations]);

  return (
    <div>
      {/* 상단 통계 */}
      <div className="mb-5 flex flex-wrap gap-2 text-[11px]">
        <Stat label="콘텐츠" value={`${stats.total}건`} />
        <Stat label="발행됨" value={`${stats.withPublish}건`} />
        <Stat label="총 발행 이벤트" value={`${stats.totalPublishes}건`} />
      </div>

      {/* 검색 + 필터 */}
      <div
        className="mb-5 grid gap-2 rounded-xl p-3 sm:grid-cols-[1fr_auto_auto]"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="키워드·교재명·작성자로 검색…"
          className="rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text)",
          }}
        />
        <select
          value={channelFilter}
          onChange={(e) =>
            setChannelFilter(e.target.value as "all" | PublishChannel)
          }
          className="rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text)",
          }}
          aria-label="발행 채널 필터"
        >
          <option value="all">모든 채널</option>
          <option value="blogger">Blogger</option>
          <option value="naver">네이버</option>
          <option value="buffer">Buffer (IG/Threads)</option>
        </select>
        <label
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[12px]"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: publishedOnly
              ? "var(--color-surface-2)"
              : "transparent",
            color: "var(--color-text-muted)",
          }}
        >
          <input
            type="checkbox"
            checked={publishedOnly}
            onChange={(e) => setPublishedOnly(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          발행만
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* 좌측: 콘텐츠 카드 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-[14px] font-medium"
              style={{ color: "var(--color-text)" }}
            >
              ✦ 생성 + 발행 결과{" "}
              <span
                className="ml-1 text-[12px] font-normal"
                style={{ color: "var(--color-text-faint)" }}
              >
                ({filtered.length}/{generations.length})
              </span>
            </h2>
            <Link
              href="/generate"
              className="rounded-full px-3 py-1 text-[11px] font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
              }}
            >
              + 새 생성
            </Link>
          </div>

          {filtered.length === 0 ? (
            <p
              className="rounded-2xl py-10 text-center text-[13px]"
              style={{
                color: "var(--color-text-faint)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              {q || publishedOnly || channelFilter !== "all"
                ? "필터 조건에 맞는 콘텐츠가 없습니다."
                : "아직 생성된 콘텐츠가 없습니다."}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((g) => (
                <GenerationCard key={g.id} g={g} />
              ))}
            </ul>
          )}
        </section>

        {/* 우측: 활동 로그 (raw) */}
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
                      : a.target_type
                        ? a.target_type
                        : "";

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-full px-3 py-1"
      style={{
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-muted)",
      }}
    >
      <span style={{ color: "var(--color-text-faint)" }}>{label}</span>{" "}
      <strong style={{ color: "var(--color-text)" }}>{value}</strong>
    </div>
  );
}

function GenerationCard({ g }: { g: GenerationWithPublish }) {
  const hasCardNews =
    (g.raw_json?.cardNews?.slides?.length ?? 0) > 0;
  // 발행된 채널 집합 (없는 채널은 회색 점)
  const publishedChannels = new Set(g.publishes.map((p) => p.channel));

  // 워크플로 칩에 들어갈 6채널 표시 — 발행 여부에 따라 색 다름
  const workflowChannels: {
    key: PublishChannel | "newsletter" | "card-news";
    available: boolean;
  }[] = [
    { key: "blogger", available: true },
    { key: "naver", available: true },
    { key: "buffer", available: true },
    { key: "newsletter", available: true },
    { key: "card-news", available: hasCardNews },
  ];

  return (
    <li>
      <div
        className="rounded-xl p-3.5"
        style={{
          backgroundColor: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="mb-2.5 flex items-start justify-between gap-3">
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
          {g.lastPublishedAt != null && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "rgba(64,64,64,0.12)",
                color: "#404040",
              }}
              title={formatTime(g.lastPublishedAt)}
            >
              ✓ 최근 발행 {relTime(g.lastPublishedAt)}
            </span>
          )}
        </div>

        {/* 채널 칩: 발행 상태에 따라 색 다름 */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {workflowChannels.map((c) => {
            const meta = CHANNEL_META[c.key];
            const isPublished =
              c.key !== "newsletter" &&
              c.key !== "card-news" &&
              publishedChannels.has(c.key as PublishChannel);
            return (
              <Link
                key={c.key}
                href={`${meta.path}?from=${g.id}${c.key === "buffer" ? "" : `&channel=${c.key}`}`}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: isPublished
                    ? `${meta.color}28`
                    : `${meta.color}10`,
                  color: isPublished ? meta.color : `${meta.color}99`,
                  border: isPublished
                    ? `1px solid ${meta.color}40`
                    : "1px solid transparent",
                }}
                title={isPublished ? "발행 기록 있음" : "아직 발행 전"}
              >
                {isPublished ? "✓ " : "→ "}
                {meta.label}
              </Link>
            );
          })}
        </div>

        {/* 발행 기록 라인 (있는 경우만) */}
        {g.publishes.length > 0 && (
          <ul
            className="mt-2 space-y-1 rounded-lg p-2 text-[11px]"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            {g.publishes.slice(0, 5).map((p) => (
              <PublishLine key={p.activityId} p={p} />
            ))}
            {g.publishes.length > 5 && (
              <li
                className="px-1 pt-0.5 text-[10px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                +{g.publishes.length - 5}건 더…
              </li>
            )}
          </ul>
        )}
      </div>
    </li>
  );
}

function PublishLine({ p }: { p: PublishRecord }) {
  const meta = CHANNEL_META[p.channel];
  return (
    <li className="flex items-center gap-2">
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      <span
        className="shrink-0 font-medium"
        style={{ color: meta.color, minWidth: "52px" }}
      >
        {meta.label}
      </span>
      <span
        className="min-w-0 flex-1 truncate"
        style={{ color: "var(--color-text-muted)" }}
        title={p.summary}
      >
        {p.summary}
      </span>
      {p.externalUrl && (
        <a
          href={p.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 hover:underline"
          style={{ color: "var(--color-accent)" }}
        >
          링크 ↗
        </a>
      )}
      <span
        className="shrink-0 text-[10px]"
        style={{ color: "var(--color-text-faint)" }}
      >
        {relTime(p.publishedAt)}
      </span>
    </li>
  );
}
