"use client";

import {
  generateCardNewsFormAction,
  type CardNewsFormState,
} from "@/app/card-news/actions";
import { useActionState } from "react";

const DEFAULT_PROMPT = `교재 홍보용 카드뉴스 1장. 가로 16:9 비율.
한국어 텍스트: "새 학기, 새 교재" — 깔끔한 교육 브랜드 일러스트, 밝은 배경, 과하지 않은 색.`;

const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text)",
};

export function CardNewsForm() {
  const [state, formAction, isPending] = useActionState<
    CardNewsFormState,
    FormData
  >(generateCardNewsFormAction, null);

  const imgSrc =
    state && state.ok && (state.imageUrl || state.imageBase64)
      ? state.imageUrl ?? `data:image/png;base64,${state.imageBase64}`
      : null;

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            파일명 접두 (영문·숫자 권장)
          </span>
          <input
            name="base"
            type="text"
            defaultValue="spring-textbook-card"
            className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            이미지 프롬프트 (Gemini)
          </span>
          <textarea
            name="prompt"
            rows={10}
            defaultValue={DEFAULT_PROMPT}
            className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={inputStyle}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#171717" }}
        >
          {isPending ? "처리 중…" : "이미지 생성"}
        </button>
      </form>

      {state && (
        <div
          className="rounded-lg p-4 text-sm"
          style={
            state.ok
              ? {
                  backgroundColor: "#F5F5F5",
                  border: "1px solid #D4D4D4",
                  color: "#171717",
                }
              : {
                  backgroundColor: "#FAFAFA",
                  border: "1px solid #E5E5E5",
                  color: "#171717",
                }
          }
          role="status"
        >
          {state.ok ? (
            <>
              {state.skippedImage ? (
                <p>
                  <code
                    className="rounded px-1 py-0.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                  >
                    GEMINI_API_KEY
                  </code>
                  가 없어 이미지는 건너뜁니다. 환경 변수를 추가하고 다시 시도하세요.
                </p>
              ) : imgSrc ? (
                <div className="flex flex-col gap-3">
                  <p>
                    이미지 생성 완료:{" "}
                    <code className="text-xs" style={{ opacity: 0.9 }}>
                      {state.filename}
                    </code>
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={state.filename}
                    className="w-full rounded-md"
                    style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                  />
                  <a
                    href={imgSrc}
                    download={state.filename}
                    className="w-fit rounded-md px-3 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: "#171717" }}
                  >
                    ↓ PNG 다운로드
                  </a>
                  {state.imageUrl && (
                    <p className="text-[11px]" style={{ opacity: 0.75 }}>
                      Supabase Storage 저장됨 · 공개 URL 다운로드 사용 가능
                    </p>
                  )}
                </div>
              ) : (
                <p>이미지 생성에 실패했습니다.</p>
              )}
            </>
          ) : (
            <p>{state.error}</p>
          )}
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
        생성 이미지는 SynthID 워터마크가 포함될 수 있습니다. 약관·표시광고·교재
        표기 가이드를 따르세요. ·{" "}
        <strong>여러 슬라이드를 한 번에 생성</strong>하려면{" "}
        <a
          href="/generate"
          className="underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          /generate
        </a>{" "}
        를 사용하세요.
      </p>
    </div>
  );
}
