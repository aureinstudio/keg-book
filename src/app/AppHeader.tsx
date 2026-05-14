import Link from "next/link";

import { ThemeToggle } from "./ThemeToggle";

const link =
  "rounded px-2 py-1 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 text-sm sm:px-8"
        aria-label="주요 메뉴"
      >
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          <Link
            href="/"
            className="mr-2 font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-white"
          >
            keg-book
          </Link>
          <span className="hidden text-zinc-400 dark:text-zinc-600 sm:inline" aria-hidden>
            |
          </span>
          <Link href="/" className={link}>
            Blogger
          </Link>
          <Link href="/naver" className={`${link} hover:text-[#03C75A]`}>
            네이버
          </Link>
          <Link href="/social" className={`${link} hover:text-pink-600 dark:hover:text-pink-300`}>
            소셜
          </Link>
          <Link href="/newsletter" className={`${link} hover:text-violet-700 dark:hover:text-violet-300`}>
            뉴스레터
          </Link>
          <Link href="/publish-queue" className={`${link} hover:text-sky-700 dark:hover:text-sky-300`}>
            발행 큐
          </Link>
          <Link href="/card-news" className={`${link} hover:text-amber-700 dark:hover:text-amber-300`}>
            카드뉴스
          </Link>
        </div>
        <div className="ml-auto flex shrink-0 items-center pt-1 sm:pt-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
