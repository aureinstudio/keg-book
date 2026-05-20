import { describe, expect, it } from "vitest";

import { sanitizeFilenameBase } from "@/lib/output/writeTextFile";

describe("sanitizeFilenameBase", () => {
  it("공백·특수문자·경로 구분자를 underscore 로 변환", () => {
    expect(sanitizeFilenameBase("a/b\\c d.txt?")).toBe("a_b_c_d_txt_");
  });

  it("연속 underscore 는 하나로 압축", () => {
    expect(sanitizeFilenameBase("a   b")).toBe("a_b");
  });

  it("path traversal(..) 패턴은 무력화 (점·슬래시 제거)", () => {
    const out = sanitizeFilenameBase("../../etc/passwd");
    expect(out).not.toContain("..");
    expect(out).not.toContain("/");
    expect(out).not.toContain("\\");
  });

  it("한글·영숫자·하이픈은 보존", () => {
    expect(sanitizeFilenameBase("교재-소개_blog-2026")).toBe("교재-소개_blog-2026");
  });

  it("80자 초과는 잘림", () => {
    const long = "a".repeat(120);
    expect(sanitizeFilenameBase(long).length).toBeLessThanOrEqual(80);
  });

  it("빈 문자열·공백만 있으면 'draft' 폴백", () => {
    expect(sanitizeFilenameBase("")).toBe("draft");
    expect(sanitizeFilenameBase("   ")).toBe("draft");
  });
});
