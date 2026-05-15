import type { Metadata } from "next";
import { listBufferChannels } from "@/lib/buffer/listBufferChannels";
import { SocialWorkbench } from "./SocialWorkbench";
import { PrefillFromGeneration } from "../PrefillFromGeneration";
import { getGeneration } from "@/lib/db/generations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "소셜 · Buffer — keg-book" };

type PageProps = {
  searchParams: Promise<{
    bf?: string;
    postId?: string;
    msg?: string;
    from?: string;
    channel?: string;
  }>;
};

export default async function SocialPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();

  let bufferChannels: Awaited<ReturnType<typeof listBufferChannels>> = [];
  let bufferListError: string | null = null;

  if (token) {
    try {
      bufferChannels = await listBufferChannels(token);
    } catch (e) {
      bufferListError = e instanceof Error ? e.message : "Buffer API 오류";
    }
  }

  // /generate에서 넘어온 인스타·Threads 콘텐츠 프리필
  let initialTitle: string | undefined;
  let initialBody: string | undefined;
  let initialHashtags: string[] | undefined;

  if (sp.from) {
    const gen = await getGeneration(sp.from).catch(() => null);
    if (gen) {
      const raw = gen.raw_json as Record<string, unknown>;
      const ig = raw.instagram as { caption?: string; hashtags?: string[] } | undefined;
      const th = raw.threads as { text?: string } | undefined;

      initialTitle = gen.keyword;
      // 캡션과 Threads 텍스트를 HTML 본문 2단락으로 결합
      const parts: string[] = [];
      if (ig?.caption) parts.push(`<p>${escapeHtml(ig.caption).replace(/\n/g, "<br/>")}</p>`);
      if (th?.text) parts.push(`<p><strong>Threads:</strong> ${escapeHtml(th.text)}</p>`);
      if (parts.length > 0) initialBody = parts.join("\n");
      initialHashtags = ig?.hashtags;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#E1306C" }}>S</span>
        <div>
          <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>소셜 채널</h1>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>인스타그램 · Threads · Buffer 예약 큐</p>
        </div>
      </div>

      <PrefillFromGeneration
        channel={sp.channel === "threads" ? "threads" : "instagram"}
        basePath="/social"
        fromId={sp.from}
      />

      {sp.bf === "ok" && sp.postId && (
        <div className="mb-5 text-[13px]"
          style={{ backgroundColor: "rgba(52,168,83,0.08)", border: "1px solid rgba(52,168,83,0.25)", color: "#137333", borderRadius: "8px", padding: "12px 16px" }}
          role="status">
          Buffer에 추가했습니다.{" "}
          <span className="font-mono text-[11px]">post id: {sp.postId}</span>
        </div>
      )}
      {sp.bf === "err" && sp.msg && (
        <div className="mb-5 text-[13px]"
          style={{ backgroundColor: "rgba(249,171,0,0.08)", border: "1px solid rgba(249,171,0,0.3)", color: "#B45309", borderRadius: "8px", padding: "12px 16px" }}
          role="alert">
          {sp.msg}
        </div>
      )}

      <SocialWorkbench
        bufferChannels={bufferChannels}
        bufferListError={bufferListError}
        bufferTokenConfigured={Boolean(token)}
        initialTitle={initialTitle}
        initialBody={initialBody}
        initialHashtags={initialHashtags}
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
