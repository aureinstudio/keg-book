import { NextResponse } from "next/server";

import { auth } from "@/auth";

// 인증 없이 접근 가능한 경로 — 정확 매치 또는 prefix
const PUBLIC_EXACT = new Set<string>([
  "/",
  "/login",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

const PUBLIC_PREFIXES = [
  "/api/auth/",   // NextAuth handler — 자체 인증 처리
  "/api/cron/",   // CRON_SECRET Bearer 자체 인증 (route 단에서 검증)
  "/_next/",
  "/static/",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|txt|xml|webmanifest)$/i.test(pathname)) {
    return true;
  }
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();
  if (req.auth?.user) return NextResponse.next();

  const accept = req.headers.get("accept") ?? "";
  const isApi = pathname.startsWith("/api/");
  const isServerAction = req.method === "POST" && !accept.includes("text/html");

  if (isApi || isServerAction) {
    return NextResponse.json(
      { error: "Unauthorized", message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
