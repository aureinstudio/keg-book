"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "./BrandLogo";

type NavChild = {
  /** /social#instagram 같은 앵커 또는 별도 경로 */
  href: string;
  label: string;
  /** 표시용 단문자 아이콘 */
  icon: string;
  /** 채널 브랜드 컬러 */
  color: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  color: string;
  /** 하위 항목 — 부모 라우트가 활성일 때만 펼쳐서 보임 */
  children?: NavChild[];
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
      { href: "/generate", label: "콘텐츠 생성", icon: "✦", color: "#0A0A0A" },
    ],
  },
  {
    label: "채널",
    items: [
      { href: "/blogger",    label: "Blogger",  icon: "B", color: "#262626" },
      { href: "/naver",      label: "네이버",   icon: "N", color: "#525252" },
      {
        href: "/social",
        label: "소셜",
        icon: "S",
        color: "#404040",
        children: [
          { href: "/social#instagram", label: "Instagram", icon: "I", color: "#E1306C" },
          { href: "/social#threads",   label: "Threads",   icon: "T", color: "#000000" },
          { href: "/social#linkedin",  label: "LinkedIn",  icon: "in", color: "#0A66C2" },
        ],
      },
      { href: "/newsletter", label: "뉴스레터", icon: "M", color: "#525252" },
      { href: "/card-news",  label: "카드뉴스", icon: "C", color: "#737373" },
    ],
  },
  {
    label: "관리",
    items: [
      { href: "/history",       label: "작업 기록", icon: "H", color: "#5F6368" },
      { href: "/publish-queue", label: "발행 큐",  icon: "Q", color: "#0A0A0A" },
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
      {/* 로고 영역 */}
      <Link
        href="/"
        className="flex h-14 items-center gap-2.5 px-4"
        style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}
      >
        <BrandLogo size={28} />
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
      </Link>

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
                            ? "rgba(10,10,10,0.12)"
                            : "var(--color-sidebar-active)"
                          : "transparent",
                        color: isActive
                          ? isGenerate
                            ? "#0A0A0A"
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
                            background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
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
                          style={{ backgroundColor: isGenerate ? "#0A0A0A" : "var(--color-accent)" }}
                        />
                      )}
                    </Link>

                    {/* 하위 항목 — 부모 라우트가 활성일 때만 펼침 */}
                    {item.children && isActive && (
                      <ul className="mt-0.5 ml-4 space-y-0.5 border-l pl-2"
                          style={{ borderColor: "var(--color-sidebar-border)" }}>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="group flex h-7 items-center gap-2 rounded-full px-2 text-[12px] transition-colors duration-150"
                              style={{
                                color: "var(--color-sidebar-text)",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor =
                                  "var(--color-sidebar-hover)";
                                (e.currentTarget as HTMLElement).style.color =
                                  "var(--color-sidebar-text-active)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor =
                                  "transparent";
                                (e.currentTarget as HTMLElement).style.color =
                                  "var(--color-sidebar-text)";
                              }}
                            >
                              <span
                                className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold text-white"
                                style={{ backgroundColor: child.color }}
                                aria-hidden="true"
                              >
                                {child.icon}
                              </span>
                              <span className="truncate">{child.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
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
