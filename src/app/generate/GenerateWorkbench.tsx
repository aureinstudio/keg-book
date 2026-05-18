"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { generateContentAction, type GenerateResult } from "./actions";
import type { ChannelContent } from "@/lib/gemini/generateAllChannels";
import {
  downloadComposedCard,
  downloadComposedCardsAsZip,
} from "@/lib/client/composeCardPng";
import {
  CardComposeControls,
  DEFAULTS,
  isCustomized,
  type CardComposeValues,
} from "@/app/card-news/CardComposeControls";

// ───────────────────────────── 상수 ─────────────────────────────

const CHANNELS = [
  { key: "blogger",     label: "Blogger",       icon: "B", color: "#262626", route: "/blogger" },
  { key: "naver",       label: "네이버 블로그",  icon: "N", color: "#525252", route: "/naver" },
  { key: "newsletter",  label: "뉴스레터",       icon: "M", color: "#525252", route: "/newsletter" },
  { key: "instagram",   label: "인스타그램",     icon: "I", color: "#404040", route: "/social" },
  { key: "threads",     label: "Threads",        icon: "T", color: "#000000", route: "/social" },
  { key: "cardNews",    label: "카드뉴스",       icon: "C", color: "#737373", route: "/card-news" },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];

// ───────────────────────────── 헬퍼 ─────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string) {
  return text.replace(/\s+/g, " ").trim().length;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="rounded-full px-3 py-1 text-[11px] font-medium transition-colors"
      style={{
        border: "1px solid var(--color-border)",
        color: copied ? "#404040" : "var(--color-text-muted)",
        backgroundColor: "transparent",
      }}
    >
      {copied ? "복사됨 ✓" : "복사"}
    </button>
  );
}

// ───────────────────────────── 채널별 카드 렌더러 ─────────────────────────────

function BloggerCard({ data }: { data: ChannelContent["blogger"] }) {
  const plain = stripHtml(data.content_html);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>제목</p>
        <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>{data.title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>{data.title.length}자</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>메타 설명</p>
        <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>{data.description}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>{data.description.length}자</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>
          본문 미리보기 <span style={{ color: "var(--color-text-faint)" }}>({countWords(plain)}자)</span>
        </p>
        <p className="text-[12px] line-clamp-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{plain}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-faint)" }}>레이블</p>
        <div className="flex flex-wrap gap-1.5">
          {data.labels.map((l) => (
            <span key={l} className="rounded-full px-2.5 py-0.5 text-[11px]"
              style={{ backgroundColor: "rgba(38,38,38,0.1)", color: "#262626" }}>
              {l}
            </span>
          ))}
        </div>
      </div>
      <CopyButton text={`${data.title}\n\n${data.description}\n\n${plain}`} />
    </div>
  );
}

function NaverCard({ data }: { data: ChannelContent["naver"] }) {
  const plain = stripHtml(data.content_html);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>제목</p>
        <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>{data.title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>{data.title.length}자</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>요약</p>
        <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>{data.description}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>
          본문 미리보기 <span>({countWords(plain)}자)</span>
        </p>
        <p className="text-[12px] line-clamp-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{plain}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-faint)" }}>태그 ({data.tags.length}개)</p>
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-0.5 text-[11px]"
              style={{ backgroundColor: "rgba(82,82,82,0.1)", color: "#525252" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <CopyButton text={`${data.title}\n\n${data.description}\n\n${data.tags.join(" ")}`} />
    </div>
  );
}

function NewsletterCard({ data }: { data: ChannelContent["newsletter"] }) {
  const plain = stripHtml(data.body_html);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>제목 (Subject)</p>
        <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>{data.subject}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>{data.subject.length}자</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>프리헤더</p>
        <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>{data.preheader}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>{data.preheader.length}자</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>
          본문 미리보기 ({countWords(plain)}자)
        </p>
        <p className="text-[12px] line-clamp-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{plain}</p>
      </div>
      <CopyButton text={`제목: ${data.subject}\n프리헤더: ${data.preheader}\n\n${plain}`} />
    </div>
  );
}

function InstagramCard({ data }: { data: ChannelContent["instagram"] }) {
  const fullCaption = `${data.caption}\n\n${data.hashtags.join(" ")}`;
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>
          캡션 ({data.caption.length}자)
        </p>
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{data.caption}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-faint)" }}>
          해시태그 ({data.hashtags.length}개)
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: "#404040" }}>
          {data.hashtags.join(" ")}
        </p>
      </div>
      <CopyButton text={fullCaption} />
    </div>
  );
}

function ThreadsCard({ data }: { data: ChannelContent["threads"] }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>
          글 ({data.text.length}자)
        </p>
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{data.text}</p>
      </div>
      <CopyButton text={data.text} />
    </div>
  );
}

// 카드뉴스 합성/다운로드는 공용 모듈 사용
// → src/lib/client/composeCardPng.ts

function CardNewsCard({
  data,
  keyword,
}: {
  data: NonNullable<ChannelContent["cardNews"]>;
  keyword: string;
}) {
  const [zipBusy, setZipBusy] = useState(false);
  const [zipMsg, setZipMsg] = useState<string | null>(null);
  const originalHeadlines = useMemo(
    () => data.slides.map((s) => s.headline),
    [data.slides],
  );
  const [headlines, setHeadlines] = useState<string[]>(originalHeadlines);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [composeValues, setComposeValues] = useState<CardComposeValues[]>(() =>
    data.slides.map(() => ({ ...DEFAULTS })),
  );
  const [tuningIdx, setTuningIdx] = useState<number | null>(null);

  function updateCompose(i: number, next: CardComposeValues) {
    setComposeValues((prev) => {
      const arr = [...prev];
      arr[i] = next;
      return arr;
    });
  }

  const zippable = data.slides
    .map((slide, i) => {
      const src = slide.imageUrl
        ? slide.imageUrl
        : slide.imageBase64
        ? `data:image/png;base64,${slide.imageBase64}`
        : null;
      return src ? { i, slide, src } : null;
    })
    .filter((x): x is { i: number; slide: typeof data.slides[number]; src: string } => Boolean(x));

  async function handleZipAll() {
    if (zippable.length === 0) return;
    setZipBusy(true);
    setZipMsg(null);
    try {
      const safeKw = keyword.replace(/[^\w가-힣-]+/g, "_").slice(0, 30) || "card-news";
      await downloadComposedCardsAsZip(
        zippable.map(({ i, slide, src }) => ({
          imgSrc: src,
          headline: headlines[i] ?? slide.headline,
          isCover: slide.role === "cover",
          filename: `${safeKw}-${i + 1}-${slide.role}.png`,
          options: composeValues[i] ?? DEFAULTS,
        })),
        `${safeKw}-cards.zip`,
      );
      setZipMsg(`ZIP 다운로드 완료 — ${zippable.length}장`);
      setTimeout(() => setZipMsg(null), 2500);
    } catch (e) {
      setZipMsg(`ZIP 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setZipBusy(false);
    }
  }

  if (!data.slides.length) {
    return (
      <div className="rounded-xl p-4 text-center text-[13px]"
        style={{ backgroundColor: "rgba(115,115,115,0.08)", color: "var(--color-text-muted)" }}>
        {data.error ?? "카드뉴스가 생성되지 않았습니다."}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {data.error && (
        <div className="rounded-lg px-3 py-2 text-[11px]"
          style={{ backgroundColor: "rgba(115,115,115,0.1)", color: "#c47800" }}>
          ⚠ {data.error}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-faint)" }}>
          슬라이드 {data.slides.length}장 · 헤드라인 포함 PNG
        </p>
        {zippable.length > 0 && (
          <button
            type="button"
            onClick={handleZipAll}
            disabled={zipBusy}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity disabled:opacity-50"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-2)",
              color: "var(--color-text)",
            }}
          >
            {zipBusy
              ? `ZIP 생성 중… (${zippable.length})`
              : `↓ 전체 ZIP 다운로드 (${zippable.length})`}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {data.slides.map((slide, i) => {
          const src = slide.imageUrl
            ? slide.imageUrl
            : slide.imageBase64
            ? `data:image/png;base64,${slide.imageBase64}`
            : null;
          const isCover = slide.role === "cover";
          const roleLabel = isCover ? "표지" : slide.role === "outro" ? "마무리" : `본문 ${i}`;
          const headline = headlines[i] ?? slide.headline;
          const isEdited = headline !== originalHeadlines[i];
          const isEditing = editingIdx === i;
          const cv = composeValues[i] ?? DEFAULTS;
          const cvCustomized = isCustomized(cv);
          const isTuning = tuningIdx === i;
          const previewFontSize = (isCover ? 20 : 16) * cv.fontScale;
          const previewPadBottomPct = cv.bottomOffset * 100;
          const gradA = (0.55 * cv.gradientStrength).toFixed(3);
          const gradB = (0.85 * cv.gradientStrength).toFixed(3);
          return (
            <div key={i} className="overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--color-border)" }}>
              <div className="relative" style={{ aspectRatio: "4 / 5", backgroundColor: "var(--color-surface-2)" }}>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={headline} crossOrigin="anonymous"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px]"
                    style={{ color: "var(--color-text-faint)" }}>
                    이미지 생성 실패
                  </div>
                )}
                <div className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                  {roleLabel}
                </div>
                <div className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                  {i + 1}/{data.slides.length}
                </div>
                {isEdited && (
                  <div
                    className="absolute right-2 top-9 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.92)",
                      color: "#262626",
                    }}
                    title="원본 헤드라인에서 수정됨"
                  >
                    edited
                  </div>
                )}
                <div
                  className="absolute inset-x-0 px-4 pt-10"
                  style={{
                    bottom: `${previewPadBottomPct}%`,
                    paddingBottom: 0,
                    background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${gradA}) 55%, rgba(0,0,0,${gradB}) 100%)`,
                  }}>
                  <p
                    className="text-white leading-tight"
                    style={{
                      fontSize: `${previewFontSize}px`,
                      fontWeight: 800,
                      textShadow:
                        "0 0 4px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5)",
                      letterSpacing: "-0.01em",
                      WebkitTextStroke: `${Math.max(1, previewFontSize * 0.04)}px rgba(0,0,0,0.55)`,
                    }}>
                    {headline}
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={headline}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHeadlines((prev) => {
                          const next = [...prev];
                          next[i] = v;
                          return next;
                        });
                      }}
                      rows={2}
                      autoFocus
                      className="w-full rounded-md px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        border: "1px solid var(--color-border-strong)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text)",
                        resize: "vertical",
                      }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                        {headline.length}자
                      </span>
                      <div className="flex gap-1.5">
                        {isEdited && (
                          <button
                            type="button"
                            onClick={() => {
                              setHeadlines((prev) => {
                                const next = [...prev];
                                next[i] = originalHeadlines[i];
                                return next;
                              });
                            }}
                            className="rounded px-2 py-0.5 text-[11px]"
                            style={{
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text-muted)",
                              backgroundColor: "transparent",
                            }}
                          >
                            원본
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingIdx(null)}
                          className="rounded px-2 py-0.5 text-[11px] font-medium text-white"
                          style={{ backgroundColor: "#262626" }}
                        >
                          완료
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingIdx(i)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] transition-colors"
                    style={{
                      border: "1px dashed var(--color-border)",
                      backgroundColor: "transparent",
                      color: "var(--color-text)",
                    }}
                    title="헤드라인 인라인 편집"
                  >
                    <span className="truncate font-medium">✎ {headline}</span>
                    <span style={{ color: "var(--color-text-faint)" }}>편집</span>
                  </button>
                )}
                <p className="text-[11px] line-clamp-2" style={{ color: "var(--color-text-faint)" }}>
                  {slide.imagePrompt}
                </p>

                <button
                  type="button"
                  onClick={() => setTuningIdx(isTuning ? null : i)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] transition-colors"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: isTuning ? "var(--color-surface-2)" : "transparent",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span>⚙ 합성 조정 {cvCustomized ? "(수정됨)" : ""}</span>
                  <span style={{ color: "var(--color-text-faint)" }}>
                    {isTuning ? "▲" : "▼"}
                  </span>
                </button>
                {isTuning && (
                  <CardComposeControls
                    value={cv}
                    onChange={(next) => updateCompose(i, next)}
                    compact
                  />
                )}

                {src && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadComposedCard(
                        src,
                        headline,
                        isCover,
                        `slide_${i + 1}.png`,
                        cv,
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
                    style={{ color: "#737373" }}>
                    ↓ 헤드라인 포함 PNG 다운로드
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────── 생성 통계 배너 ─────────────────────────────

function StatsBanner({ data, keyword }: { data: ChannelContent; keyword: string }) {
  const bloggerWords = countWords(stripHtml(data.blogger.content_html));
  const naverWords = countWords(stripHtml(data.naver.content_html));
  const newsletterWords = countWords(stripHtml(data.newsletter.body_html));
  const instagramWords = data.instagram.caption.length;
  const threadsWords = data.threads.text.length;
  const cardSlides = data.cardNews?.slides.length ?? 0;
  const totalContents = 5 + (cardSlides > 0 ? 1 : 0); // 텍스트 5채널 + 카드뉴스

  return (
    <div
      className="mb-6 rounded-2xl px-5 py-4"
      style={{
        background: "linear-gradient(135deg, rgba(10,10,10,0.08) 0%, rgba(82,82,82,0.08) 100%)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-faint)" }}>
            키워드
          </p>
          <p className="text-[16px] font-medium" style={{ color: "var(--color-text)" }}>「{keyword}」</p>
        </div>
        <div className="flex gap-5 flex-wrap">
          <div className="text-center">
            <p className="text-[22px] font-medium tabular-nums" style={{ color: "var(--color-accent)" }}>{totalContents}</p>
            <p className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>채널</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-medium tabular-nums" style={{ color: "var(--color-accent)" }}>
              {(bloggerWords + naverWords + newsletterWords).toLocaleString()}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>장문 총 글자</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-medium tabular-nums" style={{ color: "var(--color-accent)" }}>
              {instagramWords + threadsWords}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>소셜 글자</p>
          </div>
        </div>
      </div>
      {/* 채널별 글자수 바 */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
        {[
          { label: "Blogger", value: bloggerWords.toLocaleString(), color: "#262626" },
          { label: "네이버", value: naverWords.toLocaleString(), color: "#525252" },
          { label: "뉴스레터", value: newsletterWords.toLocaleString(), color: "#525252" },
          { label: "인스타", value: instagramWords.toLocaleString(), color: "#404040" },
          { label: "Threads", value: threadsWords.toLocaleString(), color: "#000" },
          { label: "카드뉴스", value: cardSlides > 0 ? `${cardSlides}장` : "—", color: "#737373" },
        ].map((ch) => (
          <div key={ch.label}>
            <p className="text-[13px] font-medium tabular-nums" style={{ color: ch.color }}>
              {ch.value}
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>{ch.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────── 메인 컴포넌트 ─────────────────────────────

const inputClass = "rounded-xl px-3.5 py-2.5 text-[14px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] w-full";
const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text)",
};

export function GenerateWorkbench() {
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>("blogger");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await generateContentAction(formData);
      setResult(res);
      if (res.ok) setActiveChannel("blogger");
    });
  }

  const channelData = result?.ok ? result.data : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)" }}
          >
            ✦
          </div>
          <h1 className="text-[22px] font-normal" style={{ color: "var(--color-text)" }}>
            콘텐츠 생성
          </h1>
        </div>
        <p className="text-[14px]" style={{ color: "var(--color-text-muted)" }}>
          키워드 하나로 전 채널 마케팅 콘텐츠를 자동 생성합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <form
        ref={formRef}
        action={handleSubmit}
        className="mb-8 rounded-2xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="grid gap-4">
          {/* 키워드 — 필수 */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
              키워드 / 주제 <span style={{ color: "#262626" }}>*</span>
            </label>
            <input
              name="keyword"
              type="text"
              required
              placeholder="예: 중학교 영어 교재 신학기 출시"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* 선택 입력 — 2열 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
                교재/제품명 <span className="text-[11px] font-normal" style={{ color: "var(--color-text-faint)" }}>(선택)</span>
              </label>
              <input
                name="productName"
                type="text"
                placeholder="예: 리딩파워 중2 심화편"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
                타겟 독자 <span className="text-[11px] font-normal" style={{ color: "var(--color-text-faint)" }}>(선택)</span>
              </label>
              <input
                name="targetAudience"
                type="text"
                placeholder="예: 중2 학생, 영어 준비 학부모"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* 추가 맥락 */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
              추가 맥락 <span className="text-[11px] font-normal" style={{ color: "var(--color-text-faint)" }}>(선택)</span>
            </label>
            <textarea
              name="context"
              rows={2}
              placeholder="예: 3월 신학기 시즌 캠페인, 특가 이벤트 진행 중, 온라인 서점 출시"
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[12px]" style={{ color: "var(--color-text-faint)" }}>
            5개 텍스트 채널 + 카드뉴스 3장 동시 생성
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-medium text-white transition-all"
            style={{
              background: isPending
                ? "var(--color-border)"
                : "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
              cursor: isPending ? "not-allowed" : "pointer",
              minWidth: "140px",
              justifyContent: "center",
            }}
          >
            {isPending ? (
              <>
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                />
                생성 중…
              </>
            ) : (
              <>✦ 전 채널 생성</>
            )}
          </button>
        </div>
      </form>

      {/* 에러 */}
      {result && !result.ok && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-[13px]"
          style={{
            backgroundColor: "rgba(38,38,38,0.08)",
            border: "1px solid rgba(38,38,38,0.25)",
            color: "#c62828",
          }}
          role="alert"
        >
          {result.error}
        </div>
      )}

      {/* 결과 */}
      {result?.ok && channelData && (
        <>
          {/* 부분 실패 경고 — 일부 채널만 실패한 경우 */}
          {channelData._errors && Object.keys(channelData._errors).length > 0 && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-[12px]"
              style={{
                backgroundColor: "rgba(180,140,40,0.10)",
                border: "1px solid rgba(180,140,40,0.35)",
                color: "#7a5a10",
              }}
              role="alert"
            >
              <p className="mb-1 font-medium" style={{ color: "#6a4a00" }}>
                ⚠ 일부 채널 생성에 실패했습니다 (다른 채널은 정상)
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                {Object.entries(channelData._errors).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}</strong>: {String(v).slice(0, 160)}
                  </li>
                ))}
              </ul>
              <p className="mt-2" style={{ color: "#7a5a10" }}>
                다시 생성하려면 같은 키워드로 한 번 더 시도해 주세요. (API 일시
                오류는 자동 1회 재시도되었습니다.)
              </p>
            </div>
          )}

          {/* 통계 배너 */}
          <StatsBanner data={channelData} keyword={result.keyword} />

          {/* 채널 탭 */}
          <div
            className="mb-4 flex gap-1 overflow-x-auto rounded-2xl p-1"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {CHANNELS.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setActiveChannel(ch.key)}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors"
                style={{
                  backgroundColor: activeChannel === ch.key ? "var(--color-surface-2)" : "transparent",
                  color: activeChannel === ch.key ? ch.color : "var(--color-text-muted)",
                  border: activeChannel === ch.key ? `1px solid ${ch.color}30` : "1px solid transparent",
                }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
                  style={{ backgroundColor: ch.color }}
                >
                  {ch.icon}
                </span>
                {ch.label}
              </button>
            ))}
          </div>

          {/* 채널 콘텐츠 카드 */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* 채널 헤더 + 보내기 버튼 */}
            <div className="mb-4 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                {CHANNELS.filter((c) => c.key === activeChannel).map((ch) => (
                  <span key={ch.key}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: ch.color }}
                  >
                    {ch.icon}
                  </span>
                ))}
                <h2 className="text-[16px] font-medium" style={{ color: "var(--color-text)" }}>
                  {CHANNELS.find((c) => c.key === activeChannel)?.label}
                </h2>
              </div>
              {result.generationId && activeChannel !== "cardNews" && (() => {
                const ch = CHANNELS.find((c) => c.key === activeChannel)!;
                return (
                  <Link
                    href={`${ch.route}?from=${result.generationId}&channel=${activeChannel}`}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white transition-all"
                    style={{ backgroundColor: ch.color }}
                  >
                    → {ch.label}로 보내기
                  </Link>
                );
              })()}
            </div>

            {/* 채널별 렌더 */}
            {activeChannel === "blogger"    && <BloggerCard    data={channelData.blogger}    />}
            {activeChannel === "naver"      && <NaverCard      data={channelData.naver}      />}
            {activeChannel === "newsletter" && <NewsletterCard data={channelData.newsletter} />}
            {activeChannel === "instagram"  && <InstagramCard  data={channelData.instagram}  />}
            {activeChannel === "threads"    && <ThreadsCard    data={channelData.threads}    />}
            {activeChannel === "cardNews"   && (channelData.cardNews
              ? <CardNewsCard data={channelData.cardNews} keyword={result.keyword} />
              : (
                <div className="rounded-xl p-4 text-center text-[13px]"
                  style={{ backgroundColor: "rgba(115,115,115,0.08)", color: "var(--color-text-muted)" }}>
                  카드뉴스가 생성되지 않았습니다.
                </div>
              ))
            }
          </div>

          {/* 재생성 버튼 */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => formRef.current && handleSubmit(new FormData(formRef.current))}
              disabled={isPending}
              className="rounded-full px-5 py-2 text-[13px] font-medium transition-colors"
              style={{
                border: "1px solid var(--color-border-strong)",
                color: "var(--color-text-muted)",
                backgroundColor: "transparent",
              }}
            >
              ↺ 재생성
            </button>
          </div>
        </>
      )}
    </div>
  );
}
