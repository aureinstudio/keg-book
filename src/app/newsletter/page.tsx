import type { Metadata } from "next";
import { NewsletterWorkbench } from "./NewsletterWorkbench";

export const metadata: Metadata = { title: "뉴스레터 — keg-book" };

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#9C27B0" }}>M</span>
        <div>
          <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>뉴스레터</h1>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>메일리(Maily) · HTML 생성 · 구독자 관리 보조</p>
        </div>
      </div>
      <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px" }}>
        <NewsletterWorkbench />
      </div>
    </div>
  );
}
