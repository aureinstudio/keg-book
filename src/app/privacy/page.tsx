import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — keg-book",
  description: "keg-book이 수집·이용·보관·파기하는 개인정보 처리 방침",
};

const UPDATED_AT = "2026-05-15";

export default function PrivacyPage() {
  return (
    <div
      className="mx-auto max-w-3xl px-6 py-12 sm:py-16"
      style={{ color: "var(--color-text)" }}
    >
      {/* 헤더 */}
      <div className="mb-10">
        <Link
          href="/"
          className="text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← 홈으로
        </Link>
        <h1
          className="mt-4 text-[32px] font-normal leading-tight sm:text-[40px]"
          style={{ letterSpacing: "-0.01em" }}
        >
          개인정보처리방침
        </h1>
        <p
          className="mt-3 text-[13px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          최종 업데이트: {UPDATED_AT}
        </p>
      </div>

      {/* 본문 */}
      <div
        className="space-y-10 text-[15px] leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Section title="1. 개요">
          <p>
            <strong style={{ color: "var(--color-text)" }}>keg-book</strong>(이하
            “서비스”)는 <strong style={{ color: "var(--color-text)" }}>코리아교육그룹</strong>의
            출판 교재 마케팅 자동화 도구입니다. 본 방침은 서비스가 수집·이용하는 개인정보의
            항목, 수집 방법, 보관 기간, 제3자 제공, 이용자의 권리에 대해 설명합니다.
          </p>
        </Section>

        <Section title="2. 수집하는 개인정보 항목">
          <ul className="space-y-2">
            <Li>
              <strong style={{ color: "var(--color-text)" }}>Google 계정 정보</strong> —
              이메일 주소, 이름, 프로필 사진(공개 정보). 로그인·작업 기록 식별 목적.
            </Li>
            <Li>
              <strong style={{ color: "var(--color-text)" }}>Blogger 발행 권한</strong> —
              OAuth 동의에 따라 사용자가 직접 권한을 부여한 경우에 한해, 사용자의 Blogger 계정에 글을 작성·수정합니다.
              비밀번호 등 자격 증명을 직접 보관하지 않으며, Google이 발급한 OAuth 토큰만 일시 보관합니다.
            </Li>
            <Li>
              <strong style={{ color: "var(--color-text)" }}>서비스 이용 기록</strong> —
              사용자가 생성한 콘텐츠(키워드, 채널별 초안, 카드뉴스 이미지 등)와 메타데이터(생성 시각, 모델 정보 등).
            </Li>
          </ul>
        </Section>

        <Section title="3. 수집 방법">
          <ul className="space-y-2">
            <Li>Google OAuth 2.0을 통한 로그인 시점에 Google이 제공하는 프로필 정보 자동 수집</Li>
            <Li>사용자가 서비스 내에서 입력한 키워드·콘텐츠</Li>
          </ul>
        </Section>

        <Section title="4. 개인정보의 이용 목적">
          <ul className="space-y-2">
            <Li>회원 식별 및 작업 기록 관리</Li>
            <Li>사용자 요청에 따른 Blogger 발행 처리</Li>
            <Li>서비스 품질 개선 및 오류 대응</Li>
          </ul>
        </Section>

        <Section title="5. 제3자 제공 및 처리위탁">
          <p>
            서비스는 콘텐츠 생성·발행을 위해 다음 외부 서비스에 데이터를 일시 전송합니다.
            전송되는 데이터는 처리에 필요한 최소 범위로 제한됩니다.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
            <table className="w-full text-[13px]">
              <thead style={{ backgroundColor: "var(--color-surface-2)" }}>
                <tr>
                  <Th>제공받는 자</Th>
                  <Th>제공 데이터</Th>
                  <Th>목적</Th>
                </tr>
              </thead>
              <tbody>
                <Tr name="Google (Blogger API)" data="사용자 키워드·콘텐츠 본문" purpose="사용자 본인 블로그에 발행" />
                <Tr name="Google (Gemini API)" data="키워드·생성 프롬프트" purpose="소셜·뉴스레터·카드뉴스 콘텐츠 생성" />
                <Tr name="Anthropic (Claude API)" data="키워드·생성 프롬프트" purpose="블로그 장문 콘텐츠 생성" />
                <Tr name="Supabase Inc." data="콘텐츠 메타데이터·이미지" purpose="DB·스토리지(클라우드 인프라)" />
                <Tr name="Vercel Inc." data="요청·응답 로그" purpose="서비스 호스팅" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="6. 보유 및 이용 기간">
          <ul className="space-y-2">
            <Li>회원 정보·작업 기록: 회원 탈퇴 또는 사용자의 삭제 요청 시까지</Li>
            <Li>Blogger OAuth 토큰: 사용자가 권한을 철회할 때까지</Li>
            <Li>외부 API에 전송된 데이터: 각 제공자의 정책에 따름 (예: Anthropic은 학습에 사용하지 않음을 명시)</Li>
          </ul>
        </Section>

        <Section title="7. 이용자의 권리">
          <ul className="space-y-2">
            <Li>본인 정보의 열람·정정·삭제·처리 정지 요청 가능</Li>
            <Li>
              Google 계정 권한 철회:{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--color-link)" }}
              >
                myaccount.google.com/permissions
              </a>{" "}
              에서 keg-book 권한 제거
            </Li>
            <Li>아래 연락처로 데이터 삭제 요청 시 영업일 기준 7일 이내 처리</Li>
          </ul>
        </Section>

        <Section title="8. 보안 조치">
          <ul className="space-y-2">
            <Li>전송 구간 HTTPS/TLS 암호화</Li>
            <Li>Supabase Row-Level Security 및 Service Role Key 서버 측 한정 사용</Li>
            <Li>OAuth 토큰은 서버 환경에서만 처리하며 클라이언트에 노출하지 않음</Li>
          </ul>
        </Section>

        <Section title="9. 쿠키 사용">
          <p>
            서비스는 로그인 세션 유지를 위해 필수 쿠키(NextAuth 세션)를 사용합니다.
            광고·추적 목적의 제3자 쿠키는 사용하지 않습니다.
          </p>
        </Section>

        <Section title="10. 정책 변경">
          <p>
            본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다.
          </p>
        </Section>

        <Section title="11. 문의처">
          <ul className="space-y-1">
            <Li>운영 주체: 코리아교육그룹 (Aurein Studio)</Li>
            <Li>
              이메일:{" "}
              <a
                href="mailto:aureinstudio@gmail.com"
                className="underline"
                style={{ color: "var(--color-link)" }}
              >
                aureinstudio@gmail.com
              </a>
            </Li>
          </ul>
        </Section>
      </div>

      {/* 푸터 */}
      <div
        className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12px]"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-faint)",
        }}
      >
        <span>© 2026 코리아교육그룹 · keg-book</span>
        <div className="flex gap-4">
          <Link href="/" style={{ color: "var(--color-text-muted)" }}>홈</Link>
          <Link href="/login" style={{ color: "var(--color-text-muted)" }}>로그인</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="mb-3 text-[18px] font-medium"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span style={{ color: "var(--color-text-faint)" }}>·</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2 text-left text-[12px] font-medium"
      style={{ color: "var(--color-text-muted)" }}
    >
      {children}
    </th>
  );
}

function Tr({ name, data, purpose }: { name: string; data: string; purpose: string }) {
  return (
    <tr style={{ borderTop: "1px solid var(--color-border)" }}>
      <td className="px-3 py-2 align-top" style={{ color: "var(--color-text)" }}>
        {name}
      </td>
      <td className="px-3 py-2 align-top">{data}</td>
      <td className="px-3 py-2 align-top">{purpose}</td>
    </tr>
  );
}
