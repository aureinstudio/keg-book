"use client";

import { submitBloggerDraft } from "@/app/blogger/actions";
import { useRef, useState } from "react";

type Blog = { id: string; name: string };

const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: "14px",
  borderRadius: "8px",
  border: "1px solid var(--color-border-strong)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text)",
  outline: "none",
};

/** 글자수 범위에 따라 색 반환 */
function rangeColor(len: number, min: number, max: number) {
  if (len === 0) return "var(--color-text-faint)";
  if (len < min) return "#737373";
  if (len <= max) return "#404040";
  return "#262626";
}

/** 신호등 점수 배지 */
function Dot({ ok }: { ok: boolean | null }) {
  const color = ok === null ? "var(--color-text-faint)" : ok ? "#404040" : "#737373";
  return <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

export function BloggerDraftForm({
  blogs,
  initialTitle,
  initialDescription,
  initialLabels,
  initialContent,
  generationId,
}: {
  blogs: Blog[];
  initialTitle?: string;
  initialDescription?: string;
  initialLabels?: string[];
  initialContent?: string;
  generationId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(initialTitle ?? "keg-book 테스트 초안");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [labels, setLabels] = useState((initialLabels ?? []).join(", "));
  const [seoOpen, setSeoOpen] = useState(true);

  const titleLen = title.length;
  const descLen = description.length;
  const labelList = labels.split(/[,，\s]+/).map((l) => l.trim()).filter(Boolean);

  // SEO 체크 항목
  const checks = [
    {
      label: `제목 길이 (${titleLen}자)`,
      ok: titleLen >= 30 && titleLen <= 60,
      hint: "Google 검색 스니펫 권장 30–60자",
    },
    {
      label: `메타 설명 (${descLen}자)`,
      ok: descLen >= 120 && descLen <= 155,
      hint: "120–155자 — 검색 결과 설명 최적 범위",
    },
    {
      label: `레이블/태그 (${labelList.length}개)`,
      ok: labelList.length >= 3 && labelList.length <= 10,
      hint: "3–10개 — 관련 키워드 분류",
    },
    {
      label: "제목에 핵심 키워드 포함",
      ok: labelList.length > 0 && labelList.some((l) => title.includes(l)),
      hint: "대표 태그 단어가 제목에 있으면 SEO에 유리합니다",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
            초안 작성
          </h2>
          <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-text-faint)" }}>
            posts.insert, isDraft=true — 샌드박스·비공개 블로그 권장
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeoOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: seoOpen ? "rgba(10,10,10,0.1)" : "var(--color-surface-2)",
            color: seoOpen ? "var(--color-accent)" : "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          SEO {seoOpen ? "▲" : "▼"}
        </button>
      </div>

      {/* SEO 체크 패널 */}
      {seoOpen && (
        <div
          className="mb-5 rounded-lg p-3"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
            SEO 점검
          </p>
          <ul className="space-y-2">
            {checks.map((c, i) => (
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

      <form ref={formRef} action={submitBloggerDraft} className="flex flex-col gap-4">
        {generationId && (
          <input type="hidden" name="generationId" value={generationId} />
        )}
        {/* 블로그 선택 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>블로그</span>
          <select name="blogId" required style={fieldStyle} defaultValue="">
            <option value="" disabled>선택…</option>
            {blogs.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        {/* 제목 */}
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>제목 (H1 · SEO 핵심)</span>
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: rangeColor(titleLen, 30, 60) }}
            >
              {titleLen} / 60
            </span>
          </div>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="검색 의도가 담긴 제목 (30–60자 권장)"
            style={fieldStyle}
          />
        </label>

        {/* 메타 설명 */}
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              메타 설명{" "}
              <span style={{ color: "var(--color-text-faint)" }}>(검색 결과 스니펫)</span>
            </span>
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: rangeColor(descLen, 120, 155) }}
            >
              {descLen} / 155
            </span>
          </div>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="120–155자 — 검색 결과에 표시될 설명. 핵심 키워드와 행동 유도 문구 포함 권장."
            rows={2}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </label>

        {/* 레이블 (태그) */}
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              레이블 / 태그{" "}
              <span style={{ color: "var(--color-text-faint)" }}>(쉼표 구분, 3–10개 권장)</span>
            </span>
            <span
              className="text-[11px] font-medium"
              style={{ color: rangeColor(labelList.length, 3, 10) }}
            >
              {labelList.length}개
            </span>
          </div>
          <input
            name="labels"
            type="text"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="예: 영어교재, 중학수학, 코리아교육그룹, 교재추천"
            style={fieldStyle}
          />
          {labelList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {labelList.map((l) => (
                <span
                  key={l}
                  className="rounded-full px-2 py-0.5 text-[11px]"
                  style={{
                    backgroundColor: "rgba(10,10,10,0.1)",
                    color: "var(--color-accent)",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </label>

        {/* 본문 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>본문 (HTML)</span>
          <textarea
            name="content"
            rows={initialContent ? 12 : 6}
            defaultValue={initialContent ?? "<p>keg-book에서 생성한 초안입니다.</p>"}
            style={{ ...fieldStyle, fontFamily: "monospace", resize: "vertical" }}
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#262626",
              borderRadius: "20px",
              padding: "9px 22px",
            }}
          >
            Blogger에 초안 저장
          </button>
          <p className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
            isDraft=true — 바로 공개되지 않습니다
          </p>
        </div>
      </form>
    </div>
  );
}
