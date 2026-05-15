import Link from "next/link";
import { listRecentGenerations, getGeneration } from "@/lib/db/generations";
import type { ChannelKey } from "@/lib/db/generations";

/**
 * 채널 페이지 상단에 표시되는 "최근 생성에서 불러오기" 카드.
 * - searchParams.from 이 있으면: 해당 generation 상세 + 채널 데이터 미리보기
 * - 없으면: 최근 생성 10개 셀렉터
 */
export async function PrefillFromGeneration({
  channel,
  basePath,
  fromId,
}: {
  channel: ChannelKey;
  basePath: string;
  fromId?: string;
}) {
  // 케이스 1: 특정 generation 로드됨
  if (fromId) {
    const gen = await getGeneration(fromId).catch(() => null);
    if (gen) {
      const channelData = (gen.raw_json as Record<string, unknown>)[channel] as
        | Record<string, unknown>
        | undefined;

      const title =
        (channelData?.title as string | undefined) ??
        (channelData?.subject as string | undefined) ??
        (channelData?.caption as string | undefined)?.slice(0, 40) ??
        (channelData?.text as string | undefined)?.slice(0, 40) ??
        "(미리보기 없음)";

      return (
        <div
          className="mb-6 rounded-2xl px-5 py-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,10,10,0.06) 0%, rgba(82,82,82,0.06) 100%)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(10,10,10,0.12)",
                    color: "#0A0A0A",
                  }}
                >
                  생성에서 불러옴
                </span>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  「{gen.keyword}」 · {new Date(gen.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <p
                className="truncate text-[14px] font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {title}
              </p>
            </div>
            <Link
              href={basePath}
              className="rounded-full px-3 py-1 text-[11px]"
              style={{
                border: "1px solid var(--color-border-strong)",
                color: "var(--color-text-muted)",
              }}
            >
              초기화
            </Link>
          </div>
        </div>
      );
    }
  }

  // 케이스 2: 셀렉터 — 최근 생성 10개
  const recent = await listRecentGenerations(10).catch(() => []);
  if (recent.length === 0) {
    return (
      <div
        className="mb-6 rounded-2xl px-5 py-4 text-center"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px dashed var(--color-border)",
        }}
      >
        <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          아직 생성된 콘텐츠가 없습니다.{" "}
          <Link
            href="/generate"
            className="font-medium underline"
            style={{ color: "#0A0A0A" }}
          >
            ✦ 콘텐츠 생성
          </Link>
          으로 키워드 하나로 전 채널을 동시에 만들 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <details
      className="mb-6 rounded-2xl"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <summary
        className="flex cursor-pointer items-center justify-between px-5 py-3 text-[13px] font-medium"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>
          ↻ 최근 생성에서 불러오기{" "}
          <span style={{ color: "var(--color-text-faint)" }}>({recent.length})</span>
        </span>
        <span style={{ color: "var(--color-text-faint)" }}>▼</span>
      </summary>
      <ul
        className="divide-y px-2 pb-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        {recent.map((g) => (
          <li key={g.id}>
            <Link
              href={`${basePath}?from=${g.id}&channel=${channel}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px] font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  {g.keyword}
                </p>
                <p
                  className="truncate text-[11px]"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {g.product_name ? `${g.product_name} · ` : ""}
                  {new Date(g.created_at).toLocaleString("ko-KR")}
                  {g.user_name ? ` · ${g.user_name}` : ""}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
