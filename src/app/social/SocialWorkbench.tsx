"use client";

import { saveOutputDraftAction } from "@/app/actions/saveOutputDraft";
import { submitBufferQueue } from "@/app/social/actions";
import type { BufferChannelLite } from "@/lib/buffer/listBufferChannels";
import { buildSocialPack } from "@/lib/social/buildSocialPack";
import { useEffect, useMemo, useState, useTransition } from "react";

function rangeColor(len: number, min: number, max: number) {
  if (len === 0) return "var(--color-text-faint)";
  if (len < min) return "#F9AB00";
  if (len <= max) return "#34A853";
  return "#EA4335";
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0 mt-0.5"
      style={{ backgroundColor: ok ? "#34A853" : "#F9AB00" }}
    />
  );
}

type Props = {
  bufferChannels: BufferChannelLite[];
  bufferListError: string | null;
  bufferTokenConfigured: boolean;
};

const inputClass =
  "rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] w-full";
const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text)",
};

export function SocialWorkbench({
  bufferChannels,
  bufferListError,
  bufferTokenConfigured,
}: Props) {
  const [title, setTitle] = useState("봄 학기 신간 교재 안내");
  const [bodyHtml, setBodyHtml] = useState(
    "<p>핵심 메시지를 여기 HTML로 적습니다.</p><p>두 번째 문단.</p>",
  );
  const [extraHashtags, setExtraHashtags] = useState("");
  const [queueText, setQueueText] = useState("");
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [seoOpen, setSeoOpen] = useState(true);

  const pack = useMemo(() => buildSocialPack(title, bodyHtml), [title, bodyHtml]);

  // 추가 해시태그를 인스타 캡션에 합산
  const extraTagList = extraHashtags
    .split(/[\s,，]+/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const captionWithTags = useMemo(() => {
    if (extraTagList.length === 0) return pack.instagramCaption;
    const tagStr = extraTagList.map((t) => `#${t}`).join(" ");
    return `${pack.instagramCaption}\n\n${tagStr}`;
  }, [pack.instagramCaption, extraTagList]);

  const captionLen = captionWithTags.length;
  const tagCount = (captionWithTags.match(/#\w/g) ?? []).length;

  const socialChecks = [
    {
      label: `캡션 길이 (${captionLen}자)`,
      ok: captionLen <= 2200,
      hint: "인스타그램 최대 2,200자",
    },
    {
      label: `해시태그 (${tagCount}개)`,
      ok: tagCount >= 5 && tagCount <= 30,
      hint: "인스타 최적 5–30개, Threads는 3–5개 권장",
    },
    {
      label: "첫 줄 훅(Hook) 포함",
      ok: title.length >= 10,
      hint: "제목(훅)이 길수록 더보기 클릭 유도",
    },
  ];

  useEffect(() => {
    setQueueText(captionWithTags);
  }, [captionWithTags]);

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(`${label} 복사됨`);
      setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(`${label} 복사 실패 — 텍스트를 직접 선택해 주세요`);
      setTimeout(() => setCopyHint(null), 3000);
    }
  }

  function savePack(kind: "instagram" | "threads") {
    startTransition(async () => {
      setSaveMsg(null);
      const sub = kind === "instagram" ? "social-instagram" : "social-threads";
      const content =
        kind === "instagram"
          ? pack.instagramCaption
          : pack.threadsPosts.map((p, i) => `--- ${i + 1} ---\n${p}`).join("\n\n");
      const r = await saveOutputDraftAction({
        subfolder: sub,
        base: title.slice(0, 40),
        ext: ".txt",
        content,
      });
      setSaveMsg(r.ok ? `저장: ${r.relativePath}` : r.error);
    });
  }

  const postableChannels = bufferChannels.filter(
    (c) => !c.isLocked && !c.isDisconnected,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* SEO 체크 */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
          소셜 디스커버리 점검
        </p>
        <button
          type="button"
          onClick={() => setSeoOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: seoOpen ? "rgba(225,48,108,0.1)" : "var(--color-surface-2)",
            color: seoOpen ? "#E1306C" : "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          점검 {seoOpen ? "▲" : "▼"}
        </button>
      </div>

      {seoOpen && (
        <div
          className="rounded-lg p-3"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          <ul className="space-y-1.5">
            {socialChecks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]">
                <Dot ok={c.ok} />
                <div>
                  <span style={{ color: "var(--color-text)" }}>{c.label}</span>
                  <span className="ml-1.5" style={{ color: "var(--color-text-faint)" }}>— {c.hint}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {copyHint && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }} role="status">
          {copyHint}
        </p>
      )}
      {saveMsg && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: saveMsg.startsWith("저장:") ? "#EFF6FF" : "#FFFBEB",
            color: saveMsg.startsWith("저장:") ? "#1E40AF" : "#92400E",
          }}
          role="status"
        >
          {saveMsg}
        </p>
      )}

      {/* 입력 영역 */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              글 제목 (훅)
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="첫 줄 — 스크롤 중단을 유도하는 강렬한 문장"
              className={inputClass}
              style={inputStyle}
            />
          </label>
        </div>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            본문 HTML (Blogger·네이버와 동일 원고)
          </span>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={5}
            className={`${inputClass} font-mono text-xs`}
            style={inputStyle}
          />
        </label>

        {/* 추가 해시태그 */}
        <label className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              추가 해시태그{" "}
              <span style={{ color: "var(--color-text-faint)" }}>(공백 또는 쉼표 구분, # 생략 가능)</span>
            </span>
            <span className="text-[11px]" style={{ color: rangeColor(extraTagList.length, 3, 20) }}>
              {extraTagList.length}개 추가
            </span>
          </div>
          <input
            value={extraHashtags}
            onChange={(e) => setExtraHashtags(e.target.value)}
            placeholder="예: 영어교재 중학수학 교재추천 코리아교육그룹"
            className={inputClass}
            style={inputStyle}
          />
          {extraTagList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {extraTagList.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2 py-0.5 text-[11px]"
                  style={{ backgroundColor: "rgba(225,48,108,0.1)", color: "#E1306C" }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </label>
      </div>

      {/* 인스타그램 */}
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: "#E1306C" }}
          >
            I
          </span>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            인스타그램 캡션
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            최대 2,200자
          </span>
          <span
            className="ml-auto text-[11px] tabular-nums font-medium"
            style={{ color: rangeColor(captionLen, 1, 2200) }}
          >
            {captionLen} / 2200
          </span>
        </div>
        <textarea
          readOnly
          value={captionWithTags}
          rows={8}
          aria-label="생성된 인스타그램 캡션"
          className="w-full rounded-lg px-3 py-2 font-mono text-xs"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-muted)",
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText("인스타 캡션", captionWithTags)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#E1306C" }}
          >
            캡션 복사
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => savePack("instagram")}
            className="rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              backgroundColor: "transparent",
            }}
          >
            _output/social-instagram 저장
          </button>
        </div>
      </section>

      {/* Threads */}
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: "#E6702A" }}
          >
            T
          </span>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Threads (분할)
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            약 480자 단위
          </span>
        </div>
        <ol className="space-y-2">
          {pack.threadsPosts.map((p, i) => (
            <li
              key={i}
              className="rounded-lg p-3"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium" style={{ color: "var(--color-text-faint)" }}>
                  {i + 1} / {pack.threadsPosts.length}
                </span>
                <button
                  type="button"
                  onClick={() => void copyText(`Threads ${i + 1}탄`, p)}
                  className="rounded px-2 py-0.5 text-[11px] transition-colors"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  복사
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs" style={{ color: "var(--color-text)" }}>
                {p}
              </pre>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={pending}
          onClick={() => savePack("threads")}
          className="mt-3 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            backgroundColor: "transparent",
          }}
        >
          전체 스레드 _output/social-threads 저장
        </button>
      </section>

      {/* Buffer */}
      <section
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-accent)",
          opacity: 0.95,
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            B
          </span>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Buffer 큐 (선택)
          </h2>
        </div>
        {!bufferTokenConfigured && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            <code
              className="rounded px-1 py-0.5"
              style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
            >
              .env
            </code>
            에{" "}
            <code
              className="rounded px-1 py-0.5"
              style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
            >
              BUFFER_API_ACCESS_TOKEN
            </code>
            을 넣으면 채널 목록이 로드됩니다.
          </p>
        )}
        {bufferTokenConfigured && bufferListError && (
          <p className="text-xs" style={{ color: "#D97706" }} role="alert">
            채널 목록 오류: {bufferListError}
          </p>
        )}
        {bufferTokenConfigured && !bufferListError && postableChannels.length === 0 && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            연결된 채널 없음. Buffer에서 인스타·Threads를 연결하세요.
          </p>
        )}
        {postableChannels.length > 0 && (
          <form action={submitBufferQueue} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                채널
              </span>
              <select
                name="channelId"
                required
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text)",
                  maxWidth: "28rem",
                }}
              >
                {postableChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.descriptor} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                큐 본문 (기본: 인스타 캡션)
              </span>
              <textarea
                name="text"
                value={queueText}
                onChange={(e) => setQueueText(e.target.value)}
                rows={5}
                className="rounded-lg px-3 py-2 font-mono text-xs"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text)",
                }}
              />
            </label>
            <button
              type="submit"
              className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Buffer에 addToQueue
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
