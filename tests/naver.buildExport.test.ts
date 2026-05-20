import { describe, expect, it } from "vitest";

import { buildNaverExportHtml } from "@/lib/naver/buildNaverExportHtml";

describe("buildNaverExportHtml", () => {
  it("제목을 H1으로 이스케이프해서 출력", () => {
    const html = buildNaverExportHtml("<script>x</script>", "<p>본문</p>");
    expect(html).toContain("<h1>&lt;script&gt;x&lt;/script&gt;</h1>");
  });

  it("description 이 있으면 lead 단락 + 메타 주석에 모두 포함", () => {
    const html = buildNaverExportHtml("t", "<p>b</p>", {
      description: "리드 문장입니다.",
    });
    expect(html).toMatch(/<!-- meta-description: 리드 문장입니다\. -->/);
    expect(html).toMatch(/class="keg-book-lead"[^>]*>리드 문장입니다\./);
  });

  it("tags 가 있으면 주석 + span 목록으로 렌더", () => {
    const html = buildNaverExportHtml("t", "<p>b</p>", {
      tags: ["영어교재", "중학수학"],
    });
    expect(html).toContain("<!-- naver-tags: 영어교재, 중학수학 -->");
    expect(html).toContain('<span class="keg-book-tag">영어교재</span>');
  });

  it("빈 제목/본문은 기본 placeholder 로 대체", () => {
    const html = buildNaverExportHtml("   ", "   ");
    expect(html).toContain("<h1>제목 없음</h1>");
    expect(html).toContain("<p></p>");
  });

  it("본문 HTML은 의도적으로 이스케이프하지 않는다(이미 HTML 가정)", () => {
    const html = buildNaverExportHtml("t", "<p><strong>강조</strong></p>");
    expect(html).toContain("<p><strong>강조</strong></p>");
  });
});
