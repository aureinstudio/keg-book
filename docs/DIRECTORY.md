# 디렉터리 구조

`keg-book` 루트 기준입니다. **앱 스택**은 [mvp-stack-boundary.md](./mvp-stack-boundary.md)에 확정(Next.js App Router + TypeScript). 루트에 `package.json`·`next.config.ts`·`tsconfig.json`이 있다.

```
keg-book/
├── .agents/
│   └── product-marketing-context.md   # 교재·바이럴 마케팅 맥락 (카피 스킬이 먼저 읽음)
├── .cursor/
│   └── skills/
│       ├── copywriting/              # marketingskills — 전환 카피
│       ├── product-marketing-context/  # marketingskills — `.agents/product-marketing-context.md` 워크플로
│       ├── social-content/             # marketingskills — 소셜 포스트
│       ├── seo-audit/                  # marketingskills — SEO 감사
│       ├── schema-markup/              # marketingskills — 구조화 데이터
│       ├── marketing-content/          # 프로젝트 전용 (Claude Code와 동기화)
│       └── blog-seo/                   # 프로젝트 전용 (Claude Code와 동기화)
├── .claude/
│   ├── agents/                # KEG 출판 마케팅 서브에이전트 (keg-*.md)
│   ├── skills/
│   │   ├── marketing-content/ # Claude Code 공식 스킬 (SKILL.md + references/)
│   │   └── blog-seo/          # 블로그·SEO (SKILL.md + references/)
│   └── superpower/
│       └── config.md          # 에이전트 검색·산출물 규칙
├── .env.example               # 환경 변수 템플릿 (비밀 커밋 금지)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── data/                      # 로컬 SQLite (`keg-book.sqlite`, gitignore — `.gitkeep`만 커밋)
├── _output/                   # 채널별 산출물 (규칙: _output/README.md)
│   ├── README.md
│   ├── blogger/
│   ├── naver-blog/
│   ├── newsletter/
│   ├── social-instagram/
│   ├── social-threads/
│   ├── card-news/
│   └── shared/
├── _template/                 # 콘텐츠 템플릿
│   ├── newsletter/
│   │   ├── .gitkeep
│   │   └── maily-story-qa.md    # 메일리 스토리+Q&A 인터뷰형 MD
│   └── card-news/               # 카드뉴스 비율·레퍼런스 이미지 등
│       ├── .gitkeep
│       └── card_news*.jpg       # 예시 에셋(실제 생성은 Gemini API)
├── CLAUDE.md                  # AI·협업 지침·저장소 스냅샷
├── README.md                  # 프로젝트 개요·문서 링크
├── docs/
│   ├── DIRECTORY.md           # 이 파일
│   ├── DEVELOPMENT.md         # 개발 지침서
│   ├── design-auto-posting.md
│   ├── mvp-stack-boundary.md   # 스택·MVP 경계·API 리스크 (Superpower ①)
│   └── subagents.md           # 서브에이전트·웹앱 연동
├── public/                    # 정적 자산 (현재 `.gitkeep`만)
├── scripts/                   # 보조 스크립트 (현재 `.gitkeep`만)
├── src/                       # Next.js 앱 소스
│   ├── app/                   # `AppHeader`, `/`, `/naver`, `/social`, `/newsletter`, `/publish-queue`, `/card-news`, `blogger/`, `actions/`, `api/auth/`, `api/maily/`
│   ├── auth.ts                # Auth.js v5
│   ├── lib/
│   │   ├── blogger/           # `listBlogs.ts`, `createDraftPost.ts` (서버 전용)
│   │   ├── buffer/            # Buffer GraphQL 클라이언트(서버 전용)
│   │   ├── db/                # SQLite `openDb`, `publishQueue`(발행 작업 CRUD)
│   │   ├── maily/             # 메일리 Base URL·구독자 경로 헬퍼(서버 전용)
│   │   ├── gemini/            # 카드뉴스 이미지(`@google/genai`, 서버 전용)
│   │   ├── newsletter/        # 뉴스레터 HTML 빌더(순수 함수)
│   │   ├── naver/             # `escapeHtml`, `buildNaverExportHtml`
│   │   ├── output/            # `_output/` 텍스트 저장 헬퍼
│   │   ├── social/            # 인스타·Threads 카피 빌더(순수 함수)
│   │   └── marketing/         # 서브에이전트 레지스트리 (`subagents.ts`)
│   └── types/                 # `next-auth.d.ts` 등
└── tests/                     # 테스트 (현재 `.gitkeep`만)
```

## 역할 요약

| 경로 | 용도 |
|------|------|
| `src/` | 앱 본체 — `/` Blogger, `/naver`, `/social`, `/newsletter`, `/publish-queue`, `/card-news`, `actions/saveOutputDraft.ts` 등 |
| `data/` | 로컬 SQLite(`keg-book.sqlite`) — DB 파일은 `.gitignore`, `data/.gitkeep`만 커밋 |
| `src/lib/db/` | SQLite `data/keg-book.sqlite` — `publish_jobs` 발행 큐 |
| `src/lib/maily/` | 메일리 API Base·`MAILY_SUBSCRIBERS_PATH` |
| `src/app/api/maily/` | `status`, `subscribers` Route Handlers(Bearer 프록시) |
| `src/app/publish-queue/` | 큐 UI·`enqueueJobAction` / `cancelJobAction` |
| `src/app/actions/saveOutputDraft.ts` | `_output/<매체>/`에 텍스트·HTML 저장(서버 액션) |
| `src/lib/buffer/` | Buffer `channels` 조회, `createPost`(큐) |
| `src/lib/social/` | `buildSocialPack`(인스타·Threads 분할) |
| `src/lib/newsletter/` | `buildNewsletterHtml` |
| `src/lib/gemini/` | 카드뉴스 PNG 생성(`generateCardNewsImage`) |
| `src/lib/output/` | `_output` 경로 쓰기 공통 |
| `src/app/AppHeader.tsx` | 전역 내비(6채널 + 홈) |
| `public/` | 정적 자산 — **현재** `.gitkeep`만 |
| `scripts/` | CLI·시드 등 — **현재** `.gitkeep`만 |
| `tests/` | 자동 테스트 — **현재** `.gitkeep`만 |
| `docs/` | 설계·운영·개발 문서 (`DIRECTORY`, `DEVELOPMENT`, `design-auto-posting`, `mvp-stack-boundary`, `subagents`) |
| `docs/mvp-stack-boundary.md` | Next.js·MVP 슬라이스(P0~P4)·외부 API 리스크 요약 |
| `.claude/agents/` | KEG 출판 마케팅 **서브에이전트** (`keg-*.md`) |
| `src/lib/blogger/` | Blogger API v3 — 목록(`users.self/blogs`), 초안(`posts.insert`+`isDraft`) |
| `src/lib/naver/` | 네이버 붙여넣기용 HTML 빌더(`buildNaverExportHtml` 등), API 호출 없음 |
| `src/app/naver/` | P1 보조 UI — `NaverExportPanel`(복사·미리보기) |
| `src/lib/marketing/` | 웹앱용 동일 역할 레지스트리 (`subagents.ts`) |
| `.claude/skills/marketing-content/` | [Claude Code Skills](https://docs.claude.com/en/docs/claude-code/skills) 형식 — 멀티채널 마케팅 콘텐츠 제작 |
| `.claude/skills/blog-seo/` | 블로그 장문·검색 의도·메타·슬러그·FAQ·온페이지 SEO |
| `.cursor/skills/copywriting/` | [marketingskills](https://github.com/coreyhaines31/marketingskills) — 랜딩·페이지 전환 카피 |
| `.cursor/skills/product-marketing-context/` | 동 upstream — 제품·ICP 컨텍스트 문서 작성·갱신 |
| `.cursor/skills/social-content/` | 동 upstream — 소셜 콘텐츠·캘린더 |
| `.cursor/skills/seo-audit/` | 동 upstream — SEO 점검·이슈 목록 |
| `.cursor/skills/schema-markup/` | 동 upstream — 스키마·리치 결과 |
| `.cursor/skills/marketing-content/` | Cursor에서 동일 스킬 로드용(본문은 `.claude/skills/...`와 동일하게 유지) |
| `.cursor/skills/blog-seo/` | Cursor용 `blog-seo` 동기화 복제본 |
| `_output/` | 생성된 초안·HTML·소셜 문안·뉴스레터·카드뉴스 등 **매체별** 저장 — 하위 폴더·명명은 `_output/README.md` |
| `_template/newsletter/` | 메일리용 `maily-story-qa.md` 등 |
| `_template/card-news/` | 카드뉴스 레퍼런스·비율용 에셋(예: `card_news01.jpg`); 신규 슬라이드는 **Gemini API**로 생성 |

스택은 [mvp-stack-boundary.md](./mvp-stack-boundary.md) 기준 **Next.js App Router**로 진행한다. 구현이 진행되면 `src/lib/blogger/`, `src/lib/buffer/`(Buffer GraphQL), `src/lib/newsletter/`(메일리 API 클라이언트 등), `src/lib/gemini/`(카드뉴스 이미지 생성 등) 등으로 세분화하는 것을 권장한다.
