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
  num: string;
  label: string;
  sub: string;
  desc: string;
};

const SOLUTIONS: Solution[] = [
  {
    href: "/blogger",
    num: "01",
    label: "Blogger",
    sub: "Google Blogger API",
    desc: "SEO 친화 제목·메타·라벨까지 한 번에 작성하고 Blogger 에 초안으로 직접 전송.",
  },
  {
    href: "/naver",
    num: "02",
    label: "네이버 블로그",
    sub: "스마트에디터 호환 HTML",
    desc: "글쓰기 API 가 종료된 환경에 맞춘 HTML·태그 한 번 복사 흐름. 로그인 없이 즉시 사용.",
  },
  {
    href: "/social",
    num: "03",
    label: "인스타 · Threads · LinkedIn",
    sub: "Buffer GraphQL",
    desc: "캡션·해시태그·Threads 글까지 채널별로 다듬어 Buffer 예약 큐로 한 번에 전송.",
  },
  {
    href: "/newsletter",
    num: "04",
    label: "뉴스레터",
    sub: "메일리 호환 HTML",
    desc: "Subject · 프리헤더 · 본문 HTML 을 한 화면에서. 메일리 Q&A 템플릿 그대로 사용.",
  },
  {
    href: "/card-news",
    num: "05",
    label: "카드뉴스",
    sub: "Gemini 2.5 Flash Image",
    desc: "키워드로 표지+본문 3장 슬라이드 자동 기획·생성. PNG 로 바로 다운로드 또는 Storage 영구 보관.",
  },
  {
    href: "/publish-queue",
    num: "06",
    label: "발행 큐",
    sub: "Buffer · 예약 발행",
    desc: "Social 워크벤치에서 즉시 또는 예약 시각으로 큐에 적재. 워커가 1분 사이클로 자동 처리.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "키워드 입력",
    desc: "주제 · 교재명 · 타겟 독자를 한 줄에. 추가 맥락은 선택.",
  },
  {
    n: "02",
    title: "병렬 생성",
    desc: "Claude 가 블로그 2,000자+ 장문을, Gemini Flash 가 소셜 · 뉴스레터 · 카드뉴스를 동시 작성.",
  },
  {
    n: "03",
    title: "채널 발행",
    desc: "각 채널 페이지에서 폼이 자동으로 채워짐. 검토 후 Blogger 초안 · Buffer 예약 · 메일리 발행.",
  },
] as const;

// ───────── Hero CTA ─────────

function GoogleSignInButton({ redirectTo }: { redirectTo: string }) {
  return (
    <Link
      href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
      className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium transition-all hover:opacity-90"
      style={{
        backgroundColor: "var(--color-accent)",
        color: "var(--color-accent-on)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      Google 로 시작하기 <span aria-hidden="true">→</span>
    </Link>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-medium transition-colors hover:bg-[var(--color-surface-2)]"
      style={{
        border: "1px solid var(--color-border-strong)",
        color: "var(--color-text)",
      }}
    >
      {label}
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
      {/* ─────────────── Hero ─────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-12 sm:pt-28 sm:pb-16">
        {/* 배경 거대 숫자 (편집 디자인 강조) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-4%] top-[8%] select-none text-[280px] font-bold leading-none sm:right-[-2%] sm:text-[420px]"
          style={{
            color: "var(--color-surface-2)",
            letterSpacing: "-0.05em",
            zIndex: 0,
          }}
        >
          06
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Eyebrow */}
          <p
            className="mb-6 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-faint)" }}
          >
            KEG · 교재 마케팅 워크벤치
          </p>

          {/* 제목 — weight 대비 (light + semibold) */}
          <h1
            className="text-[44px] leading-[1.02] sm:text-[72px]"
            style={{
              color: "var(--color-text)",
              letterSpacing: "-0.035em",
              fontWeight: 300,
            }}
          >
            6개 마케팅 채널을
            <br />
            <span style={{ fontWeight: 600 }}>키워드 한 줄로,</span>{" "}
            <span style={{ fontWeight: 600 }}>동시에.</span>
          </h1>

          {/* 서브 */}
          <p
            className="mt-7 max-w-xl text-[16px] leading-[1.65] sm:text-[18px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Blogger · 네이버 · 뉴스레터 · 인스타 · Threads · 카드뉴스 — 코리아교육그룹
            교재 마케팅을 위한 통합 콘텐츠 워크벤치.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/generate"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium transition-all hover:opacity-90"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-on)",
                    boxShadow: "var(--shadow-2)",
                  }}
                >
                  콘텐츠 생성 시작 <span aria-hidden="true">→</span>
                </Link>
                <SecondaryLink href="/history" label="작업 기록" />
              </>
            ) : (
              <>
                <GoogleSignInButton redirectTo="/generate" />
                <SecondaryLink href="/naver" label="로그인 없이 둘러보기" />
              </>
            )}
          </div>

          {/* Stats — inline editorial style with dividers */}
          <dl
            className="mt-16 flex flex-wrap items-baseline gap-x-10 gap-y-6 border-t pt-8"
            style={{ borderColor: "var(--color-border)" }}
          >
            {[
              { v: "6", l: "동시 채널", sub: "Blogger · 네이버 · 소셜 · 뉴스레터 · 카드뉴스 · 발행 큐" },
              { v: "~40s", l: "평균 생성 시간", sub: "Claude + Gemini 병렬 호출" },
              { v: "5,000+", l: "장문 자동 작성 글자", sub: "한 키워드당 누적" },
            ].map((s, i) => (
              <div
                key={s.l}
                className="flex flex-col"
                style={{
                  paddingLeft: i > 0 ? "0" : undefined,
                }}
              >
                <dt
                  className="text-[11px] font-medium uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {s.l}
                </dt>
                <dd
                  className="mt-1 text-[32px] font-medium leading-none tabular-nums sm:text-[40px]"
                  style={{
                    color: "var(--color-text)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.v}
                </dd>
                <p
                  className="mt-1 text-[11px]"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {s.sub}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────────── 채널 솔루션 — editorial list ─────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-baseline justify-between gap-4">
            <div>
              <p
                className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em]"
                style={{ color: "var(--color-text-faint)" }}
              >
                채널
              </p>
              <h2
                className="text-[28px] sm:text-[36px]"
                style={{
                  color: "var(--color-text)",
                  letterSpacing: "-0.02em",
                  fontWeight: 400,
                }}
              >
                단일 워크벤치, 6개 출구.
              </h2>
            </div>
            <p
              className="hidden max-w-xs text-[13px] sm:block"
              style={{ color: "var(--color-text-muted)" }}
            >
              생성부터 채널별 발행 흐름까지 일관된 UX.
            </p>
          </div>

          <ul
            className="divide-y"
            style={{ borderColor: "var(--color-border)" }}
          >
            <li style={{ borderTop: "1px solid var(--color-border)" }} />
            {SOLUTIONS.map((s) => (
              <li key={s.href} style={{ borderColor: "var(--color-border)" }}>
                <Link
                  href={s.href}
                  className="solution-row group flex items-baseline gap-6 py-6 transition-colors sm:gap-10"
                >
                  {/* 번호 */}
                  <span
                    className="shrink-0 text-[14px] font-medium tabular-nums sm:text-[16px]"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    {s.num}
                  </span>

                  {/* 라벨 + sub */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        className="text-[20px] sm:text-[24px]"
                        style={{
                          color: "var(--color-text)",
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        className="text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        {s.sub}
                      </span>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed sm:text-[14px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {s.desc}
                    </p>
                  </div>

                  {/* Arrow */}
                  <span
                    aria-hidden="true"
                    className="solution-arrow shrink-0 text-[18px] transition-transform sm:text-[20px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─────────────── 작동 원리 — 가로 타임라인 ─────────────── */}
      <section
        className="px-6 py-20"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p
              className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--color-text-faint)" }}
            >
              작동 원리
            </p>
            <h2
              className="text-[28px] sm:text-[36px]"
              style={{
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              입력 → 생성 → 발행.
            </h2>
          </div>

          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                className="relative"
                style={{
                  borderTop: "1px solid var(--color-border-strong)",
                  paddingTop: "20px",
                }}
              >
                {/* 가로 연결선 */}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-[-9px] right-[-12px] hidden text-[16px] sm:block"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    →
                  </span>
                )}

                <p
                  className="text-[11px] font-medium uppercase tracking-[0.12em] tabular-nums"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Step {step.n}
                </p>
                <p
                  className="mt-2 text-[18px]"
                  style={{
                    color: "var(--color-text)",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.title}
                </p>
                <p
                  className="mt-2 text-[13px] leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────── CTA Band — 풀-블리드 대비 ─────────────── */}
      <section
        className="relative px-6 py-20 sm:py-28"
        style={{ backgroundColor: "var(--color-accent)" }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            지금 시작
          </p>
          <h2
            className="text-[32px] leading-[1.1] sm:text-[48px]"
            style={{
              color: "var(--color-accent-on)",
              letterSpacing: "-0.025em",
              fontWeight: 400,
            }}
          >
            키워드 한 줄 →
            <br />
            <span style={{ fontWeight: 600 }}>1분 안에 6개 채널.</span>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--color-accent-on)",
                  color: "var(--color-accent)",
                }}
              >
                콘텐츠 생성 시작 <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <Link
                href="/login?redirect=/generate"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--color-accent-on)",
                  color: "var(--color-accent)",
                }}
              >
                Google 로 시작하기 <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────── Footer — 압축 + 메타 ─────────────── */}
      <footer
        className="px-6 py-12"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            {/* 좌측 — 브랜드 */}
            <div className="flex items-center gap-3">
              <BrandLogo size={36} />
              <div>
                <p
                  className="text-[13px] font-medium leading-none"
                  style={{ color: "var(--color-text)" }}
                >
                  keg-book
                </p>
                <p
                  className="mt-1 text-[11px] leading-none"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  v0.1 · KEG × Gemini × Claude
                </p>
              </div>
            </div>

            {/* 우측 — 회사 정보 */}
            <div
              className="text-[11px] leading-[1.7]"
              style={{ color: "var(--color-text-faint)" }}
            >
              <p>
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontWeight: 500,
                  }}
                >
                  KEG · Korean Education Group
                </span>{" "}
                · 대표 김영우 · 사업자 214-87-88737
              </p>
              <p>
                서울특별시 강남구 도곡동 946번지 부영빌딩 4층 · 02-3471-0531 ·
                keg@koreaedugroup.com
              </p>
            </div>
          </div>

          <p
            className="mt-8 text-[11px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            keg-book · 내부 마케팅 워크벤치 (베타)
          </p>
        </div>
      </footer>
    </div>
  );
}
