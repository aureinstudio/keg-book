import type { Metadata } from "next";
import { CardNewsForm } from "./CardNewsForm";

export const metadata: Metadata = { title: "카드뉴스 (Gemini) — keg-book" };

export default function CardNewsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#F9AB00" }}>C</span>
        <div>
          <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>카드뉴스</h1>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Gemini API · 이미지 생성 ·{" "}
            <code className="rounded px-1" style={{ backgroundColor: "var(--color-surface-2)", fontSize: "11px" }}>
              _output/card-news/
            </code>{" "}저장
          </p>
        </div>
      </div>
      <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px" }}>
        <CardNewsForm />
      </div>
    </div>
  );
}
