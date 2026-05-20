export default function Loading() {
  return (
    <div
      className="mx-auto flex max-w-xl flex-col gap-3 px-6 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-3 w-24 rounded-full animate-pulse"
        style={{ backgroundColor: "var(--color-surface-2)" }}
      />
      <div
        className="h-5 w-2/3 rounded-md animate-pulse"
        style={{ backgroundColor: "var(--color-surface-2)" }}
      />
      <div
        className="h-3 w-full rounded-md animate-pulse"
        style={{ backgroundColor: "var(--color-surface-2)" }}
      />
      <span className="sr-only">로딩 중…</span>
    </div>
  );
}
