# DESIGN-REVIEW — 2026-05-23

> **감사 범위**: 전체 페이지 (랜딩·로그인·생성·블로거·네이버·소셜·뉴스레터·카드뉴스·발행 큐·작업기록·에러/404/로딩)
> **제약**: 기존 **모노톤 팔레트 유지** (`#0A0A0A → #FAFAFA` grayscale + `--color-accent` 라이트=검정 / 다크=흰색)
> **방식**: 코드 기반 정적 감사 (브라우저 자동화 도구 미사용)

## TL;DR

- ✅ **`globals.css` 의 모노톤 디자인 시스템은 잘 설계됨** — 13단계 grayscale, light/dark 미러, 채널별 색도 grayscale 로 정의
- ❌ **시스템과 실제 코드의 불일치가 광범위함** — 디자인 토큰을 무시하고 **하드코딩된 컬러 (blue/green/red/purple/pink/amber)** 가 워크벤치 곳곳에 박혀있음
- ⚠ **사용 안 되는 dead component (`AppHeader.tsx`) 가 가장 큰 모노톤 위반의 진원지** — 삭제만 해도 위반 5건 해소
- ⚠ **시맨틱 상태색 (성공=초록·에러=빨강·경고=주황) 을 무지성으로 사용** — 모노톤 제약과 충돌. 명도·아이콘·텍스트 라벨로 대체해야 함

### 최종 점수

| 카테고리 | 등급 | 비고 |
|---|---|---|
| 디자인 시스템 정의 (globals.css) | **A** | grayscale 13단계, dark mode mirror, 토큰 명확 |
| 시스템 준수 (실제 코드) | **D+** | 토큰 무시·하드코딩 다발 |
| 모노톤 제약 준수 | **C** | 12+ 위반 — 워크벤치 CTA·상태색·차트 |
| 타이포그래피 일관성 | **B** | Pretendard 한 종, 스케일은 ad-hoc |
| 위계 (Hero·랜딩) | **A-** | 랜딩페이지는 본보기 |
| 다크모드 | **B+** | 토큰은 정의됐으나 하드코딩 컬러는 다크에서 깨짐 |
| 인터랙션 상태 | **B-** | inline onMouseEnter/Leave 다수, hover utility 미사용 |
| AI 슬롭 | **A-** | 정사각 3-card 그리드 일부 있으나 모노톤이라 슬롭 인상 약함 |
| **종합** | **C+** | "잘 설계된 토큰 + 무지성 하드코딩" 의 전형 |

---

## P0 · 즉시 수정 (모노톤 제약 명백 위반)

### F-01 · `NewsletterWorkbench` 의 보라색 CTA
**파일**: [src/app/newsletter/NewsletterWorkbench.tsx:228](src/app/newsletter/NewsletterWorkbench.tsx#L228)
**문제**: "전체 HTML 복사" 메인 CTA 가 **`#7C3AED` (보라/바이올렛)** 으로 하드코딩됨. AI 슬롭 블랙리스트 1번 패턴 (purple/violet gradient) 에 정확히 해당. 모노톤 제약 정면 위반.

```tsx
// ❌ 현재
style={{ backgroundColor: "#7C3AED" }}

// ✅ 수정안
style={{ backgroundColor: "var(--color-accent)" }}
// 또는 다른 CTA 와 통일하려면:
// style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)" }}
```

### F-02 · `NewsletterWorkbench` 의 파란색 알림
**파일**: [src/app/newsletter/NewsletterWorkbench.tsx:164-165](src/app/newsletter/NewsletterWorkbench.tsx#L164-L165)
**문제**: 저장 성공 토스트가 **`#EFF6FF` 배경 + `#1E40AF` 텍스트 (파란 계열)** — 시맨틱 컬러로 보이지만 모노톤에서 금지.

```tsx
// ❌ 현재
backgroundColor: saveMsg.startsWith("저장:") ? "#EFF6FF" : "#FAFAFA",
color: saveMsg.startsWith("저장:") ? "#1E40AF" : "#404040",

// ✅ 수정안 (성공/실패를 명도와 텍스트로 구분)
backgroundColor: saveMsg.startsWith("저장:") ? "var(--color-surface-3)" : "var(--color-surface-2)",
color: "var(--color-text)",
// 그리고 메시지 앞에 ✓ 또는 ✗ 추가
```

### F-03 · `QueueWorkbench` 의 파란색 CTA + 시맨틱 차트 컬러
**파일**: [src/app/publish-queue/QueueWorkbench.tsx:155, 169-173, 94](src/app/publish-queue/QueueWorkbench.tsx#L155)
**문제 1**: "큐에 넣기" 버튼이 **`#2563EB` (파랑)**.
**문제 2**: 통계 칩이 BLE/RED/GREEN 4색 (대기=파랑 / 처리중=검정 / 완료=초록 #059669 / 실패=빨강 #DC2626).
**문제 3**: 메일리 상태 텍스트가 `#059669` (초록).

```tsx
// ❌ 현재 (Line 155)
style={{ backgroundColor: "#2563EB" }}

// ✅ 수정안
style={{ backgroundColor: "var(--color-accent)" }}

// ❌ 현재 (Line 168-173)
{ label: "대기", value: stats.pending ?? 0, color: "#2563EB" },
{ label: "처리중", value: stats.processing ?? 0, color: "#171717" },
{ label: "완료", value: stats.done ?? 0, color: "#059669" },
{ label: "실패", value: stats.failed ?? 0, color: "#DC2626" },
{ label: "취소", value: stats.cancelled ?? 0, color: "var(--color-text-faint)" },
{ label: "전체", value: stats.total ?? 0, color: "var(--color-text-muted)" },

// ✅ 수정안: 명도·기호로 의미 전달 (모노톤 stat 디자인의 정석)
{ label: "● 대기",    value: stats.pending ?? 0,    color: "var(--color-text-muted)" },
{ label: "◐ 처리중",  value: stats.processing ?? 0, color: "var(--color-text)" },        // 가장 진함
{ label: "✓ 완료",    value: stats.done ?? 0,       color: "var(--color-text)" },
{ label: "✗ 실패",    value: stats.failed ?? 0,     color: "var(--color-text-muted)" },
{ label: "◌ 취소",    value: stats.cancelled ?? 0,  color: "var(--color-text-faint)" },
{ label: "Σ 전체",    value: stats.total ?? 0,      color: "var(--color-text)" },
// 실패만 텍스트 weight 를 bold 로 처리하여 시선 끌기 가능

// ❌ 현재 (Line 94)
<span style={{ color: "#059669" }}>MAILY_API_KEY 설정됨</span>

// ✅ 수정안
<span style={{ color: "var(--color-text)" }}>● MAILY_API_KEY 설정됨</span>
```

### F-04 · `NaverExportPanel` 의 SEO 점수 색상 (traffic-light)
**파일**: [src/app/naver/NaverExportPanel.tsx:167-170, 348](src/app/naver/NaverExportPanel.tsx#L167-L170)
**문제**: SEO 점수 배지가 **녹색(`#15803d`) / 회색 / 황색(`#a16207`) / 적색(`#991b1b`)** 4-tier traffic-light. 점수가 명확한 신호긴 하지만 모노톤 위반.

```tsx
// ❌ 현재
const scoreTier =
  seoScore >= 85 ? { label: "1위 후보", color: "#15803d" }
  : seoScore >= 65 ? { label: "상위권", color: "#525252" }
  : seoScore >= 40 ? { label: "보완 필요", color: "#a16207" }
  : { label: "재작성 권장", color: "#991b1b" };

// ✅ 수정안 — 점수 자체는 명도로 표현, label 로 의미 전달
const scoreTier =
  seoScore >= 85 ? { label: "★ 1위 후보",   color: "var(--color-text)" }
  : seoScore >= 65 ? { label: "● 상위권",     color: "var(--color-text)" }
  : seoScore >= 40 ? { label: "◐ 보완 필요",  color: "var(--color-text-muted)" }
  :                  { label: "○ 재작성 권장", color: "var(--color-text-faint)" };
// 배경 fill 패턴이나 두께(border-width) 로 추가 구분 가능
```

**추가**: Line 348 `color: "#059669"` (복사 성공 toast) → `var(--color-text)` + `✓` 기호 prefix.

### F-05 · `NaverExportPanel` 의 미리보기 영역 파란 링크
**파일**: [src/app/naver/NaverExportPanel.tsx:388](src/app/naver/NaverExportPanel.tsx#L388)
**문제**: 본문 렌더 미리보기에서 `[&_a]:text-sky-600` — Tailwind sky-600 (파랑).

```tsx
// ❌ 현재
className="rounded-lg p-4 [&_a]:text-sky-600 [&_a]:underline ..."

// ✅ 수정안
className="rounded-lg p-4 [&_a]:underline [&_a]:underline-offset-2 ..."
// 색은 var(--color-text-muted) 가 부모에서 상속, underline 만 시각 단서로
// 또는 명시: [&_a]:text-[color:var(--color-text-muted)]
```

### F-06 · `SocialWorkbench` 의 채널 브랜드 컬러 하드코딩
**파일**: [src/app/social/SocialWorkbench.tsx](src/app/social/SocialWorkbench.tsx) (이전 세션에서 읽음)
**문제**:
- Threads 아이콘 배지 `backgroundColor: "#E6702A"` (오렌지) — `Line ~404`
- LinkedIn 아이콘 배지 `backgroundColor: "#0A66C2"` (파랑) — `Line ~471`
- LinkedIn 복사 버튼 `backgroundColor: "#0A66C2"` — `Line ~509`

```tsx
// ✅ 수정안 — 모노톤 grayscale 단계로 구분 (이미 globals.css 에 정의됨)
// Instagram: var(--color-text) 또는 #0A0A0A
// Threads:   #404040 또는 var(--color-text-muted)
// LinkedIn:  #525252 또는 var(--color-text-muted)
// 사이드바의 그레이 톤 매핑과 동일하게 일관 유지
```

### F-07 · `AppSidebar` 의 sub-channel 브랜드 컬러
**파일**: [src/app/AppSidebar.tsx:52-55](src/app/AppSidebar.tsx#L52-L55)
**문제**: `/social` 펼쳤을 때 sub-children 아이콘 색이 **Instagram `#E1306C` (마젠타), LinkedIn `#0A66C2` (파랑)** 으로 하드코딩.

```tsx
// ❌ 현재
children: [
  { href: "/social#instagram", label: "Instagram", icon: "I",  color: "#E1306C" },
  { href: "/social#threads",   label: "Threads",   icon: "T",  color: "#000000" },
  { href: "/social#linkedin",  label: "LinkedIn",  icon: "in", color: "#0A66C2" },
],

// ✅ 수정안
children: [
  { href: "/social#instagram", label: "Instagram", icon: "I",  color: "#0A0A0A" },
  { href: "/social#threads",   label: "Threads",   icon: "T",  color: "#404040" },
  { href: "/social#linkedin",  label: "LinkedIn",  icon: "in", color: "#525252" },
],
```

---

## P1 · 중요 (시스템 일관성)

### F-08 · `AppHeader.tsx` 는 dead code + 모노톤 위반 진원지
**파일**: [src/app/AppHeader.tsx](src/app/AppHeader.tsx)
**문제**: 이 컴포넌트는 **`layout.tsx` 에서 import 되지 않음** — 실제 렌더되지 않는 dead code. 그런데 안에는 `text-pink-600`, `text-violet-700`, `text-sky-700`, `text-amber-700` 등 **모노톤 위반 색상 4종** + `text-zinc-*` Tailwind 팔레트 직접 사용.

```bash
# ✅ 수정안: 통째로 삭제
git rm src/app/AppHeader.tsx
```

미사용 임포트가 다른 곳에 없는지 확인 (`grep -r "AppHeader" src/`) 후 제거.

### F-09 · `not-found.tsx` 가 디자인 토큰 무시
**파일**: [src/app/not-found.tsx](src/app/not-found.tsx)
**문제**: `text-zinc-500`, `text-zinc-900`, `bg-white`, `border-zinc-300` 등 Tailwind 기본 zinc 팔레트 직접 사용. `globals.css` 의 `--color-*` 토큰 무시.

```tsx
// ✅ 수정안 — design tokens 사용
<main className="mx-auto max-w-lg px-4 py-16">
  <p className="text-sm font-medium" style={{ color: "var(--color-text-faint)" }}>404</p>
  <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
    페이지를 찾을 수 없습니다
  </h1>
  <p className="mt-2" style={{ color: "var(--color-text-muted)" }}>
    주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
  </p>
  <Link
    href="/"
    className="mt-8 inline-flex rounded-lg px-4 py-2 text-sm font-medium transition-colors"
    style={{
      border: "1px solid var(--color-border-strong)",
      backgroundColor: "var(--color-surface)",
      color: "var(--color-text)",
    }}
  >
    홈으로
  </Link>
</main>
```

### F-10 · `error.tsx` 의 하드코딩된 버튼 컬러
**파일**: [src/app/error.tsx:43](src/app/error.tsx#L43)
**문제**: "다시 시도" 버튼이 `#525252` 하드코딩. 모노톤이긴 하나 디자인 시스템 우회.

```tsx
// ❌ 현재
style={{ backgroundColor: "#525252" }}

// ✅ 수정안
style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-on)" }}
```

### F-11 · `GenerateWorkbench` 의 에러·경고 색상
**파일**: [src/app/generate/GenerateWorkbench.tsx:277, 738, 754-770](src/app/generate/GenerateWorkbench.tsx)
**문제**:
- Line 277: 카드뉴스 에러 메시지 `color: "#c47800"` (앰버)
- Line 738-739: 생성 실패 에러 `color: "#c62828"` (적색)
- Line 754-770: 부분 실패 경고 `rgba(180,140,40,...)`·`#7a5a10`·`#6a4a00` (앰버/갈색)

```tsx
// ✅ 수정안: 모노톤 surface + 아이콘으로 의미 전달
// 에러 (red 대체):
backgroundColor: "var(--color-surface-3)",
border: "1px solid var(--color-border-strong)",
color: "var(--color-text)",
// + "✗ " 또는 "⚠ " prefix

// 경고 (amber 대체):
backgroundColor: "var(--color-surface-2)",
border: "1px solid var(--color-border-strong)",
color: "var(--color-text-muted)",
// + "⚠ " prefix
```

### F-12 · `page.tsx` 솔루션 카드의 hover 상태 부재
**파일**: [src/app/page.tsx:294-341](src/app/page.tsx)
**문제**: 랜딩의 6개 솔루션 카드는 `transition-all` 만 있고 `hover:` 상태 정의 없음 — 클릭 가능 신호가 약함 (Don't make me think 위반).

```tsx
// ✅ 수정안: hover 시 elevation + border 강조
<Link
  className="group rounded-2xl p-5 transition-all hover:shadow-md"
  style={{
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = "var(--color-border-strong)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = "var(--color-border)";
  }}
>
// 또는 CSS class 로 .solution-card:hover { box-shadow: var(--shadow-2); border-color: ... }
```

---

## P2 · 폴리시 (개선하면 좋음)

### F-13 · inline event handler 남발
**파일**: [src/app/AppSidebar.tsx:137-148, 193-204](src/app/AppSidebar.tsx#L137-L148), [src/app/ThemeToggle.tsx:32-43](src/app/ThemeToggle.tsx#L32-L43)
**문제**: hover 처리를 `onMouseEnter` / `onMouseLeave` JS 핸들러로 함. 매 nav item·테마 버튼 등 N개 항목에 동일한 JS 콜백이 붙음.
**개선**: CSS `:hover` pseudo-class 로 대체 — 토큰 기반 `var(--color-sidebar-hover)` 가 이미 정의돼 있어서 어렵지 않음. 단, inline `style` 와 `:hover` 의 specificity 충돌 해결 필요 (별도 CSS class 또는 `data-active` attribute 기반).

### F-14 · 본문 폰트 사이즈 14px 베이스
**파일**: [src/app/globals.css:134](src/app/globals.css#L134)
**문제**: `font-size: 14px` body 베이스. 디자인 시스템 검사 기본값은 16px. 한국어 환경에서 14px 가 흔하긴 하나, 사이드바의 12-13px·라벨의 10-11px 까지 동시에 작아짐 — 모바일 가독성 우려.

**결정**: 이건 의도된 컴팩트 디자인일 수 있음 (워크벤치 UX). 변경 권장은 하지 않음. **다만 모바일 e2e 테스트 시 가독성 체크 권장**.

### F-15 · 채널 grayscale 컬러의 시각적 식별성
**파일**: [src/app/globals.css:46-51](src/app/globals.css#L46-L51)
**문제**:
```css
--color-blogger:    #171717;
--color-naver:      #262626;
--color-newsletter: #525252;
--color-social:     #404040;
--color-queue:      #0A0A0A;
--color-cardnews:   #737373;
```
6개 채널 명도 차이가 너무 작아 (특히 `#171717` vs `#262626` vs `#262626` 의 newsletter 와 naver 가 동일 `#525252` 등) **작은 아이콘 (18x18px) 에서는 사실상 구분 불가**.

**결정**: 모노톤 유지 제약상 색으로 구분은 어차피 한계. 대신:
- 각 채널 아이콘의 글자 (B/N/M/S/C/Q) 가 이미 식별자 역할
- 명도 차이를 6단계로 더 벌리거나 (#0A → #1F → #33 → #4D → #66 → #80)
- 또는 채널별로 형태 차이 (border-radius, 모양) 를 줘서 식별
**우선순위 낮음** — 텍스트 라벨이 옆에 있으면 기능적으로 OK.

### F-16 · 첫 nav 아이콘 컬러 토큰 이탈
**파일**: [src/app/AppSidebar.tsx:37, 64](src/app/AppSidebar.tsx#L37)
**문제**: 홈·작업기록 아이콘 색 `#5F6368` — Google 표준 그레이 한 톤. globals.css 의 어떤 토큰과도 매치 안 됨. 모노톤 위반은 아니나 **시스템 외 값**.

**수정안**: `#525252` (var(--color-text-muted)) 로 통일.

### F-17 · 상태 dot indicator 색 부족
**파일**: [src/app/social/SocialWorkbench.tsx:24, etc.], [src/app/newsletter/NewsletterWorkbench.tsx:30](src/app/newsletter/NewsletterWorkbench.tsx#L30)
**문제**: SEO check Dot 가 `#404040` (OK) / `#737373` (FAIL) — 명도 차이가 너무 작아 색맹·노년·고대비 환경에서 구분 어려움. 모노톤 제약상 색은 못 바꿔도 형태/체크마크로 보강 가능.

```tsx
// ✅ 수정안
<span aria-label={ok ? "충족" : "미충족"} className="...">
  {ok ? "●" : "○"}
</span>
// 또는 SVG 체크/원 두 형태로
```

### F-18 · 사용자 아바타 fallback initial gradient
**파일**: [src/app/UserBadge.tsx:45](src/app/UserBadge.tsx#L45)
**문제**: 없음 — 모노톤 gradient (검정→그레이) 잘 적용됨. ✅
**확인만**.

### F-19 · `cursor: pointer` 누락 가능성
모든 Link / button 컴포넌트는 next/link 또는 `<button>` 사용 → 브라우저 기본 `cursor: pointer` 들어감. 별도 처리 불필요. ✅

### F-20 · `prefers-reduced-motion` 부분 적용
**파일**: [src/app/globals.css:119-121](src/app/globals.css#L119)
**현황**: `scroll-behavior: auto` 만 처리됨. 다른 transition (페이드·스피너·hover) 은 무시됨.
**개선** (선택):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## P3 · 정보 (참고)

- **랜딩 페이지 [src/app/page.tsx](src/app/page.tsx) 는 모노톤 디자인의 모범 사례.** Hero gradient, 솔루션 카드, CTA band 모두 토큰 사용 + AI 슬롭 패턴 회피 (3-card grid 가 있지만 sub-text 길이 가변 + role 차이로 슬롭 인상 안 줌). 이를 다른 워크벤치 페이지의 reference 로 사용 권장.
- **`globals.css` 의 `gemini-gradient` 유틸리티는 이미 모노톤** — 기존 보라/파란 그라데이션 슬롭 패턴 회피한 흔적. 잘 만들어둠.
- **다크모드 mirror 가 의외로 정확함** — 토큰 기반 코드는 다크에서도 정상 동작. 단, **하드코딩 컬러 (#7C3AED, #2563EB 등) 는 다크에서 채도가 너무 진해 보임** — 이번 P0 수정으로 자동 해결됨.
- **아이콘 시스템 없음** — 모든 채널 아이콘이 single character (B/N/M/S/C/Q) text. ✅ 모노톤 일관성 측면에서 오히려 깔끔. 변경 권장 안 함.

---

## 수정 우선순위 요약

```
[P0] 모노톤 명백 위반 — 7개  (반드시 수정)
  F-01  NewsletterWorkbench 보라 CTA #7C3AED
  F-02  NewsletterWorkbench 파란 toast #1E40AF
  F-03  QueueWorkbench 파랑/녹/적 차트 + #2563EB CTA
  F-04  NaverExportPanel 점수 traffic-light
  F-05  NaverExportPanel sky-600 본문 링크
  F-06  SocialWorkbench Threads 오렌지 / LinkedIn 파랑
  F-07  AppSidebar sub-channel 브랜드 컬러

[P1] 시스템 일관성 — 5개  (수정 권장)
  F-08  AppHeader.tsx 통째 삭제 (dead code + 위반 다발)
  F-09  not-found.tsx 토큰화
  F-10  error.tsx 토큰화
  F-11  GenerateWorkbench 에러/경고 톤
  F-12  랜딩 솔루션 카드 hover 상태

[P2] 폴리시 — 8개  (시간 있으면)
  F-13  inline hover handler → CSS :hover
  F-14  본문 14px → 16px (보류 권장)
  F-15  채널 grayscale 식별성 개선
  F-16  AppSidebar 홈 아이콘 #5F6368 → token
  F-17  Dot indicator 형태 보강
  F-18  ✅ OK (검토 완료)
  F-19  ✅ OK
  F-20  prefers-reduced-motion 확장

[P3] 정보 — 4개  (수정 불필요)
```

## 추정 작업량 (CSS 위주 변경, 모노톤 제약 내)

- P0 전부 수정 + atomic commit: **~30분, 7 commit**
- P0 + P1 전부: **~60분, 12 commit**
- 전부 (P2 포함): **~2시간**

## 다음 단계

너의 선택:
1. **P0 만 자동 수정** → 7개 atomic commit 으로 모노톤 위반만 즉시 제거
2. **P0 + P1 자동 수정** → 12개 commit, 시스템 정합성까지 잡힘
3. **항목 골라서 수정** → "F-01, F-03, F-08 만" 같이 지정
4. **수정은 너가 직접** → 보고만 받고 끝
