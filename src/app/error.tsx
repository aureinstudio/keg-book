"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div
      className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16"
      role="alert"
      aria-live="assertive"
    >
      <h1 className="text-xl font-medium" style={{ color: "var(--color-text)" }}>
        문제가 발생했습니다
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        요청을 처리하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        문제가 계속되면 관리자에게 문의해 주세요.
      </p>
      {error.digest && (
        <p
          className="font-mono text-[11px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          오류 ID: {error.digest}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-on)",
          }}
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
