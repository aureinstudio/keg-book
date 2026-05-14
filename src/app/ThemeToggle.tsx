"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function ThemeToggleInner() {
  const { setTheme, resolvedTheme } = useTheme();
  const active = (resolvedTheme ?? "light") as "light" | "dark";

  return (
    <div className="flex flex-col gap-1 px-1">
      {(["light", "dark"] as const).map((mode) => {
        const isSelected = active === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-pressed={isSelected}
            className="flex h-8 w-full items-center gap-2.5 rounded-full px-3 text-[12px] font-medium transition-colors duration-150"
            style={
              isSelected
                ? {
                    backgroundColor: "var(--color-sidebar-active)",
                    color: "var(--color-sidebar-text-active)",
                  }
                : {
                    backgroundColor: "transparent",
                    color: "var(--color-sidebar-text)",
                  }
            }
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "var(--color-sidebar-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "transparent";
              }
            }}
          >
            <span className="text-[14px]">{mode === "light" ? "☀️" : "🌙"}</span>
            <span>{mode === "light" ? "라이트" : "다크"}</span>
            {isSelected && (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-16" aria-hidden />;
  }

  return <ThemeToggleInner />;
}
