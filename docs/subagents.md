# 서브에이전트 (KEG 출판 마케팅)

코리아교육그룹 **출판 교재** 마케팅 워크플로에 맞춘 **역할 분리**입니다.  
Claude Code·Cursor에서는 **Task / 전용 에이전트**로 분기하고, 개발 중인 웹앱에서는 동일 식별자로 **모드 선택·추천·`_output/` 안내**에 씁니다.

## 두 가지 소스 (반드시 동기)

| 소스 | 용도 |
|------|------|
| `.claude/agents/keg-*.md` | 에이전트 `name`·`description`(의도 매칭)·본문 지침 |
| `src/lib/marketing/subagents.ts` | `id`·한글명·키워드·스킬 경로·`_output/` 하위 폴더·UI `uiAccent` |

라우팅 표(요약)는 저장소 루트 **`CLAUDE.md`** → **Subagent routing** 절이 권위이다.

## 에이전트 카드

| `id` | 한글 역할 | 주 `_output/` |
|------|-----------|----------------|
| `keg-orchestrator` | 멀티채널 오케스트레이터 | `shared/` + 채널별 |
| `keg-blog-channel` | 블로그·검색 | `blogger/`, `naver-blog/` |
| `keg-social-channel` | 소셜·Buffer | `social-instagram/`, `social-threads/` |
| `keg-newsletter-channel` | 메일리 | `newsletter/` |
| `keg-cardnews-channel` | 카드뉴스·Gemini | `card-news/` |
| `keg-brand-compliance` | 브랜드·검수 | `shared/` |
| `keg-seo-schema` | 구조화 데이터 | `shared/` (동행 시 `blogger/`) |

## 웹앱 연동 가이드

1. **에이전트 선택 UI:** `MARKETING_SUBAGENTS`를 순회해 라벨·설명·뱃지 색(`uiAccent`)을 표시한다.
2. **프롬프트 기반 추천:** `matchMarketingSubagentsByQuery(userText)`로 상위 N개를 제안한다.
3. **저장 경로:** 선택된 `outputRelativeDirs`를 `_output/<dir>/`와 조합해 다운로드·서버 저장에 사용한다(규칙은 `_output/README.md`).
4. **서버·LLM 라우팅:** API 본문에 `subagentId`를 넣고, 시스템 프롬프트 조합 시 `.claude/agents/<claudeAgentFile>` 내용을 주입할 수 있다(구현 선택).

에이전트 폴더 README: [.claude/agents/README.md](../.claude/agents/README.md).
