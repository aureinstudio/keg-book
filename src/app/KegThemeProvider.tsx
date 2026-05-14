"use client";

import { ThemeProvider } from "next-themes";

type Props = { children: React.ReactNode };

export function KegThemeProvider({ children }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark"]}
      enableSystem={false}
      disableTransitionOnChange
      storageKey="keg-book-theme"
    >
      {children}
    </ThemeProvider>
  );
}
