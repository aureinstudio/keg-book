# Project-Specific Guide: keg-book

> **Inherits:** [../CLAUDE.md](../CLAUDE.md) — **S.G.G Integrated Framework** (KEG 루트 마스터 · Claude Code 공식 스펙 2026-05 기준)  
> **Scope:** `./` — 이 저장소 `keg-book/` 루트만. 상위 `../`는 **읽기·수정 금지**(마스터 §4-1).  
> **Stack:** **Next.js(App Router) + TypeScript + Supabase(PostgreSQL)**(발행 큐 `publish_jobs` 테이블, Storage `_output/`) — 결정 근거·MVP 슬라이스는 [`docs/mvp-stack-boundary.md`](docs/mvp-stack-boundary.md). `src/app`·`lib` 구조는 동 문서·`docs/DIRECTORY.md` 참고. Supabase 스키마: [`docs/MIGRATIONS.sql`](docs/MIGRATIONS.sql).

마스터의 **필로소피·모드(A/B/C)·메모리 위계·Git·효율 필터·응답 프로토콜·MCP/훅**을 기본으로 따른다. 상세 표·예시는 **`../CLAUDE.md`를 연다.** 아래는 **keg-book 전용** 보강이다.

---

## S.G.G 요약 (이 파일에서만 빠르게 상기)

| 모드 | 용도 |
|------|------|
| **[A] Expansion** | 설계·아키텍처·복잡 로직 — 구조화 설명·트레이드오프 |
| **[B] Execution** | 구현·빠른 피드백 — 번호 목록·최소 설명 |
| **[C] Gstack** | `/stack`, 「저장」「정리」 — 요약 + `[Stack Meta]` |

**메모리 위계 (Claude Code):** `~/.claude/CLAUDE.md` → **`./CLAUDE.md`(본 파일)** → 하위 `./subdir/CLAUDE.md` → 참고 `CLAUDE.local.md`(.gitignore 권장).

**응답 (마스터 §5):** 본론 우선. 작업 전 한 줄 컨텍스트 예: `Branch: … \| Mode: [B] \| Scope: ./src/…`. 말미 **[Next Actions]** 1~3개. 도구 사용 시 의도 한 줄·파괴적 작업은 확인.

**효율 필터:** `node_modules/`, `dist/`, `build/`, `.next/`, `.gitignore` 항목·바이너리는 분석에서 제외.

---

## 목표 (keg-book)

- **비즈니스:** 코리아교육그룹 **출판 교재**의 **바이럴·콘텐츠 마케팅** 지원.
- **채널:** **Google Blogger**(공식 API), **네이버 블로그**(글쓰기 API 종료 이력 → 보조 UX·HTML 복사 등), **Buffer**([GraphQL API](https://developers.buffer.com/))로 **인스타그램·Threads** 예약, **[메일리](https://maily.so/)**([개발자 API](https://maily.so/app/guides/dev/dev-api))로 **뉴스레터**, **[Gemini API](https://ai.google.dev/gemini-api/docs)**로 **카드뉴스** 이미지.
- **설계 단일 출처:** `docs/design-auto-posting.md`.

---

## 저장소 스냅샷 (스캔 기준)

에이전트가 경로를 헷갈리지 않도록 **현재 실제 존재**하는 구조만 적는다.

```
./
├── .agents/product-marketing-context.md   # 마케팅·교재 맥락 (다른 스킬이 먼저 읽음)
├── .claude/
│   ├── agents/                 # KEG 출판 마케팅 서브에이전트 (keg-*.md)
│   ├── skills/
│   │   ├── blog-seo/           # 블로그 장문·온페이지 SEO (SKILL.md + references/)
│   │   └── marketing-content/  # 멀티채널 브리프·초안 (Claude Code Skills 형식)
│   └── superpower/config.md    # 검색·산출물 규칙
├── .cursor/skills/             # Cursor 에이전트 스킬 (진입: 각 SKILL.md)
│   ├── blog-seo/               # .claude/skills/blog-seo 와 동기화
│   ├── marketing-content/      # .claude/skills/marketing-content 와 동기화
│   ├── copywriting/            # [marketingskills](https://github.com/coreyhaines31/marketingskills)
│   ├── product-marketing-context/
│   ├── social-content/
│   ├── seo-audit/
│   └── schema-markup/
├── package.json              # Next.js 15 · React 19 · Auth.js v5
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example
├── .gitignore                  # _vendor/ 등
├── _output/                    # 채널별 산출물 (규칙: _output/README.md)
│   ├── README.md
│   ├── blogger/
│   ├── naver-blog/
│   ├── newsletter/
│   ├── social-instagram/
│   ├── social-threads/
│   ├── card-news/
│   └── shared/
├── _template/
│   ├── newsletter/maily-story-qa.md   # 메일리 스토리+Q&A MD
│   └── card-news/                     # 카드뉴스 레퍼런스(예: `card_news01.jpg` 등) + `.gitkeep`
├── docs/ (DIRECTORY, DEVELOPMENT, design-auto-posting, mvp-stack-boundary, subagents)
├── public/.gitkeep
├── scripts/.gitkeep
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── maily/
│   │   │       ├── status/route.ts      # 메일리 연결 상태 확인
│   │   │       └── subscribers/route.ts # 구독자 조회·추가
│   │   ├── blogger/actions.ts
│   │   ├── social/page.tsx, SocialWorkbench.tsx, actions.ts
│   │   ├── newsletter/page.tsx, NewsletterWorkbench.tsx
│   │   ├── card-news/page.tsx, CardNewsForm.tsx, actions.ts
│   │   ├── publish-queue/page.tsx, QueueWorkbench.tsx, actions.ts
│   │   ├── actions/saveOutputDraft.ts
│   │   ├── naver/page.tsx, NaverExportPanel.tsx
│   │   ├── AppHeader.tsx
│   │   ├── KegThemeProvider.tsx         # next-themes 래퍼
│   │   ├── ThemeToggle.tsx              # 라이트/다크 토글
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── auth.ts                 # Auth.js v5
│   ├── lib/
│   │   ├── blogger/            # listBlogs, createDraftPost
│   │   ├── buffer/             # GraphQL 클라이언트
│   │   ├── db/                 # Supabase 클라이언트 + 발행 큐 (publishQueue.ts, generations.ts, storage.ts)
│   │   ├── gemini/             # 카드뉴스 이미지
│   │   ├── maily/              # 메일리 API 클라이언트
│   │   ├── newsletter/         # 뉴스레터 HTML
│   │   ├── naver/              # buildNaverExportHtml, escapeHtml
│   │   ├── output/             # _output 쓰기
│   │   ├── social/             # buildSocialPack
│   │   └── marketing/          # 서브에이전트 레지스트리
│   └── types/                  # next-auth.d.ts, css.d.ts
├── tests/                      # vitest 유닛 테스트 (naver export, output sanitize 등)
├── CLAUDE.md
└── README.md
```

**구현 완료(P0~P5):** UI·복사·`_output/` 저장(Supabase Storage + 로컬 fallback)·Buffer(토큰)·Gemini(키)·발행 큐(Supabase `publish_jobs`)·메일리 API 라우트·**인증 미들웨어**(`src/middleware.ts` — 공개 라우트 화이트리스트 외 전부 `auth()` 게이트). 스캐폴딩 변경 시 `docs/DIRECTORY.md`·본 절 갱신.

---

## 문서 인덱스

| 경로 | 용도 |
|------|------|
| `docs/DIRECTORY.md` | 폴더 역할·표 |
| `docs/DEVELOPMENT.md` | Node/Git/OAuth·보안·브랜치 |
| `docs/design-auto-posting.md` | 발행 큐·채널·설정 UI·`_output` 규칙 |
| `docs/mvp-stack-boundary.md` | **Superpower ①** 스택·MVP 경계·외부 API 리스크 요약 |
| `docs/subagents.md` | 서브에이전트 카탈로그·웹앱 연동 요약 |
| `.agents/product-marketing-context.md` | 제품·톤·금지 표현 |
| `.claude/superpower/config.md` | 외부 검색 우선순위 |
| `.claude/agents/` | KEG 출판 마케팅 **서브에이전트** 정의 (`keg-*.md`) |
| `src/lib/marketing/subagents.ts` | 동일 역할의 **머신 레지스트리** (에이전트 id·키워드·`_output/` 경로) |

---

## 환경 변수 (이름만)

`.env.example` 참고: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL`, `AUTH_SECRET`(또는 `NEXTAUTH_*` 호환), `OAUTH_REDIRECT_URI`, `BUFFER_API_ACCESS_TOKEN`, 메일리·Gemini 주석 변수 등. **값은 저장소·로그에 넣지 않는다.**

---

## 코딩 원칙 (keg-book + 마스터 정렬)

- 요청 범위 밖 파일은 수정하지 않는다.
- 토큰·API 키·클라이언트 시크릿은 코드·로그·스크린샷·커밋에 넣지 않는다.
- 네이버 자동화는 약관·계정 리스크를 주석·사용자 문구에 남긴다.
- **Git:** worktree 병렬은 공식 지원; **현재 worktree**만 신뢰. 브랜치 삭제·force-push는 **명시 확인 후**(마스터 §4-2).

---

## MCP · Hooks (프로젝트)

- MCP·Hook 설정은 마스터 §6–7. 팀 공유: `./.claude/settings.json`, 개인: `./.claude/settings.local.json`(.gitignore 권장).  
- **현재:** `settings.json` 미커밋이면 필요 시 생성하고, 승인 MCP는 팀 정책에 맞게 채운다.

---

## Skill routing (gstack 호환)

요청이 스킬과 맞으면 해당 **`SKILL.md`** 워크플로를 쓴다. **역할(서브에이전트) 단위 분기**는 아래 표와 병행해 **Subagent routing** 절을 본다.

| 의도 | 경로 |
|------|------|
| 아이디어·브레인스톰 | office-hours |
| `.agents/product-marketing-context.md` 생성·갱신 | `.cursor/skills/product-marketing-context/SKILL.md` |
| 헤드라인·짧은 CTA·랜딩 문장 | `.cursor/skills/copywriting/SKILL.md` |
| 인스타·Threads·링크드인 등 소셜 | `.cursor/skills/social-content/SKILL.md` |
| 사이트 SEO 진단·감사 | `.cursor/skills/seo-audit/SKILL.md` (작성 초안은 `blog-seo`와 병행) |
| JSON-LD·구조화 데이터 | `.cursor/skills/schema-markup/SKILL.md` |
| 블로그 한 편·목차·메타·FAQ·온페이지 SEO | `.claude/skills/blog-seo/SKILL.md` 또는 `.cursor/skills/blog-seo/SKILL.md` |
| 캠페인 브리프 → 채널별 패키지 | `.claude/skills/marketing-content/SKILL.md` 또는 `.cursor/skills/marketing-content/SKILL.md` |
| 아키텍처 확정 | plan-eng-review |
| 보안 점검 | CSO / security audit |
| UI 설계 계약 | UI phase / design-consultation |

**marketingskills 동기화:** [저장소](https://github.com/coreyhaines31/marketingskills)의 `skills/<이름>/` → `.cursor/skills/<이름>/` 복사, 또는 `npx skills add coreyhaines31/marketingskills --skill <이름>` ([설치](https://github.com/coreyhaines31/marketingskills#installation)).

**프로젝트 전용 스킬:** `blog-seo`·`marketing-content`는 **`.claude/skills/`를 원본**으로 두고 `.cursor/skills/` 본문과 맞춘다.

---

## Subagent routing (KEG 출판 마케팅팀)

Task·서브에이전트·전용 세션을 나눌 때 **의도 → 아래 에이전트**를 우선 매칭한다. 정의 파일은 **`.claude/agents/<파일>`**, 웹앱·API는 **`src/lib/marketing/subagents.ts`** 의 동일 `id` 로 연동한다.

| 사용자 의도 (예) | 서브에이전트 `id` | 정의 파일 | 주 스킬·맥락 | `_output/` 하위 |
|-------------------|-------------------|-----------|---------------|-----------------|
| 한 브리프로 채널 전부·패키지 분해 | `keg-orchestrator` | `keg-orchestrator.md` | `marketing-content`, `product-marketing-context` | `shared/` + 채널별 |
| 블로그 한 편·Blogger·네이버 HTML·SEO | `keg-blog-channel` | `keg-blog-channel.md` | `blog-seo`, (감사 시) `seo-audit` | `blogger/`, `naver-blog/` |
| 인스타·Threads·Buffer 카피 | `keg-social-channel` | `keg-social-channel.md` | `social-content`, `copywriting` | `social-instagram/`, `social-threads/` |
| 메일리·뉴스레터 | `keg-newsletter-channel` | `keg-newsletter-channel.md` | `marketing-content`, `_template/newsletter/` | `newsletter/` |
| 카드뉴스·Gemini·슬라이드 | `keg-cardnews-channel` | `keg-cardnews-channel.md` | `marketing-content`, `_template/card-news/` | `card-news/` |
| 검수·금지·톤·리스크 | `keg-brand-compliance` | `keg-brand-compliance.md` | `.agents/product-marketing-context.md` | `shared/` |
| JSON-LD·리치 결과 | `keg-seo-schema` | `keg-seo-schema.md` | `schema-markup`, `blog-seo`(Article 참고) | `shared/`, (동행 시) `blogger/` |

**규칙:** 서브에이전트는 **스킬을 대체하지 않는다** — 각 `SKILL.md` 워크플로를 로드한 뒤, 위 표로 **역할·산출 경로**만 고정한다. 상세 표는 `docs/subagents.md`.

---

## 마스터 명령 참고 (`../CLAUDE.md` §11)

| 명령·키워드 | 동작 |
|-------------|------|
| `/stack`, 「저장」「정리」 | Gstack 아카이빙 |
| `/mode a` / `/mode b` | Expansion / Execution 강제 |

`/stack` 응답 시 `[Stack Meta]` 블록 형식은 **마스터 §10**을 따른다.
