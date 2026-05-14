import { escapeHtml } from "@/lib/naver/escapeHtml";

/**
 * 네이버 블로그 스마트에디터 등에 **붙여넣기**하기 위한 단일 HTML 조각.
 * 본문(`bodyHtml`)은 의도적으로 이스케이프하지 않음(이미 HTML이라 가정).
 *
 * SEO 최적화:
 * - `description` → 본문 상단 주석 + `<meta name="description">` 힌트
 * - `tags` → 쉼표 구분 태그 목록 주석 (네이버 태그 입력 시 참고용)
 */
export function buildNaverExportHtml(
  title: string,
  bodyHtml: string,
  options?: { description?: string; tags?: string[] },
): string {
  const safeTitle = escapeHtml(title.trim() || "제목 없음");
  const body = bodyHtml.trim() || "<p></p>";
  const desc = options?.description?.trim() ?? "";
  const tags = options?.tags?.filter(Boolean) ?? [];

  const lines: string[] = [
    "<!-- keg-book: 네이버 블로그용 내보내기 (수동 붙여넣기) -->",
  ];

  if (desc) {
    lines.push(`<!-- meta-description: ${escapeHtml(desc)} -->`);
  }
  if (tags.length > 0) {
    lines.push(`<!-- naver-tags: ${tags.map(escapeHtml).join(", ")} -->`);
  }

  lines.push(
    '<article class="keg-book-naver-export" data-source="keg-book">',
    `  <h1>${safeTitle}</h1>`,
  );

  if (desc) {
    lines.push(
      `  <p class="keg-book-lead" style="color:#555;font-size:0.95em;margin-bottom:1.2em;">${escapeHtml(desc)}</p>`,
    );
  }

  lines.push(
    '  <div class="keg-book-body">',
    body,
    "  </div>",
  );

  if (tags.length > 0) {
    const tagSpans = tags
      .map((t) => `<span class="keg-book-tag">${escapeHtml(t)}</span>`)
      .join(" ");
    lines.push(
      '  <div class="keg-book-tags" style="margin-top:1.5em;font-size:0.85em;color:#888;">',
      `    태그: ${tagSpans}`,
      "  </div>",
    );
  }

  lines.push("</article>");

  return lines.join("\n");
}
