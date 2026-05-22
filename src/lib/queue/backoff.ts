/**
 * 발행 큐 재시도 backoff — 지수 증가 (1분 → 5분 → 25분 → 2h ...).
 *
 * @param attemptsSoFar 이전까지 실패한 횟수(0-indexed). 첫 재시도 = 0.
 * @param baseMs 첫 재시도까지 대기(ms). 기본 60_000 (1분).
 * @param factor 매 시도 배수. 기본 5.
 * @param capMs 최대 대기(ms). 기본 6시간.
 */
export function computeBackoffDelayMs(
  attemptsSoFar: number,
  baseMs = 60_000,
  factor = 5,
  capMs = 6 * 60 * 60 * 1000,
): number {
  if (attemptsSoFar < 0) return baseMs;
  const raw = baseMs * Math.pow(factor, attemptsSoFar);
  return Math.min(raw, capMs);
}

/** 현재 시각 기준 다음 실행 시각(ms). */
export function nextRunAfter(
  attemptsSoFar: number,
  now: number = Date.now(),
  opts?: { baseMs?: number; factor?: number; capMs?: number },
): number {
  return (
    now +
    computeBackoffDelayMs(
      attemptsSoFar,
      opts?.baseMs,
      opts?.factor,
      opts?.capMs,
    )
  );
}
