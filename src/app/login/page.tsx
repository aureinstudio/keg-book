import Link from "next/link";
import type { Metadata } from "next";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "../BrandLogo";

export const metadata: Metadata = { title: "로그인 — keg-book" };

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

const SAFE_REDIRECTS = new Set([
  "/",
  "/generate",
  "/blogger",
  "/naver",
  "/social",
  "/newsletter",
  "/card-news",
  "/history",
  "/publish-queue",
]);

function safeRedirect(raw: string | undefined): string {
  if (!raw) return "/generate";
  if (!raw.startsWith("/")) return "/generate";
  // 첫 path segment만 검사
  const path = raw.split("?")[0];
  return SAFE_REDIRECTS.has(path) ? raw : "/generate";
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const target = safeRedirect(sp.redirect);

  // 이미 로그인 — redirect 처리
  const session = await auth().catch(() => null);
  if (session?.user) {
    redirect(target);
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 sm:p-10"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-3)",
        }}
      >
        {/* 로고 */}
        <div className="mb-6 flex items-center gap-2.5">
          <BrandLogo size={36} />
          <div>
            <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>
              keg-book
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
              마케팅 채널 관리
            </p>
          </div>
        </div>

        {/* 제목 */}
        <h1
          className="text-[28px] font-normal leading-tight"
          style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
        >
          시작하려면
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Google로 로그인
          </span>
        </h1>
        <p
          className="mt-3 text-[14px] leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Blogger 발행과 작업 기록을 위해 Google 계정이 필요합니다.
          <br />
          네이버 패널과 랜딩 페이지는 로그인 없이도 둘러볼 수 있습니다.
        </p>

        {/* 권한 안내 */}
        <ul
          className="mt-6 space-y-2 rounded-xl px-4 py-3 text-[12px]"
          style={{
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-muted)",
          }}
        >
          <li className="flex items-start gap-2">
            <span style={{ color: "#0A0A0A" }}>·</span>
            <span>
              <strong style={{ color: "var(--color-text)" }}>이메일·프로필</strong> — 작업 기록 식별용
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "#262626" }}>·</span>
            <span>
              <strong style={{ color: "var(--color-text)" }}>Blogger API</strong> — 초안 작성·발행 권한
            </span>
          </li>
        </ul>

        {/* Google 버튼 */}
        <form
          action={async (formData: FormData) => {
            "use server";
            const r = String(formData.get("redirect") || "/generate");
            await signIn("google", { redirectTo: r });
          }}
          className="mt-6"
        >
          <input type="hidden" name="redirect" value={target} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
              boxShadow: "var(--shadow-2)",
            }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold"
              style={{ color: "#0A0A0A" }}
            >
              G
            </span>
            Google로 계속하기
          </button>
        </form>

        {/* 보조 액션 */}
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[12px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          <Link href="/" className="hover:underline" style={{ color: "var(--color-text-muted)" }}>
            ← 홈으로
          </Link>
          <Link
            href="/naver"
            className="hover:underline"
            style={{ color: "#525252" }}
          >
            네이버 패널 (로그인 불필요) →
          </Link>
        </div>
      </div>
    </div>
  );
}
