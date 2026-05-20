import { describe, expect, it } from "vitest";

import {
  buildLinkedInPost,
  buildSocialPack,
  detectService,
  SOCIAL_LIMITS,
} from "@/lib/social/buildSocialPack";

describe("buildLinkedInPost", () => {
  it("제목을 첫 줄 훅으로 배치", () => {
    const out = buildLinkedInPost("훅 문장입니다", "본문\n\n두번째 단락");
    expect(out.startsWith("훅 문장입니다")).toBe(true);
  });

  it("빈 줄로 단락 구분 유지", () => {
    const out = buildLinkedInPost("t", "A\n\nB\n\nC");
    expect(out).toContain("A\n\nB\n\nC");
  });

  it("해시태그를 # 접두로 변환 + 5개 cap", () => {
    const out = buildLinkedInPost("t", "b", ["one", "two", "three", "four", "five", "six"]);
    expect(out).toMatch(/#one #two #three #four #five/);
    expect(out).not.toContain("#six");
  });

  it("LinkedIn 권장 길이(1,500자) 이내로 잘림", () => {
    const long = "가".repeat(2000);
    const out = buildLinkedInPost("훅", long);
    expect(out.length).toBeLessThanOrEqual(SOCIAL_LIMITS.linkedin.recommended);
  });

  it("빈 제목이면 기본 훅 사용", () => {
    const out = buildLinkedInPost("", "본문");
    expect(out.startsWith("새 글 소개")).toBe(true);
  });
});

describe("buildSocialPack — LinkedIn 포함", () => {
  it("instagramCaption · threadsPosts · linkedinPost 모두 포함", () => {
    const pack = buildSocialPack("제목", "<p>본문 한 문단</p><p>두 번째 단락</p>");
    expect(pack.instagramCaption).toContain("제목");
    expect(pack.threadsPosts.length).toBeGreaterThan(0);
    expect(pack.linkedinPost).toContain("제목");
    expect(pack.plainBody).toContain("본문");
  });
});

describe("detectService", () => {
  it("instagram descriptor", () => {
    expect(detectService("@keg_books", "Instagram")).toBe("instagram");
    expect(detectService("Instagram", "KEG")).toBe("instagram");
  });

  it("threads descriptor", () => {
    expect(detectService("@keg.threads", "Threads")).toBe("threads");
  });

  it("linkedin descriptor", () => {
    expect(detectService("linkedin.com/company/keg", "LinkedIn")).toBe("linkedin");
  });

  it("twitter / X", () => {
    expect(detectService("@keg", "Twitter")).toBe("twitter");
    expect(detectService("x.com/keg", "X")).toBe("twitter");
  });

  it("facebook descriptor", () => {
    expect(detectService("KEG Books", "Facebook")).toBe("facebook");
  });

  it("unknown 폴백", () => {
    expect(detectService("pinterest", "Pinterest")).toBe("unknown");
  });
});
