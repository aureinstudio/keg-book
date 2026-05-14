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
  const [state, formAction, isPending] = useActionState<CardNewsFormState, FormData>(
    generateCardNewsFormAction,
    null,
  );

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
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
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
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
          style={{ backgroundColor: "#D97706" }}
        >
          {isPending ? "처리 중…" : "프롬프트 저장 + (키 있으면) 이미지 생성"}
        </button>
      </form>

      {state && (
        <div
          className="rounded-lg p-4 text-sm"
          style={
            state.ok
              ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" }
              : { backgroundColor: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }
          }
          role="status"
        >
          {state.ok ? (
            <>
              <p>프롬프트 저장: {state.promptPath}</p>
              {state.skippedImage && (
                <p className="mt-2 opacity-90">
                  <code
                    className="rounded px-1 py-0.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                  >
                    GEMINI_API_KEY
                  </code>
                  가 없어 이미지는 건너뜁니다. 키를 넣은 뒤 다시 실행하면{" "}
                  <code
                    className="rounded px-1 py-0.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                  >
                    _output/card-news/*.png
                  </code>
                  에 저장됩니다.
                </p>
              )}
              {state.pngPath && (
                <p className="mt-2">
                  이미지:{" "}
                  <code className="text-xs" style={{ opacity: 0.9 }}>
                    {state.pngPath}
                  </code>
                </p>
              )}
            </>
          ) : (
            <>
              {state.error && <p>{state.error}</p>}
              {state.promptPath && (
                <p className="mt-2 text-xs opacity-80">프롬프트는 저장됨: {state.promptPath}</p>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
        생성 이미지는 SynthID 워터마크가 포함될 수 있습니다. 약관·표시광고·교재 표기 가이드를 따르세요.
      </p>
    </div>
  );
}
