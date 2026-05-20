"use client";

import { saveOutputDraftAction } from "@/app/actions/saveOutputDraft";
import { submitBufferQueue } from "@/app/social/actions";
import type { BufferChannelLite } from "@/lib/buffer/listBufferChannels";
import {
  buildSocialPack,
  detectService,
  SOCIAL_LIMITS,
  type SocialService,
} from "@/lib/social/buildSocialPack";
import { useEffect, useMemo, useState, useTransition } from "react";

function rangeColor(len: number, min: number, max: number) {
  if (len === 0) return "var(--color-text-faint)";
  if (len < min) return "#737373";
  if (len <= max) return "#404040";
  return "#262626";
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0 mt-0.5"
      style={{ backgroundColor: ok ? "#404040" : "#737373" }}
    />
  );
}

type Props = {
  bufferChannels: BufferChannelLite[];
  bufferListError: string | null;
  bufferTokenConfigured: boolean;
  initialTitle?: string;
  initialBody?: string;
  initialHashtags?: string[];
  /** /generate에서 넘어온 경우 */
  generationId?: string;
  /** 카드뉴스 캐러셀 자동 첨부 가능 여부 */
  carouselAvailable?: boolean;
  /** 첨부 가능한 슬라이드 수 */
  carouselCount?: number;
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
  initialTitle,
  initialBody,
  initialHashtags,
  generationId,
  carouselAvailable = false,
  carouselCount = 0,
}: Props) {
  const [title, setTitle] = useState(initialTitle ?? "봄 학기 신간 교재 안내");
  const [bodyHtml, setBodyHtml] = useState(
    initialBody ?? "<p>핵심 메시지를 여기 HTML로 적습니다.</p><p>두 번째 문단.</p>",
  );
  const [extraHashtags, setExtraHashtags] = useState(
    (initialHashtags ?? []).map((t) => t.replace(/^#/, "")).join(" "),
  );
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

  // queueText 자동 동기화는 채널 종류에 따라 아래의 selectedService useEffect 가 처리.

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

  function savePack(kind: "instagram" | "threads" | "linkedin") {
    startTransition(async () => {
      setSaveMsg(null);
      const sub =
        kind === "instagram"
          ? "social-instagram"
          : kind === "threads"
          ? "social-threads"
          : "social-linkedin";
      let content: string;
      if (kind === "instagram") content = pack.instagramCaption;
      else if (kind === "threads")
        content = pack.threadsPosts
          .map((p, i) => `--- ${i + 1} ---\n${p}`)
          .join("\n\n");
      else content = pack.linkedinPost;
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

  // 선택된 채널 id → descriptor 기반 인스타 여부 판정
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    postableChannels[0]?.id ?? "",
  );
  const selectedChannel = postableChannels.find(
    (c) => c.id === selectedChannelId,
  );
  // 채널 종류 감지 (instagram / threads / linkedin / twitter / facebook / unknown)
  const selectedService: SocialService | "unknown" = selectedChannel
    ? detectService(selectedChannel.descriptor ?? "", selectedChannel.name ?? "")
    : "unknown";
  const isInstagramSelected = selectedService === "instagram";

  // 선택된 채널의 글자수/해시태그 한도
  const limits =
    selectedService !== "unknown" ? SOCIAL_LIMITS[selectedService] : null;
  const queueLen = queueText.length;
  const queueTagCount = (queueText.match(/#\w/g) ?? []).length;
  const queueOverMax = limits ? queueLen > limits.max : false;
  const queueOverRecommended = limits ? queueLen > limits.recommended : false;

  // 캐러셀 첨부 가능 + 인스타 선택 시 기본 ON
  const canAttachCarousel = carouselAvailable && isInstagramSelected;
  const [attachCarousel, setAttachCarousel] = useState<boolean>(true);

  // 채널 선택 시 본문을 해당 채널 형식으로 자동 채움 (사용자 수정 전까지만)
  const [queueTouched, setQueueTouched] = useState(false);
  useEffect(() => {
    if (queueTouched) return;
    if (selectedService === "linkedin") setQueueText(pack.linkedinPost);
    else if (selectedService === "threads") setQueueText(pack.threadsPosts[0] ?? captionWithTags);
    else setQueueText(captionWithTags);
  }, [selectedService, pack.linkedinPost, pack.threadsPosts, captionWithTags, queueTouched]);

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
            backgroundColor: seoOpen ? "rgba(64,64,64,0.1)" : "var(--color-surface-2)",
            color: seoOpen ? "#404040" : "var(--color-text-muted)",
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
        <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#F5F5F5", color: "#171717" }} role="status">
          {copyHint}
        </p>
      )}
      {saveMsg && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: saveMsg.startsWith("저장:") ? "#EFF6FF" : "#FAFAFA",
            color: saveMsg.startsWith("저장:") ? "#1E40AF" : "#404040",
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
                  style={{ backgroundColor: "rgba(64,64,64,0.1)", color: "#404040" }}
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
            style={{ backgroundColor: "#404040" }}
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
            style={{ backgroundColor: "#404040" }}
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

      {/* LinkedIn */}
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: "#0A66C2" }}
            aria-hidden="true"
          >
            in
          </span>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            LinkedIn 포스트
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            첫 줄 훅 + 단락 + 해시태그 3–5
          </span>
          <span
            className="ml-auto text-[11px] tabular-nums font-medium"
            style={{ color: rangeColor(pack.linkedinPost.length, 800, SOCIAL_LIMITS.linkedin.recommended) }}
          >
            {pack.linkedinPost.length} / {SOCIAL_LIMITS.linkedin.recommended}
          </span>
        </div>
        <textarea
          readOnly
          value={pack.linkedinPost}
          rows={10}
          aria-label="생성된 LinkedIn 포스트"
          className="w-full rounded-lg px-3 py-2 font-mono text-xs"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-muted)",
          }}
        />
        <p className="mt-2 text-[11px]" style={{ color: "var(--color-text-faint)" }}>
          모바일 “더보기” 컷오프는 ~210자, 데스크톱 ~140자입니다. 첫 줄을 훅으로 작성하세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText("LinkedIn 포스트", pack.linkedinPost)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0A66C2" }}
          >
            LinkedIn 복사
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => savePack("linkedin")}
            className="rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              backgroundColor: "transparent",
            }}
          >
            _output/social-linkedin 저장
          </button>
        </div>
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
          <p className="text-xs" style={{ color: "#171717" }} role="alert">
            채널 목록 오류: {bufferListError}
          </p>
        )}
        {bufferTokenConfigured && !bufferListError && postableChannels.length === 0 && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            연결된 채널 없음. Buffer에서 인스타·Threads·LinkedIn 등을 연결하세요.
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
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
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

            {/* 캐러셀 자동 첨부 토글 */}
            {generationId && carouselAvailable && (
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundColor: canAttachCarousel
                    ? "rgba(64,64,64,0.06)"
                    : "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={canAttachCarousel && attachCarousel}
                    disabled={!canAttachCarousel}
                    onChange={(e) => setAttachCarousel(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[12.5px] font-medium"
                      style={{
                        color: canAttachCarousel
                          ? "var(--color-text)"
                          : "var(--color-text-faint)",
                      }}
                    >
                      카드뉴스 {carouselCount}장을 인스타그램 캐러셀로 자동 첨부
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--color-text-faint)" }}
                    >
                      {canAttachCarousel
                        ? "Buffer에서 자동으로 캐러셀(여러 장) 게시물로 발행됩니다. 이미지는 Supabase Storage 공개 URL을 사용합니다."
                        : isInstagramSelected
                        ? "카드뉴스 슬라이드를 사용할 수 없습니다."
                        : "캐러셀 첨부는 인스타그램 채널을 선택한 경우에만 적용됩니다."}
                    </span>
                  </div>
                </label>
                <input
                  type="hidden"
                  name="attachCarousel"
                  value={canAttachCarousel && attachCarousel ? "1" : "0"}
                />
                <input
                  type="hidden"
                  name="generationId"
                  value={generationId}
                />
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                큐 본문 (기본: 인스타 캡션)
              </span>
              <textarea
                name="text"
                value={queueText}
                onChange={(e) => {
                  setQueueText(e.target.value);
                  setQueueTouched(true);
                }}
                rows={selectedService === "linkedin" ? 12 : 5}
                className="rounded-lg px-3 py-2 font-mono text-xs"
                style={{
                  border: `1px solid ${queueOverMax ? "#991b1b" : "var(--color-border)"}`,
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text)",
                }}
              />
              {limits && (
                <div
                  className="flex items-center justify-between text-[11px] tabular-nums"
                  style={{
                    color: queueOverMax
                      ? "#991b1b"
                      : queueOverRecommended
                      ? "#a16207"
                      : "var(--color-text-faint)",
                  }}
                >
                  <span>
                    {selectedService} · 권장 {limits.recommended.toLocaleString()}자 / 최대{" "}
                    {limits.max.toLocaleString()}자
                  </span>
                  <span>
                    {queueLen.toLocaleString()} / {limits.max.toLocaleString()} · 해시태그{" "}
                    {queueTagCount}개 (권장 {limits.hashtags.min}–{limits.hashtags.max})
                  </span>
                </div>
              )}
            </label>
            <button
              type="submit"
              className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {canAttachCarousel && attachCarousel
                ? `Buffer에 addToQueue (카드뉴스 ${carouselCount}장 포함)`
                : "Buffer에 addToQueue"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
