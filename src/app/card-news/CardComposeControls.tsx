"use client";

import type { CardComposeOptions } from "@/lib/client/composeCardPng";

/**
 * 카드별 폰트·헤드라인 Y위치·그라데이션 강도 슬라이더.
 * - controlled 컴포넌트 (parent state 보관)
 * - 미세 조정 후 미리보기·단일 PNG·ZIP 다운로드에 모두 반영
 */
export const DEFAULTS = {
  fontScale: 1,
  bottomOffset: 0.08,
  gradientStrength: 1,
} satisfies Required<CardComposeOptions>;

type Required_<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

export type CardComposeValues = Required_<CardComposeOptions>;

export function isCustomized(v: CardComposeValues): boolean {
  return (
    v.fontScale !== DEFAULTS.fontScale ||
    v.bottomOffset !== DEFAULTS.bottomOffset ||
    v.gradientStrength !== DEFAULTS.gradientStrength
  );
}

export function CardComposeControls({
  value,
  onChange,
  compact = false,
}: {
  value: CardComposeValues;
  onChange: (next: CardComposeValues) => void;
  compact?: boolean;
}) {
  const labelStyle = compact
    ? "text-[10px] uppercase tracking-wider"
    : "text-[11px] uppercase tracking-wider";
  const numStyle = compact
    ? "text-[10px] tabular-nums"
    : "text-[11px] tabular-nums";

  function update<K extends keyof CardComposeValues>(
    k: K,
    v: CardComposeValues[K],
  ) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div
      className="space-y-2 rounded-md p-2"
      style={{
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}
    >
      <Row
        label="폰트"
        labelStyle={labelStyle}
        numStyle={numStyle}
        display={`${Math.round(value.fontScale * 100)}%`}
      >
        <input
          type="range"
          min={0.5}
          max={1.6}
          step={0.05}
          value={value.fontScale}
          onChange={(e) => update("fontScale", Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
          aria-label="폰트 크기 배율"
        />
      </Row>

      <Row
        label="위치"
        labelStyle={labelStyle}
        numStyle={numStyle}
        display={`↑ ${Math.round(value.bottomOffset * 100)}%`}
      >
        <input
          type="range"
          min={0.02}
          max={0.45}
          step={0.01}
          value={value.bottomOffset}
          onChange={(e) => update("bottomOffset", Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
          aria-label="헤드라인 하단 여백"
        />
      </Row>

      <Row
        label="그라데"
        labelStyle={labelStyle}
        numStyle={numStyle}
        display={`${Math.round(value.gradientStrength * 100)}%`}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value.gradientStrength}
          onChange={(e) => update("gradientStrength", Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
          aria-label="하단 그라데이션 강도"
        />
      </Row>

      {isCustomized(value) && (
        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULTS })}
            className="rounded px-2 py-0.5 text-[10px]"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              backgroundColor: "transparent",
            }}
            title="기본값으로 되돌리기"
          >
            기본
          </button>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  labelStyle,
  numStyle,
  display,
  children,
}: {
  label: string;
  labelStyle: string;
  numStyle: string;
  display: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`shrink-0 ${labelStyle}`}
        style={{ color: "var(--color-text-faint)", minWidth: "44px" }}
      >
        {label}
      </span>
      <div className="flex-1">{children}</div>
      <span
        className={numStyle}
        style={{ color: "var(--color-text-muted)", minWidth: "44px", textAlign: "right" }}
      >
        {display}
      </span>
    </div>
  );
}
