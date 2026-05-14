import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        404
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        홈으로
      </Link>
    </main>
  );
}
