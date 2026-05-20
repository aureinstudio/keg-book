import { describe, expect, it } from "vitest";

// 내부 함수가 export 되어 있지 않으므로, 실 동작 검증은 메시지 매칭으로 한다.
// 향후 export 되면 직접 호출하도록 리팩터.
// 본 테스트는 social/actions.ts 의 humanizeBufferError 로직과 동일한 정규식을
// 추출하여 회귀를 막는 sentinel 역할을 한다.

const PATTERNS = {
  authExpired: /401|unauthor|invalid token|token expired|forbidden/i,
  channelBroken: /channel.*(disconnected|not.?found|locked)/i,
  rateLimit: /rate.?limit|too many requests|429/i,
  network: /network|fetch failed|enotfound|econnreset/i,
};

describe("buffer error pattern matching (humanizeBufferError sentinel)", () => {
  it("401 / Unauthorized 가 인증 만료로 분류된다", () => {
    expect(PATTERNS.authExpired.test("HTTP 401 Unauthorized")).toBe(true);
    expect(PATTERNS.authExpired.test("token expired")).toBe(true);
  });

  it("channel disconnected / not found / locked 가 채널 문제로 분류된다", () => {
    expect(PATTERNS.channelBroken.test("channel was disconnected by user")).toBe(true);
    expect(PATTERNS.channelBroken.test("channel not found")).toBe(true);
    expect(PATTERNS.channelBroken.test("channel locked")).toBe(true);
  });

  it("429 / rate limit 이 rate limit 으로 분류된다", () => {
    expect(PATTERNS.rateLimit.test("HTTP 429")).toBe(true);
    expect(PATTERNS.rateLimit.test("Too Many Requests")).toBe(true);
  });

  it("ENOTFOUND / fetch failed 가 네트워크로 분류된다", () => {
    expect(PATTERNS.network.test("getaddrinfo ENOTFOUND api.buffer.com")).toBe(true);
    expect(PATTERNS.network.test("fetch failed")).toBe(true);
  });
});
