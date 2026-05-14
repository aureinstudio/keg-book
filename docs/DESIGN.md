# DESIGN.md — keg-book 디자인 시스템

> **Aesthetic**: Editorial-Dashboard — 타이포그래피 중심, 기능적 밀도 유지  
> **Design Tokens Source**: `src/app/globals.css` CSS 변수  
> **Last Updated**: 2026-05-12

---

## 1. 색상 팔레트

### 1-1. 라이트 모드

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-bg` | `#F8FAFC` (slate-50) | 전체 배경 |
| `--color-surface` | `#FFFFFF` | 카드·패널 배경 |
| `--color-surface-2` | `#F1F5F9` (slate-100) | 입력 필드·표 행 배경 |
| `--color-border` | `#E2E8F0` (slate-200) | 일반 테두리 |
| `--color-border-strong` | `#CBD5E1` (slate-300) | 강조 테두리 |
| `--color-text` | `#0F172A` (slate-900) | 본문 텍스트 |
| `--color-text-muted` | `#64748B` (slate-500) | 보조 텍스트·레이블 |
| `--color-text-faint` | `#94A3B8` (slate-400) | 희미한 텍스트·힌트 |
| `--color-accent` | `#2563EB` (indigo-600) | 기본 강조·버튼 |
| `--color-accent-hover` | `#1D4ED8` (indigo-700) | 강조 호버 상태 |
| `--color-accent-light` | `#EFF6FF` (indigo-50) | 강조 배경 틴트 |

### 1-2. 다크 모드

| 토큰 | 값 | 비고 |
|------|-----|------|
| `--color-bg` | `#0D1117` | GitHub-like 다크 |
| `--color-surface` | `#161B22` | 카드 배경 |
| `--color-surface-2` | `#1C2331` | 입력 배경 |
| `--color-border` | `#21262D` | 기본 테두리 |
| `--color-accent` | `#3B82F6` | blue-500 (밝게 조정) |

### 1-3. 사이드바 (라이트·다크 모두 다크 사이드바)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--color-sidebar-bg` | `#0F172A` | `#060C14` |
| `--color-sidebar-text` | `#94A3B8` | `#6E7681` |
| `--color-sidebar-text-active` | `#F1F5F9` | `#E6EDF3` |
| `--color-sidebar-hover` | `#1E293B` | `#161B22` |
| `--color-sidebar-active` | `#1E3A5F` | `#1F3A5F` |

---

## 2. 채널 색상

각 채널은 고유 색상으로 식별됩니다.

| 채널 | 색상 | Hex |
|------|------|-----|
| Blogger | Red | `#EA4335` |
| 네이버 블로그 | Green | `#03C75A` |
| 소셜 (인스타·Threads) | Pink | `#E1306C` |
| 뉴스레터 (메일리) | Violet | `#7C3AED` |
| 발행 큐 | Blue | `#2563EB` |
| 카드뉴스 (Gemini) | Amber | `#D97706` |

---

## 3. 타이포그래피

### 폰트 스택

| 용도 | 폰트 | CDN |
|------|------|-----|
| **본문** | Pretendard Variable | jsdelivr/orioncactus |
| **코드** | JetBrains Mono | Google Fonts |
| **폴백** | System UI → Apple SD Gothic Neo → Noto Sans KR → Malgun Gothic | — |

### 텍스트 스케일

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `text-xs` | 12px | 보조 정보·힌트·레이블 |
| `text-sm` | 14px | 기본 본문·버튼 |
| `text-base` | 16px | 강조 본문 |
| `text-lg` | 18px | 페이지 제목 |
| `font-medium` | 500 | 레이블 |
| `font-semibold` | 600 | 제목·섹션 헤딩 |

---

## 4. 레이아웃

### 4-1. 사이드바 + 메인 구조

```
┌─────────────────────────────────────────────┐
│  Sidebar (w-56, fixed, dark)  │  Main Area  │
│  ─────────────────────────────│─────────────│
│  [K] keg-book                 │  <Page>     │
│                               │             │
│  채널                         │  채널 헤더  │
│  ● B  Blogger         ●       │  콘텐츠 영역│
│  ● N  네이버                  │             │
│  ● S  소셜                    │             │
│  ● M  뉴스레터                │             │
│  ● Q  발행 큐                 │             │
│  ● C  카드뉴스                │             │
│                               │             │
│  [테마 토글]                  │             │
└─────────────────────────────────────────────┘
```

### 4-2. 페이지 내부 구조

모든 채널 페이지는 동일한 헤더 패턴을 사용합니다:

```
[채널 배지] 채널명
           채널 설명 (채널 색상 아이콘 포함)
─────────────────────────── (border-bottom)
콘텐츠 영역 (surface 카드들)
```

### 4-3. 최대 너비

| 레이아웃 | 값 |
|---------|-----|
| 일반 페이지 | `max-w-3xl` (768px) |
| 발행 큐 (테이블) | `max-w-5xl` (1024px) |
| 카드 패딩 | `px-6 py-8` |

---

## 5. 컴포넌트 패턴

### 카드/섹션

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); /* 16px */
  padding: 1.25rem; /* p-5 */
}
```

### 입력 필드

```css
.input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: var(--radius-md); /* 8px */
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### 버튼 (채널 기본)

```tsx
// 채널 기본 버튼
<button style={{ backgroundColor: CHANNEL_COLOR }} className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90">
  액션
</button>

// 보조 버튼
<button style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }} className="rounded-lg px-4 py-2 text-sm">
  보조 액션
</button>
```

### 알림 배너

```tsx
// 성공
{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" }
// 경고
{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }
// 정보
{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF" }
```

---

## 6. 간격 체계

| 토큰 | 값 | 용도 |
|------|----|------|
| `--radius-sm` | 4px | 인라인 코드·태그 |
| `--radius-md` | 8px | 입력·버튼 |
| `--radius-lg` | 12px | 작은 카드 |
| `--radius-xl` | 16px | 메인 카드·섹션 |

---

## 7. 구현 가이드

### CSS 변수 우선 사용

```tsx
// ✅ 권장: CSS 변수 (라이트/다크 자동)
<div style={{ backgroundColor: "var(--color-surface)" }}>

// ❌ 지양: 하드코딩된 Tailwind 색상 (dark: 변형 필요)
<div className="bg-white dark:bg-zinc-900">
```

### 채널 고유 색상은 hex 직접 사용

```tsx
// ✅ 채널 색상은 항상 동일 (모드 무관)
<span style={{ backgroundColor: "#EA4335" }}>B</span>
```

### 접근성

- 모든 아이콘 버튼에 `aria-label` 필수
- 상태 메시지에 `role="status"` 또는 `role="alert"`
- 포커스 링: `focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]`
