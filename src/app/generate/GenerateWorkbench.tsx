"use client";

import { useState, useTransition, useRef } from "react";
import { generateContentAction, type GenerateResult } from "./actions";
import type { ChannelContent } from "@/lib/gemini/generateAllChannels";

// ───────────────────────────── 상수 ─────────────────────────────

const CHANNELS = [
  { key: "blogger",     label: "Blogger",       icon: "B", color: "#EA4335" },
  { key: "naver",       label: "네이버 블로그",  icon: "N", color: "#03C75A" },
  { key: "newsletter",  label: "뉴스레터",       icon: "M", color: "#9C27B0" },
  { key: "instagram",   label: "인스타그램",     icon: "I", color: "#E1306C" },
  { key: "threads",     label: "Threads",        icon: "T", color: "#000000" },
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
        color: copied ? "#34A853" : "var(--color-text-muted)",
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
              style={{ backgroundColor: "rgba(234,67,53,0.1)", color: "#EA4335" }}>
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
              style={{ backgroundColor: "rgba(3,199,90,0.1)", color: "#03C75A" }}>
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
        <p className="text-[12px] leading-relaxed" style={{ color: "#E1306C" }}>
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

// ───────────────────────────── 생성 통계 배너 ─────────────────────────────

function StatsBanner({ data, keyword }: { data: ChannelContent; keyword: string }) {
  const bloggerWords = countWords(stripHtml(data.blogger.content_html));
  const naverWords = countWords(stripHtml(data.naver.content_html));
  const newsletterWords = countWords(stripHtml(data.newsletter.body_html));
  const instagramWords = data.instagram.caption.length;
  const threadsWords = data.threads.text.length;
  const totalContents = 5; // 채널 수

  return (
    <div
      className="mb-6 rounded-2xl px-5 py-4"
      style={{
        background: "linear-gradient(135deg, rgba(66,133,244,0.08) 0%, rgba(156,39,176,0.08) 100%)",
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
      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        {[
          { label: "Blogger", words: bloggerWords, color: "#EA4335" },
          { label: "네이버", words: naverWords, color: "#03C75A" },
          { label: "뉴스레터", words: newsletterWords, color: "#9C27B0" },
          { label: "인스타", words: instagramWords, color: "#E1306C" },
          { label: "Threads", words: threadsWords, color: "#000" },
        ].map((ch) => (
          <div key={ch.label}>
            <p className="text-[13px] font-medium tabular-nums" style={{ color: ch.color }}>
              {ch.words.toLocaleString()}
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
            style={{ background: "linear-gradient(135deg, #4285F4 0%, #9C27B0 100%)" }}
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
              키워드 / 주제 <span style={{ color: "#EA4335" }}>*</span>
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
            5개 채널(Blogger·네이버·뉴스레터·인스타·Threads) 동시 생성
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-medium text-white transition-all"
            style={{
              background: isPending
                ? "var(--color-border)"
                : "linear-gradient(135deg, #4285F4 0%, #9C27B0 100%)",
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
            backgroundColor: "rgba(234,67,53,0.08)",
            border: "1px solid rgba(234,67,53,0.25)",
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
            {/* 채널 헤더 */}
            <div className="mb-4 flex items-center gap-2.5">
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

            {/* 채널별 렌더 */}
            {activeChannel === "blogger"    && <BloggerCard    data={channelData.blogger}    />}
            {activeChannel === "naver"      && <NaverCard      data={channelData.naver}      />}
            {activeChannel === "newsletter" && <NewsletterCard data={channelData.newsletter} />}
            {activeChannel === "instagram"  && <InstagramCard  data={channelData.instagram}  />}
            {activeChannel === "threads"    && <ThreadsCard    data={channelData.threads}    />}
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
