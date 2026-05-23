import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p
        className="text-sm font-medium"
        style={{ color: "var(--color-text-faint)" }}
      >
        404
      </p>
      <h1
        className="mt-1 text-2xl font-semibold tracking-tight"
        style={{ color: "var(--color-text)" }}
      >
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2" style={{ color: "var(--color-text-muted)" }}>
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        style={{
          border: "1px solid var(--color-border-strong)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
      >
        홈으로
      </Link>
    </main>
  );
}
