"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  color: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "시작",
    items: [
      { href: "/",         label: "홈",         icon: "K", color: "#5F6368" },
      { href: "/generate", label: "콘텐츠 생성", icon: "✦", color: "#4285F4" },
    ],
  },
  {
    label: "채널",
    items: [
      { href: "/blogger",       label: "Blogger",  icon: "B", color: "#EA4335" },
      { href: "/naver",         label: "네이버",   icon: "N", color: "#03C75A" },
      { href: "/social",        label: "소셜",     icon: "S", color: "#E1306C" },
      { href: "/newsletter",    label: "뉴스레터", icon: "M", color: "#9C27B0" },
      { href: "/card-news",     label: "카드뉴스", icon: "C", color: "#F9AB00" },
    ],
  },
  {
    label: "관리",
    items: [
      { href: "/history",       label: "작업 기록", icon: "H", color: "#5F6368" },
      { href: "/publish-queue", label: "발행 큐",  icon: "Q", color: "#1A73E8" },
    ],
  },
];

export function AppSidebar({ userBadge }: { userBadge?: ReactNode }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-56 shrink-0 flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-sidebar-bg)",
        borderRight: "1px solid var(--color-sidebar-border)",
      }}
    >
      {/* 로고 영역 — AI Studio 상단 헤더 스타일 */}
      <div
        className="flex h-14 items-center gap-2.5 px-4"
        style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}
      >
        {/* Gemini 그라데이션 로고 */}
        <div
          className="gemini-gradient flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
        >
          K
        </div>
        <div>
          <p
            className="text-[13px] font-medium leading-none"
            style={{ color: "var(--color-sidebar-text-active)" }}
          >
            keg-book
          </p>
          <p
            className="mt-0.5 text-[10px] leading-none"
            style={{ color: "var(--color-text-faint)" }}
          >
            마케팅 채널 관리
          </p>
        </div>
      </div>

      {/* 내비게이션 — 섹션별 그룹 */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2" aria-label="채널 네비게이션">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            <p
              className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-faint)" }}
            >
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const isGenerate = item.href === "/generate";

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex h-9 items-center gap-3 rounded-full px-3 text-[13px] font-medium transition-colors duration-150"
                      style={{
                        backgroundColor: isActive
                          ? isGenerate
                            ? "rgba(66,133,244,0.12)"
                            : "var(--color-sidebar-active)"
                          : "transparent",
                        color: isActive
                          ? isGenerate
                            ? "#4285F4"
                            : "var(--color-sidebar-text-active)"
                          : "var(--color-sidebar-text)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "var(--color-sidebar-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "transparent";
                        }
                      }}
                    >
                      {isGenerate ? (
                        <span
                          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
                          style={{
                            background: "linear-gradient(135deg, #4285F4 0%, #9C27B0 100%)",
                            opacity: isActive ? 1 : 0.85,
                          }}
                        >
                          ✦
                        </span>
                      ) : (
                        <span
                          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
                          style={{
                            backgroundColor: item.color,
                            opacity: isActive ? 1 : 0.75,
                          }}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>

                      {isActive && (
                        <span
                          className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: isGenerate ? "#4285F4" : "var(--color-accent)" }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 하단 — 사용자 + 테마 토글 */}
      <div
        className="space-y-2 px-2 py-3"
        style={{ borderTop: "1px solid var(--color-sidebar-border)" }}
      >
        {userBadge}
        <ThemeToggle />
      </div>
    </aside>
  );
}
