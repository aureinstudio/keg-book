"use client";

import { buildNaverExportHtml } from "@/lib/naver/buildNaverExportHtml";
import { useMemo, useState } from "react";
import { logNaverExport } from "./actions";

const DEFAULT_TITLE = "교재 소개 제목 (예시)";
const DEFAULT_BODY = `<p>여기에 본문 HTML을 붙여 넣거나 직접 수정하세요.</p>
<p>이미지는 네이버 글쓰기 화면에서 별도로 업로드하는 것을 권장합니다.</p>`;

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

function Dot({ ok }: { ok: boolean | null }) {
  const color = ok === null ? "var(--color-text-faint)" : ok ? "#404040" : "#737373";
  return <span className="inline-block h-2 w-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />;
}

export function NaverExportPanel({
  initialTitle,
  initialDescription,
  initialBody,
  initialTags,
  generationId,
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialBody?: string;
  initialTags?: string[];
  generationId?: string;
} = {}) {
  const [title, setTitle] = useState(initialTitle ?? DEFAULT_TITLE);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [tagsRaw, setTagsRaw] = useState((initialTags ?? []).join(", "));
  const [bodyHtml, setBodyHtml] = useState(initialBody ?? DEFAULT_BODY);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const [seoOpen, setSeoOpen] = useState(true);

  const tagList = tagsRaw.split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean);

  const exportHtml = useMemo(
    () => buildNaverExportHtml(title, bodyHtml, { description, tags: tagList }),
    [title, bodyHtml, description, tagList],
  );

  const titleLen = title.length;
  const descLen = description.length;

  // 본문 분석 — 1위 블로그(2026.3 천안웹디자인학원 후기) 역엔지니어링 기반
  const bodyText = bodyHtml.replace(/<[^>]+>/g, "");
  const bodyLen = bodyText.replace(/\s+/g, "").length;
  const h2Count = (bodyHtml.match(/<h2/gi) ?? []).length;
  const h3Count = (bodyHtml.match(/<h3/gi) ?? []).length;
  const imgCount = (bodyHtml.match(/<img/gi) ?? []).length;

  // ── 1위 패턴 신호 (실측 기반)
  const mainKeyword = tagList[0] ?? "";
  const first200 = bodyText.slice(0, 200);

  // 체크박스 ✔ 사용 횟수 (1위는 4곳 사용 — 모바일 스캔 친화)
  const checkmarkCount = (bodyHtml.match(/✔/g) ?? []).length;

  // 1인칭 경험 마커 (1위는 12+회)
  const EXPERIENCE_RE = /저도|제가|저는|느꼈|느낌|돌이켜|직접|써본|솔직히|개인적으로/g;
  const experienceCount = (bodyText.match(EXPERIENCE_RE) ?? []).length;

  // 한국어 AI 어휘 (1위는 0회 — 가장 강력한 D.I.A.+ 원문성 신호)
  const AI_KO_RE = /또한|따라서|결론적으로|궁극적으로|핵심적으로|뿐만\s*아니라|그러므로|즉,|한편,/g;
  const aiKoCount = (bodyText.match(AI_KO_RE) ?? []).length;

  // 상업어 (광고성 패널티)
  const COMMERCIAL_RE = /할인|이벤트|무료\s*증정|특가|최저가|구매|쿠폰|적립/g;
  const commercialCount = (bodyText.match(COMMERCIAL_RE) ?? []).length;

  const checks = [
    {
      label: `제목 (${titleLen}자)`,
      ok: titleLen >= 25 && titleLen <= 38,
      hint: "1위 사례 35자 — 25–38자 sweet spot (의문문/후기형)",
    },
    {
      label: `설명 (${descLen}자)`,
      ok: descLen >= 50 && descLen <= 100,
      hint: "검색결과 스니펫 — 50–100자, 본문 첫 문장과 동기화 권장",
    },
    {
      label: `본문 길이 (${bodyLen.toLocaleString()}자)`,
      ok: bodyLen >= 2000 && bodyLen <= 3500,
      hint: "1위 사례 2,500자 — 2,000–3,500 sweet spot. 3,500 초과는 과잉",
    },
    {
      label: `소제목 H2/H3 (${h2Count + h3Count}개)`,
      ok: h2Count + h3Count >= 5,
      hint: "1위는 6개 시간순 narrative — [배경→현장→감정→디테일→결과→성찰]",
    },
    {
      label: `이미지 (${imgCount}장)`,
      ok: imgCount >= 8,
      hint: "1위는 11장 — AI 생성 이미지도 페널티 없음 (실측 확인)",
    },
    {
      label: `태그 (${tagList.length}개)`,
      ok: tagList.length >= 5 && tagList.length <= 10,
      hint: "네이버 권장 5–10개 — 메인 키워드 + 연관 키워드 조합",
    },
    {
      label: "제목에 주요 태그 키워드 포함",
      ok: tagList.length > 0 && tagList.some((t) => title.includes(t)),
      hint: "대표 키워드가 제목 앞부분에 있으면 C-Rank·D.I.A. 모두 유리",
    },
    {
      label: "첫 200자에 주 키워드 포함",
      ok: Boolean(mainKeyword) && first200.includes(mainKeyword),
      hint: "1위 패턴: 첫 문장 = 검색어 의문문 (\"❓ ... 가능할까요?\")",
    },
    {
      label: `체크박스 ✔ 사용 (${checkmarkCount}곳)`,
      ok: checkmarkCount >= 3,
      hint: "1위는 본문 4곳에 ✔ 리스트 — 모바일 스캔 친화, 체류시간↑",
    },
    {
      label: `1인칭 경험 마커 (${experienceCount}회)`,
      ok: experienceCount >= 8,
      hint: "저도/제가/느꼈/직접 등 — D.I.A.+ 원문성 가점 (1위 12+회)",
    },
    {
      label: `한국어 AI 어휘 회피 (${aiKoCount}회)`,
      ok: aiKoCount === 0,
      hint: "또한·따라서·결론적으로·궁극적으로 → 1위는 0회. 자연 구어로",
    },
    {
      label: `상업어 회피 (${commercialCount}회)`,
      ok: commercialCount === 0,
      hint: "할인/이벤트/무료증정/특가 → 광고성 패널티. CTA는 \"확인해보세요\" 우회",
    },
    {
      label: "첫 문장 ❓ 의문형 후킹",
      ok: /^[\s<>p\/]*[❓?]|^[\s<>p\/]*[^<>]{5,40}[?]/.test(bodyText.trim()),
      hint: "1위 첫 문장: \"❓ 비전공자인데 ... 가능할까요?\" — 모바일 첫 화면 클릭률↑",
    },
    {
      label: "리스트 구조 (ul/ol/✔)",
      ok: /<ul|<ol/i.test(bodyHtml) || checkmarkCount >= 3,
      hint: "스캔 가능 구조 1개 이상 — 단락 사이 시각적 break",
    },
    {
      label: "외부 링크 절제",
      ok: (bodyHtml.match(/<a\s+[^>]*href=["']https?/gi) ?? []).length <= Math.max(1, Math.floor(bodyLen / 500)),
      hint: "500자당 1개 이하 — 외부 링크 과다는 광고성 판정",
    },
  ];

  // ── 종합 점수 (0–100)
  const passCount = checks.filter((c) => c.ok).length;
  const seoScore = Math.round((passCount / checks.length) * 100);
  const scoreTier =
    seoScore >= 85 ? { label: "1위 후보", color: "#15803d" }
    : seoScore >= 65 ? { label: "상위권", color: "#525252" }
    : seoScore >= 40 ? { label: "보완 필요", color: "#a16207" }
    : { label: "재작성 권장", color: "#991b1b" };

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportHtml);
      setCopyState("ok");
      setTimeout(() => setCopyState("idle"), 2000);
      // 활동 로그에 발행(복사) 흔적 — 실패해도 UX 영향 없음
      void logNaverExport({
        title,
        generationId: generationId ?? null,
        tagCount: tagList.length,
        bodyLen,
      });
    } catch {
      setCopyState("err");
      setTimeout(() => setCopyState("idle"), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* SEO 체크 패널 토글 */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
          네이버 SEO 입력
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
          SEO 점검 {seoOpen ? "▲" : "▼"}
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
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
              SEO 점검 · 1위 패턴 기준
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
              style={{
                backgroundColor: `${scoreTier.color}15`,
                color: scoreTier.color,
                border: `1px solid ${scoreTier.color}40`,
              }}
              aria-label={`SEO 점수 ${seoScore}점, ${scoreTier.label}`}
            >
              {seoScore}점 · {scoreTier.label}
            </span>
          </div>
          <ul className="space-y-1.5">
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

      {/* 제목 */}
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            글 제목
          </span>
          <span className="text-[11px] tabular-nums" style={{ color: rangeColor(titleLen, 15, 30) }}>
            {titleLen} / 30
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="15–30자 권장 — 검색 키워드 포함"
          className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={inputStyle}
        />
      </label>

      {/* 설명 */}
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            글 설명 <span style={{ color: "var(--color-text-faint)" }}>(리드 문장)</span>
          </span>
          <span className="text-[11px] tabular-nums" style={{ color: rangeColor(descLen, 50, 100) }}>
            {descLen} / 100
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="50–100자 — 검색 결과에서 본문 요약으로 보일 수 있는 핵심 문장"
          className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={inputStyle}
        />
      </label>

      {/* 태그 */}
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            태그 <span style={{ color: "var(--color-text-faint)" }}>(쉼표 구분, 5–20개)</span>
          </span>
          <span className="text-[11px]" style={{ color: rangeColor(tagList.length, 5, 10) }}>
              {tagList.length}개
            </span>
        </div>
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="예: 영어교재, 중학수학, 교재추천, 코리아교육그룹, 학습법 (5–10개 권장)"
          className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={inputStyle}
        />
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tagList.map((t) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{ backgroundColor: "rgba(82,82,82,0.1)", color: "#525252" }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </label>

      {/* 본문 */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          본문 HTML (Blogger 초안과 동일하게 써도 됩니다)
        </span>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={8}
          className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={inputStyle}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void copyExport()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#525252" }}
          aria-label="생성된 HTML을 클립보드에 복사"
        >
          HTML 전체 복사
        </button>
        {copyState === "ok" && (
          <span className="text-sm" style={{ color: "#059669" }} role="status">
            복사되었습니다. 네이버 글쓰기에 붙여넣으세요.
          </span>
        )}
        {copyState === "err" && (
          <span className="text-sm" style={{ color: "#171717" }} role="alert">
            복사에 실패했습니다. 아래 상자에서 직접 선택해 복사해 보세요.
          </span>
        )}
      </div>

      {/* 생성 결과 (코드 미리보기) */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          생성 결과 (코드)
        </h3>
        <textarea
          readOnly
          value={exportHtml}
          rows={12}
          className="w-full rounded-lg px-3 py-2 font-mono text-xs"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-faint)",
          }}
          aria-label="보낸 HTML 전체"
        />
      </div>

      {/* 렌더 미리보기 */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        aria-live="polite"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          렌더 미리보기
        </p>
        <div
          className="rounded-lg p-4 [&_a]:text-sky-600 [&_a]:underline [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_li]:my-0.5 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
          dangerouslySetInnerHTML={{
            __html: exportHtml.replace(/^<!--[\s\S]*?-->\n?/, ""),
          }}
        />
      </div>
    </div>
  );
}
