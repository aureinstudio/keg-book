"use client";

import { saveOutputDraftAction } from "@/app/actions/saveOutputDraft";
import { buildNewsletterHtml } from "@/lib/newsletter/buildNewsletterHtml";
import { useMemo, useState, useTransition } from "react";

const DEFAULT_BODY = `<p>안녕하세요, 구독자 여러분.</p>
<p>이번 호에서는 <strong>신간 교재</strong>를 소개합니다.</p>
<ul>
  <li>핵심 한 줄 요약</li>
  <li>구매·문의 링크</li>
</ul>`;

const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text)",
};

function rangeColor(len: number, min: number, max: number) {
  if (len === 0) return "var(--color-text-faint)";
  if (len < min) return "#737373";
  if (len <= max) return "#404040";
  return "#262626";
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0 mt-1"
      style={{ backgroundColor: ok ? "#404040" : "#737373" }}
    />
  );
}

export function NewsletterWorkbench({
  initialSubject,
  initialPreheader,
  initialBody,
}: {
  initialSubject?: string;
  initialPreheader?: string;
  initialBody?: string;
} = {}) {
  const [subject, setSubject] = useState(initialSubject ?? "[KEG] 5월 뉴스레터");
  const [preheader, setPreheader] = useState(initialPreheader ?? "신간 교재와 이벤트를 한눈에");
  const [bodyHtml, setBodyHtml] = useState(initialBody ?? DEFAULT_BODY);
  const [seoOpen, setSeoOpen] = useState(true);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fullHtml = useMemo(
    () => buildNewsletterHtml({ subject, preheader, bodyHtml }),
    [subject, preheader, bodyHtml],
  );

  async function copyFull() {
    try {
      await navigator.clipboard.writeText(fullHtml);
      setCopyHint("전체 HTML 복사됨 — 메일리 편집기에 붙여넣기");
      setTimeout(() => setCopyHint(null), 2500);
    } catch {
      setCopyHint("복사 실패 — 아래 상자에서 직접 선택하세요");
      setTimeout(() => setCopyHint(null), 3000);
    }
  }

  function saveHtml() {
    startTransition(async () => {
      setSaveMsg(null);
      const r = await saveOutputDraftAction({
        subfolder: "newsletter",
        base: subject.slice(0, 50),
        ext: ".html",
        content: fullHtml,
      });
      setSaveMsg(r.ok ? `저장: ${r.relativePath}` : r.error);
    });
  }

  const subjectLen = subject.length;
  const preheaderLen = preheader.length;

  const emailChecks = [
    {
      label: `제목 길이 (${subjectLen}자)`,
      ok: subjectLen >= 20 && subjectLen <= 50,
      hint: "모바일 인박스 표시 최적 20–50자",
    },
    {
      label: `프리헤더 (${preheaderLen}자)`,
      ok: preheaderLen >= 40 && preheaderLen <= 90,
      hint: "Gmail 미리보기 텍스트 40–90자",
    },
    {
      label: "숫자·이모지 포함 (오픈율 ↑)",
      ok: /\d|[\u{1F300}-\u{1FAD6}]/u.test(subject),
      hint: "제목에 숫자나 이모지가 있으면 클릭률 향상",
    },
    {
      label: "스팸성 단어 없음",
      ok: !/(무료|100%|클릭|지금 바로|즉시)/u.test(subject),
      hint: "스팸 필터에 걸리기 쉬운 표현 회피",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 이메일 SEO 체크 패널 */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
          이메일 최적화 점검
        </p>
        <button
          type="button"
          onClick={() => setSeoOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: seoOpen ? "rgba(82,82,82,0.1)" : "var(--color-surface-2)",
            color: seoOpen ? "#525252" : "var(--color-text-muted)",
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
            {emailChecks.map((c, i) => (
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
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "#F5F5F5", color: "#171717" }}
          role="status"
        >
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

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              메일 제목
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: rangeColor(subjectLen, 20, 50) }}>
              {subjectLen} / 50
            </span>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="20–50자 권장 — 숫자·키워드 포함"
            className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              프리헤더 <span style={{ color: "var(--color-text-faint)" }}>(인박스 미리보기)</span>
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: rangeColor(preheaderLen, 40, 90) }}>
              {preheaderLen} / 90
            </span>
          </div>
          <input
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            placeholder="40–90자 — 제목을 보완하는 한 줄 요약"
            className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={inputStyle}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          본문 HTML
        </span>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={10}
          className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={inputStyle}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyFull()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#7C3AED" }}
        >
          전체 HTML 복사
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={saveHtml}
          className="rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            backgroundColor: "transparent",
          }}
        >
          _output/newsletter 에 .html 저장
        </button>
      </div>

      {/* 생성 HTML 미리보기 */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          생성 HTML (미리보기)
        </h3>
        <textarea
          readOnly
          value={fullHtml}
          rows={10}
          aria-label="생성된 뉴스레터 HTML 코드"
          className="w-full rounded-lg px-3 py-2 font-mono text-[11px]"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-faint)",
          }}
        />
      </div>

      {/* 본문 미리보기 */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          본문 미리보기
        </p>
        <div
          className="rounded-lg p-4 [&_li]:my-1 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
          dangerouslySetInnerHTML={{ __html: bodyHtml.trim() || "<p></p>" }}
        />
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
        메일리 API 자동 발송을 붙이려면{" "}
        <code
          className="rounded px-1 py-0.5"
          style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
        >
          MAILY_API_KEY
        </code>
        를 설정한 뒤 서버 라우트를 확장합니다. 발송 책임·수신동의는 메일리 정책을 따릅니다.
      </p>
    </div>
  );
}
