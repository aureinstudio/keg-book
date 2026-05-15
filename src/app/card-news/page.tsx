import type { Metadata } from "next";
import Link from "next/link";
import { CardNewsForm } from "./CardNewsForm";
import { CardNewsResultView } from "./CardNewsResultView";
import { getGeneration } from "@/lib/db/generations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "카드뉴스 (Gemini) — keg-book" };

export default async function CardNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; channel?: string }>;
}) {
  const sp = await searchParams;
  const fromId = sp.from;

  const gen = fromId ? await getGeneration(fromId).catch(() => null) : null;
  const cardNews = gen?.raw_json?.cardNews;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#F9AB00" }}
        >
          C
        </span>
        <div>
          <h1
            className="text-[18px] font-normal"
            style={{ color: "var(--color-text)" }}
          >
            카드뉴스
          </h1>
          <p
            className="text-[12px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Gemini API · 이미지 생성 ·{" "}
            <code
              className="rounded px-1"
              style={{
                backgroundColor: "var(--color-surface-2)",
                fontSize: "11px",
              }}
            >
              _output/card-news/
            </code>{" "}
            저장
          </p>
        </div>
      </div>

      {/* 히스토리에서 들어온 경우: 결과 표시 */}
      {gen && (
        <div
          className="mb-5 rounded-2xl p-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p
                className="text-[13px] font-medium"
                style={{ color: "var(--color-text)" }}
              >
                ✦ 히스토리에서 불러옴: 「{gen.keyword}」
              </p>
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                {gen.product_name ? `${gen.product_name} · ` : ""}
                {new Date(gen.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <Link
              href="/history"
              className="text-[11px] underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              ← 히스토리
            </Link>
          </div>

          <CardNewsResultView
            keyword={gen.keyword}
            slides={cardNews?.slides ?? []}
            error={cardNews?.error}
          />
        </div>
      )}

      {/* 새 생성 폼 */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        {gen && (
          <p
            className="mb-3 text-[12px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            ↓ 별도의 단일 슬라이드를 직접 생성하려면 아래 폼을 사용하세요.
          </p>
        )}
        <CardNewsForm />
      </div>
    </div>
  );
}
