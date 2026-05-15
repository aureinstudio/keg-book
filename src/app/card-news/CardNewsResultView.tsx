"use client";

import { useState } from "react";
import type { CardSlide } from "@/lib/gemini/generateCardNewsSlides";
import { downloadComposedCard } from "@/lib/client/composeCardPng";

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

  if (error && slides.length === 0) {
    return (
      <p
        className="rounded-lg px-3 py-3 text-[12px]"
        style={{
          backgroundColor: "rgba(234, 67, 53, 0.08)",
          color: "#EA4335",
          border: "1px solid rgba(234, 67, 53, 0.2)",
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
      <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
        ↓ PNG 다운로드 시 헤드라인이 이미지에 합성되어 저장됩니다.
      </p>

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
