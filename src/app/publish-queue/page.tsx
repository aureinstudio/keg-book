import type { Metadata } from "next";
import { QueueWorkbench } from "./QueueWorkbench";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "발행 큐 · keg-book" };

export default function PublishQueuePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#1A73E8" }}>Q</span>
        <div>
          <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>발행 큐</h1>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Supabase PostgreSQL · 메일리 구독자 조회
          </p>
        </div>
      </div>
      <QueueWorkbench />
    </div>
  );
}
