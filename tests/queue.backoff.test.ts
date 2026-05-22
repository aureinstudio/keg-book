import { describe, expect, it } from "vitest";

import { computeBackoffDelayMs, nextRunAfter } from "@/lib/queue/backoff";

describe("computeBackoffDelayMs", () => {
  it("첫 재시도(=0)는 baseMs 그대로", () => {
    expect(computeBackoffDelayMs(0, 1000, 5)).toBe(1000);
  });

  it("배수로 지수 증가 (1분 → 5분 → 25분)", () => {
    expect(computeBackoffDelayMs(0)).toBe(60_000);
    expect(computeBackoffDelayMs(1)).toBe(60_000 * 5);
    expect(computeBackoffDelayMs(2)).toBe(60_000 * 25);
  });

  it("capMs 를 넘지 않는다", () => {
    const cap = 10_000;
    expect(computeBackoffDelayMs(10, 1000, 5, cap)).toBe(cap);
  });

  it("음수 attempts 는 baseMs 로 안전 처리", () => {
    expect(computeBackoffDelayMs(-1, 1234)).toBe(1234);
  });
});

describe("nextRunAfter", () => {
  it("now + delay 를 반환", () => {
    const now = 1_000_000;
    expect(nextRunAfter(0, now, { baseMs: 500, factor: 2 })).toBe(now + 500);
    expect(nextRunAfter(2, now, { baseMs: 500, factor: 2 })).toBe(now + 2000);
  });

  it("cap 적용 후 now 와의 합으로 반환", () => {
    const now = 5_000;
    expect(nextRunAfter(99, now, { baseMs: 1000, factor: 10, capMs: 2000 })).toBe(
      now + 2000,
    );
  });
});
