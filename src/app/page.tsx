import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { BrandLogo } from "./BrandLogo";

export const metadata: Metadata = {
  title: "keg-book — KEG 교재 마케팅 자동화",
  description:
    "키워드 한 줄로 Blogger·네이버·뉴스레터·인스타·Threads·카드뉴스를 동시 생성하는 코리아교육그룹 마케팅 워크벤치.",
};

// ───────── 데이터 ─────────

type Solution = {
  href: string;
  icon: string;
  color: string;
  bg?: string;
  label: string;
  sub: string;
  desc: string;
  cta: string;
};

const SOLUTIONS: Solution[] = [
  {
    href: "/generate",
    icon: "✦",
    color: "#0A0A0A",
    bg: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
    label: "콘텐츠 생성",
    sub: "6 채널 동시",
    desc: "키워드 하나로 블로그·소셜·뉴스레터·카드뉴스까지 한 번에. Claude와 Gemini가 채널별 톤에 맞춰 자동 채움.",
    cta: "시작하기",
  },
  {
    href: "/blogger",
    icon: "B",
    color: "#262626",
    label: "Blogger",
    sub: "Google Blogger API",
    desc: "SEO 친화 제목·메타·라벨까지 한 번에 작성하고 Blogger에 초안으로 직접 전송.",
    cta: "Blogger 열기",
  },
  {
    href: "/naver",
    icon: "N",
    color: "#525252",
    label: "네이버 블로그",
    sub: "스마트에디터 호환 HTML",
    desc: "글쓰기 API가 종료된 환경에 맞춘 HTML·태그 한 번 복사 흐름. 로그인 없이 즉시 사용.",
    cta: "네이버 패널",
  },
  {
    href: "/social",
    icon: "S",
    color: "#404040",
    label: "인스타·Threads",
    sub: "Buffer GraphQL",
    desc: "캡션·해시태그·Threads 글까지 채널별로 다듬어 Buffer 예약 큐로 한 번에 전송.",
    cta: "소셜 워크벤치",
  },
  {
    href: "/newsletter",
    icon: "M",
    color: "#525252",
    label: "뉴스레터",
    sub: "메일리 호환 HTML",
    desc: "Subject·프리헤더·본문 HTML을 한 화면에서. 메일리 스토리/Q&A 템플릿 그대로 사용.",
    cta: "뉴스레터 열기",
  },
  {
    href: "/card-news",
    icon: "C",
    color: "#737373",
    label: "카드뉴스",
    sub: "Gemini 2.5 Flash Image",
    desc: "키워드로 표지+본문 3장 슬라이드 자동 기획·생성. PNG로 바로 다운로드 또는 Storage 영구 보관.",
    cta: "카드뉴스 열기",
  },
];

const STEPS = [
  {
    n: "01",
    title: "키워드 입력",
    desc: "주제·교재명·타겟 독자를 한 폼에 입력. 추가 맥락은 선택.",
  },
  {
    n: "02",
    title: "병렬 생성",
    desc: "Claude가 블로그 2,000자+ 장문을, Gemini Flash가 소셜·뉴스레터·카드뉴스를 동시에 작성.",
  },
  {
    n: "03",
    title: "채널 프리필 → 발행",
    desc: "각 채널 페이지에서 폼이 자동으로 채워짐. 검토 후 Blogger 초안·Buffer 예약·메일리로 발행.",
  },
] as const;

// ───────── Hero CTA ─────────

function GoogleSignInButton({ redirectTo }: { redirectTo: string }) {
  return (
    <Link
      href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
      className="flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-all"
      style={{
        background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      Google로 시작하기
    </Link>
  );
}

// ───────── 페이지 ─────────

export default async function LandingPage() {
  const session = await auth().catch(() => null);
  const isLoggedIn = !!session?.user;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* Hero */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          {/* 로고 */}
          <div className="mb-7 flex items-center gap-3">
            <BrandLogo size={56} />
            <div>
              <p
                className="text-[14px] font-medium leading-none"
                style={{ color: "var(--color-text)" }}
              >
                keg-book
              </p>
              <p
                className="mt-1 text-[11px] leading-none"
                style={{ color: "var(--color-text-faint)" }}
              >
                KEG 교재 마케팅 워크벤치
              </p>
            </div>
          </div>

          {/* 버전 배지 */}
          <div className="mb-6 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: "rgba(10,10,10,0.08)",
                color: "var(--color-text)",
              }}
            >
              v0.1
            </span>
            <span className="text-[12px]" style={{ color: "var(--color-text-faint)" }}>
              KEG × Gemini × Claude
            </span>
          </div>

          {/* 제목 */}
          <h1
            className="text-[40px] font-normal leading-[1.1] sm:text-[56px]"
            style={{ color: "var(--color-text)", letterSpacing: "-0.02em" }}
          >
            6개 마케팅 채널을
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              키워드 한 줄로 동시에
            </span>
          </h1>

          {/* 서브 */}
          <p
            className="mt-6 max-w-2xl text-[16px] leading-relaxed sm:text-[18px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Blogger · 네이버 · 뉴스레터 · 인스타그램 · Threads · 카드뉴스 —
            <br className="hidden sm:block" />
            코리아교육그룹 교재 마케팅을 위한 통합 콘텐츠 워크벤치.
          </p>

          {/* CTA */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/generate"
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
                    boxShadow: "var(--shadow-2)",
                  }}
                >
                  ✦ 콘텐츠 생성 시작
                </Link>
                <Link
                  href="/history"
                  className="rounded-full px-6 py-3 text-[14px] font-medium transition-colors"
                  style={{
                    border: "1px solid var(--color-border-strong)",
                    color: "var(--color-text)",
                    backgroundColor: "transparent",
                  }}
                >
                  작업 기록 보기
                </Link>
              </>
            ) : (
              <>
                <GoogleSignInButton redirectTo="/generate" />
                <Link
                  href="/naver"
                  className="rounded-full px-6 py-3 text-[14px] font-medium transition-colors"
                  style={{
                    border: "1px solid var(--color-border-strong)",
                    color: "var(--color-text)",
                    backgroundColor: "transparent",
                  }}
                >
                  로그인 없이 둘러보기
                </Link>
              </>
            )}
          </div>

          {/* 통계 */}
          <div
            className="mt-12 grid grid-cols-3 gap-6 rounded-2xl px-6 py-5"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            {[
              { v: "6", l: "동시 채널" },
              { v: "~40s", l: "평균 생성 시간" },
              { v: "5,000+", l: "장문 자동 작성 글자" },
            ].map((s) => (
              <div key={s.l}>
                <p
                  className="text-[28px] font-medium tabular-nums sm:text-[32px]"
                  style={{ color: "var(--color-text)" }}
                >
                  {s.v}
                </p>
                <p className="text-[12px]" style={{ color: "var(--color-text-faint)" }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 솔루션 카드 */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p
              className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-faint)" }}
            >
              채널
            </p>
            <h2
              className="text-[24px] font-normal sm:text-[28px]"
              style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
            >
              6개 채널, 단일 워크벤치
            </h2>
            <p
              className="mt-1.5 text-[14px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              생성부터 채널별 발행 흐름까지 일관된 UX.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-2xl p-5 transition-all"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                    style={{
                      background: s.bg ?? s.color,
                    }}
                  >
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[14px] font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {s.label}
                    </p>
                    <p
                      className="truncate text-[11px]"
                      style={{ color: "var(--color-text-faint)" }}
                    >
                      {s.sub}
                    </p>
                  </div>
                </div>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {s.desc}
                </p>
                <p
                  className="mt-4 text-[12px] font-medium"
                  style={{ color: s.color }}
                >
                  {s.cta} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 작동 원리 */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p
              className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-faint)" }}
            >
              작동 원리
            </p>
            <h2
              className="text-[24px] font-normal sm:text-[28px]"
              style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
            >
              3단계 — 입력 → 생성 → 발행
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  className="mb-3 text-[12px] font-medium tabular-nums"
                  style={{ color: "#0A0A0A" }}
                >
                  {step.n}
                </p>
                <p
                  className="text-[15px] font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  {step.title}
                </p>
                <p
                  className="mt-1.5 text-[13px] leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="px-6 py-16">
        <div
          className="mx-auto max-w-5xl rounded-3xl px-8 py-10 text-center sm:px-12 sm:py-14"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,10,10,0.08) 0%, rgba(82,82,82,0.08) 100%)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2
            className="text-[26px] font-normal sm:text-[32px]"
            style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
          >
            지금 키워드 하나로 시작하세요
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-[14px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            새 캠페인을 6개 채널에 동시 전개하는 데 1분도 걸리지 않습니다.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/generate"
                className="rounded-full px-6 py-3 text-[14px] font-medium text-white"
                style={{
                  background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
                  boxShadow: "var(--shadow-2)",
                }}
              >
                ✦ 콘텐츠 생성
              </Link>
            ) : (
              <GoogleSignInButton redirectTo="/generate" />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-10"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3 text-[12px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>
              KEG · Korean Education Group
            </span>
            <span>·</span>
            <span>대표 김영우</span>
            <span>·</span>
            <span>사업자 214-87-88737</span>
          </div>
          <p
            className="mt-2 text-[12px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            서울특별시 강남구 도곡동 946번지 부영빌딩 4층 · 02-3471-0531 ·
            keg@koreaedugroup.com
          </p>
          <p
            className="mt-2 text-[11px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            keg-book · 내부 마케팅 워크벤치 (베타)
          </p>
        </div>
      </footer>
    </div>
  );
}
