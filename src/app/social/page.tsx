import type { Metadata } from "next";
import { listBufferChannels } from "@/lib/buffer/listBufferChannels";
import { SocialWorkbench } from "./SocialWorkbench";
import { PrefillFromGeneration } from "../PrefillFromGeneration";
import { getGeneration } from "@/lib/db/generations";
import { CardNewsResultView } from "../card-news/CardNewsResultView";
import type { CardNewsContent } from "@/lib/gemini/generateCardNewsSlides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "소셜 · Buffer — keg-book" };

type PageProps = {
  searchParams: Promise<{
    bf?: string;
    postId?: string;
    msg?: string;
    imgs?: string;
    warn?: string;
    from?: string;
    channel?: string;
  }>;
};

function warnMessage(code: string): string | null {
  switch (code) {
    case "no-slides":
      return "카드뉴스가 생성되지 않아 캐러셀 없이 텍스트만 발행되었습니다.";
    case "no-public-urls":
      return "카드뉴스 슬라이드의 공개 URL이 없어 캐러셀이 첨부되지 않았습니다. (Supabase Storage 업로드 확인 필요)";
    case "fetch-failed":
      return "캐러셀 첨부용 데이터를 불러오지 못해 텍스트만 발행되었습니다.";
    default:
      return null;
  }
}

export default async function SocialPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();

  let bufferChannels: Awaited<ReturnType<typeof listBufferChannels>> = [];
  let bufferListError: string | null = null;

  if (token) {
    try {
      bufferChannels = await listBufferChannels(token);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Buffer API 오류";
      const s = raw.toLowerCase();
      bufferListError = /401|unauthor|invalid token|token expired|forbidden/.test(s)
        ? "Buffer 토큰이 만료되었거나 권한이 없습니다. Vercel 환경변수의 BUFFER_API_ACCESS_TOKEN 을 갱신해 주세요."
        : raw.slice(0, 220);
    }
  }

  // /generate에서 넘어온 인스타·Threads 콘텐츠 프리필
  let initialTitle: string | undefined;
  let initialBody: string | undefined;
  let initialHashtags: string[] | undefined;
  let cardNews: CardNewsContent | undefined;
  let genKeyword: string | undefined;

  if (sp.from) {
    const gen = await getGeneration(sp.from).catch(() => null);
    if (gen) {
      const raw = gen.raw_json as Record<string, unknown>;
      const ig = raw.instagram as { caption?: string; hashtags?: string[] } | undefined;
      const th = raw.threads as { text?: string } | undefined;

      initialTitle = gen.keyword;
      genKeyword = gen.keyword;
      // 캡션과 Threads 텍스트를 HTML 본문 2단락으로 결합
      const parts: string[] = [];
      if (ig?.caption) parts.push(`<p>${escapeHtml(ig.caption).replace(/\n/g, "<br/>")}</p>`);
      if (th?.text) parts.push(`<p><strong>Threads:</strong> ${escapeHtml(th.text)}</p>`);
      if (parts.length > 0) initialBody = parts.join("\n");
      initialHashtags = ig?.hashtags;
      cardNews = gen.raw_json?.cardNews;
    }
  }

  // 인스타 탭에서만 카드뉴스 슬라이드 노출 (Threads는 텍스트 채널이므로 생략)
  const showCardNews =
    sp.channel !== "threads" && cardNews && (cardNews.slides?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#404040" }}>S</span>
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
          style={{ backgroundColor: "rgba(64,64,64,0.08)", border: "1px solid rgba(64,64,64,0.25)", color: "#404040", borderRadius: "8px", padding: "12px 16px" }}
          role="status">
          Buffer에 추가했습니다.
          {Number(sp.imgs ?? 0) > 0 && (
            <span className="ml-1.5">카드뉴스 {sp.imgs}장 첨부 완료.</span>
          )}{" "}
          <span className="font-mono text-[11px]">post id: {sp.postId}</span>
          {sp.warn && warnMessage(sp.warn) && (
            <div className="mt-1.5 text-[12px]" style={{ color: "#737373" }}>
              ⚠ {warnMessage(sp.warn)}
            </div>
          )}
        </div>
      )}
      {sp.bf === "err" && sp.msg && (
        <div className="mb-5 text-[13px]"
          style={{ backgroundColor: "rgba(115,115,115,0.08)", border: "1px solid rgba(115,115,115,0.3)", color: "#525252", borderRadius: "8px", padding: "12px 16px" }}
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
        generationId={sp.from}
        carouselAvailable={Boolean(showCardNews)}
        carouselCount={cardNews?.slides?.length ?? 0}
      />

      {showCardNews && cardNews && genKeyword && (
        <section
          className="mt-6 rounded-2xl p-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2
                className="text-[14px] font-medium"
                style={{ color: "var(--color-text)" }}
              >
                📸 인스타그램 캐러셀 슬라이드{" "}
                <span
                  className="ml-1 text-[12px] font-normal"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  ({cardNews.slides.length})
                </span>
              </h2>
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                각 슬라이드를 다운로드해 인스타에 캐러셀(여러 장)로 업로드하세요. 위 캡션·해시태그와 함께 사용.
              </p>
            </div>
          </div>

          <CardNewsResultView
            keyword={genKeyword}
            slides={cardNews.slides}
            error={cardNews.error}
          />
        </section>
      )}
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
