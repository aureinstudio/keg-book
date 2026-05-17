"use client";

import { useState } from "react";
import type { CardSlide } from "@/lib/gemini/generateCardNewsSlides";
import {
  downloadComposedCard,
  downloadComposedCardsAsZip,
} from "@/lib/client/composeCardPng";

const ROLE_LABEL: Record<CardSlide["role"], string> = {
  cover: "표지",
  body: "본문",
  outro: "마무리",
};

export function CardNewsResultView({
  keyword,
  slides,
  error,
}: {
  keyword: string;
  slides: CardSlide[];
  error?: string;
}) {
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipMsg, setZipMsg] = useState<string | null>(null);

  // ZIP에 넣을 수 있는 슬라이드(이미지가 있는 것)만 카운트
  const zippable = slides
    .map((s, idx) => {
      const src = s.imageUrl ?? (s.imageBase64 ? `data:image/png;base64,${s.imageBase64}` : null);
      return src ? { idx, slide: s, src } : null;
    })
    .filter((x): x is { idx: number; slide: CardSlide; src: string } => Boolean(x));

  async function handleZipAll() {
    if (zippable.length === 0) return;
    setZipBusy(true);
    setZipMsg(null);
    try {
      const safeKw = keyword.replace(/[^\w가-힣-]+/g, "_").slice(0, 30) || "card-news";
      const inputs = zippable.map(({ idx, slide, src }) => ({
        imgSrc: src,
        headline: slide.headline,
        isCover: slide.role === "cover",
        filename: `${safeKw}-${idx + 1}-${slide.role}.png`,
      }));
      await downloadComposedCardsAsZip(inputs, `${safeKw}-cards.zip`);
      setZipMsg(`ZIP 다운로드 완료 — ${zippable.length}장`);
      setTimeout(() => setZipMsg(null), 2500);
    } catch (e) {
      setZipMsg(`ZIP 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setZipBusy(false);
    }
  }

  if (error && slides.length === 0) {
    return (
      <p
        className="rounded-lg px-3 py-3 text-[12px]"
        style={{
          backgroundColor: "rgba(38,38,38, 0.08)",
          color: "#262626",
          border: "1px solid rgba(38,38,38, 0.2)",
        }}
      >
        카드뉴스 생성 오류: {error}
      </p>
    );
  }

  if (slides.length === 0) {
    return (
      <p
        className="py-8 text-center text-[13px]"
        style={{ color: "var(--color-text-faint)" }}
      >
        이 생성에는 카드뉴스가 포함되지 않았습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          ↓ PNG 다운로드 시 헤드라인이 이미지에 합성되어 저장됩니다.
        </p>
        {zippable.length > 0 && (
          <button
            type="button"
            onClick={handleZipAll}
            disabled={zipBusy}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-opacity disabled:opacity-50"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-2)",
              color: "var(--color-text)",
            }}
          >
            {zipBusy
              ? `ZIP 생성 중… (${zippable.length}장)`
              : `↓ 전체 ZIP 다운로드 (${zippable.length}장)`}
          </button>
        )}
      </div>
      {zipMsg && (
        <p
          className="rounded px-2 py-1 text-[11px]"
          style={{
            backgroundColor: zipMsg.startsWith("ZIP 다운로드")
              ? "rgba(64,64,64,0.08)"
              : "rgba(115,115,115,0.08)",
            color: "var(--color-text-muted)",
          }}
        >
          {zipMsg}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {slides.map((s, idx) => {
          const src = s.imageUrl ?? (s.imageBase64 ? `data:image/png;base64,${s.imageBase64}` : null);
          const isCover = s.role === "cover";
          const filename = `${keyword}-card-${idx + 1}-${s.role}.png`;
          const busy = busyIdx === idx;

          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* 미리보기 */}
              <div className="relative aspect-[4/5] w-full bg-black">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={s.headline}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-white/60">
                    이미지 없음
                  </div>
                )}

                <div
                  className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-12"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)",
                  }}
                >
                  <p
                    className="font-bold leading-snug text-white"
                    style={{
                      fontSize: isCover ? "20px" : "16px",
                      textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      fontFamily:
                        '"Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif',
                    }}
                  >
                    {s.headline}
                  </p>
                </div>

                <span
                  className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  #{idx + 1} · {ROLE_LABEL[s.role]}
                </span>
              </div>

              {/* 액션 */}
              <div className="space-y-2 p-3">
                <p
                  className="text-[11px]"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  프롬프트: {s.imagePrompt}
                </p>
                <button
                  type="button"
                  disabled={!src || busy}
                  onClick={async () => {
                    if (!src) return;
                    setBusyIdx(idx);
                    try {
                      await downloadComposedCard(src, s.headline, isCover, filename);
                    } finally {
                      setBusyIdx(null);
                    }
                  }}
                  className="w-full rounded-md px-3 py-1.5 text-[12px] font-medium transition-opacity disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                  }}
                >
                  {busy ? "합성 중…" : "↓ 헤드라인 포함 PNG 다운로드"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
