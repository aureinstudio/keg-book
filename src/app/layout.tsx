import type { Metadata } from "next";
import { AppSidebar } from "./AppSidebar";
import { KegThemeProvider } from "./KegThemeProvider";
import { UserBadge } from "./UserBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "keg-book",
  description: "코리아교육그룹 출판 마케팅",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <KegThemeProvider>
          <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
            <AppSidebar userBadge={<UserBadge />} />
            {/* 메인 영역 */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </KegThemeProvider>
      </body>
    </html>
  );
}
