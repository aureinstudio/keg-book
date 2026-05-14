# keg-book

코리아교육그룹 **출판 교재**를 위한 **바이럴·콘텐츠 마케팅** 웹 애플리케이션 저장소입니다.  
**Blogger**(Google API), **Buffer**(인스타·Threads), **[메일리](https://maily.so/)**(뉴스레터), **[Gemini](https://ai.google.dev/gemini-api/docs)**(카드뉴스 이미지) 등 채널을 한 흐름으로 다루는 것이 목표입니다. 네이버 블로그는 [설계 문서](docs/design-auto-posting.md) 기준으로 보조 UX 위주입니다.

작업 범위는 이 저장소 **루트(`keg-book/`)** 만 사용합니다.

## 로컬 호스트에서 확인

1. Node.js 20+ 설치 후 저장소 루트에서 `npm install`
2. `npm run dev` — 개발 서버가 **항상** [http://127.0.0.1:3000](http://127.0.0.1:3000) 에 뜹니다 (`localhost:3000`으로 접속해도 됩니다).
3. 브라우저로 위 주소를 열면 홈(Blogger 로그인 안내)·상단 메뉴의 네이버·소셜·뉴스레터·발행 큐·카드뉴스 등을 바로 둘러볼 수 있습니다. Google 로그인·Buffer·메일리·Gemini는 `.env`에 키를 넣은 뒤에만 동작합니다.

프로덕션 번들을 로컬에서 띄울 때: `npm run preview`(빌드 후 `next start`) 또는 `npm run build` 다음 `npm run start` — 같은 주소입니다. 자세한 절·OAuth는 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) §7.

## 현재 상태 (요약)

| 항목 | 상태 |
|------|------|
| 앱 소스 `src/` | Next.js — `/`·`/naver`·`/social`·`/newsletter`·`/publish-queue`·`/card-news` + `api/maily/*` + `auth` + `lib/*` + `@google/genai` + `better-sqlite3` |
| 빌드 | `npm run build` 통과(프로덕션 번들) |
| 스택 | **Next.js App Router + TypeScript + SQLite(발행 큐)** — [docs/mvp-stack-boundary.md](docs/mvp-stack-boundary.md) |
| `public/`, `scripts/`, `tests/` | `.gitkeep`만 |
| 문서 | `docs/` + `CLAUDE.md` + `.agents/…` — 스택·MVP 경계는 [mvp-stack-boundary.md](docs/mvp-stack-boundary.md) |
| 템플릿 | `_template/newsletter/`(`maily-story-qa.md`), `_template/card-news/`(레퍼런스 JPG 등) |
| 산출물 | `_output/<매체>/` — Blogger·네이버·뉴스레터·소셜·카드뉴스 등; 규칙은 [_output/README.md](_output/README.md) |
| 환경 변수 템플릿 | `.env.example` (키 이름만, 비밀은 커밋하지 않음) |

상세 트리는 [docs/DIRECTORY.md](docs/DIRECTORY.md)를 본다.

## 문서

| 문서 | 설명 |
|------|------|
| [docs/DIRECTORY.md](docs/DIRECTORY.md) | 디렉터리·역할 표 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 개발 환경·보안·브랜치 |
| [docs/design-auto-posting.md](docs/design-auto-posting.md) | 자동 발행·채널·설계 (제품 단일 출처) |
| [docs/mvp-stack-boundary.md](docs/mvp-stack-boundary.md) | **스택·MVP 슬라이스·API 리스크** (Superpower ① 확정) |
| [docs/subagents.md](docs/subagents.md) | 출판 마케팅 **서브에이전트**·웹앱 연동 |
| [.agents/product-marketing-context.md](.agents/product-marketing-context.md) | 교재·마케팅 맥락 (카피·기획 전제) |
| [CLAUDE.md](CLAUDE.md) | AI/에이전트용 지침·스킬 라우팅·저장소 스냅샷 |

## Cursor · Claude 스킬

- **프로젝트 전용 (keg-book):** `.claude/skills/` 및 동기화된 `.cursor/skills/` — `blog-seo`, `marketing-content` ([Claude Code Skills](https://docs.claude.com/en/docs/claude-code/skills) 형식).
- **upstream [marketingskills](https://github.com/coreyhaines31/marketingskills)** (현재 `.cursor/skills/`에 설치됨): `copywriting`, `product-marketing-context`, `social-content`, `seo-audit`, `schema-markup`.

추가·갱신: 해당 GitHub 저장소의 `skills/<이름>/`를 복사하거나 [설치 가이드](https://github.com/coreyhaines31/marketingskills#installation)의 `npx skills add` 사용.

## Superpower

에이전트 검색·산출물 규칙: [.claude/superpower/config.md](.claude/superpower/config.md). 채널별 파일 저장 위치는 **`_output/`** + [_output/README.md](_output/README.md).

## 빠른 시작

1. `docs/DEVELOPMENT.md` — Node·Git·OAuth 전제 확인.  
2. `.env.example`을 참고해 로컬 `.env`(또는 `.env.local`) 생성. Windows 예:

```powershell
Copy-Item .env.example .env
```

3. `npm install` 후 `npm run dev` — 브라우저에서 **http://127.0.0.1:3000** (또는 `http://localhost:3000`). 상세는 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) §7.

## 라이선스

미정 — 필요 시 추가합니다.
