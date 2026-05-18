import type { Metadata } from "next";
import { listRecentActivity, type ActivityLog } from "@/lib/db/generations";
import {
  getPublishHistory,
  type GenerationWithPublish,
} from "@/lib/db/publishHistory";
import { HistoryView } from "./HistoryView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "작업 기록 — keg-book" };

export default async function HistoryPage() {
  const [generations, activity] = await Promise.all([
    getPublishHistory(30).catch(() => [] as GenerationWithPublish[]),
    listRecentActivity(50).catch(() => [] as ActivityLog[]),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#5F6368" }}
        >
          H
        </span>
        <div>
          <h1
            className="text-[18px] font-normal"
            style={{ color: "var(--color-text)" }}
          >
            작업 기록
          </h1>
          <p
            className="text-[12px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            생성한 콘텐츠와 채널별 발행 상태를 한 화면에서 확인
          </p>
        </div>
      </div>

      <HistoryView generations={generations} activity={activity} />
    </div>
  );
}
