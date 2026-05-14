---
name: marketing-content
description: >-
  Plans and drafts multi-channel marketing content for published textbook campaigns
  (blogs, Instagram/Threads via Buffer copy, Maily newsletter Markdown, card-news
  image briefs for Gemini). Use when the user asks for marketing content, 캠페인
  원고, 채널별 카피, 뉴스레터 초안, 카드뉴스 기획, 교재 홍보 글, 소셜 시리즈,
  or one-pager to many-channel adaptation. Reads project context from
  `.agents/product-marketing-context.md`, templates under `_template/`, and
  writes channel drafts under `_output/<medium>/` per `_output/README.md`.
---

> **형식:** [Claude Code Skills](https://docs.claude.com/en/docs/claude-code/skills) — YAML frontmatter + Markdown 본문. 플러그인·npm 의존 없음. **원본은 `.claude/skills/marketing-content/`**; Cursor용 복제는 `.cursor/skills/marketing-content/` — 내용을 바꿀 때는 두 곳을 같이 맞춘다.

# 마케팅 콘텐츠 제작 (keg-book)

교재 바이럴·콘텐츠 마케팅용 **한 원고 → 여러 채널** 산출물을 기획·초안까지 만든다. 코드 실행·외부 API 호출은 이 스킬 범위에 넣지 않는다(텍스트·구조·프롬프트만).

## 선행 읽기 (있으면 생략하지 말 것)

1. `.agents/product-marketing-context.md` — 조직·톤·채널 전제
2. `docs/design-auto-posting.md` — 제품·제약·MVP 범위
3. `_template/newsletter/maily-story-qa.md` — 메일리용 스토리+Q&A Markdown 골격
4. `_output/README.md` — 채널별 산출물 저장 경로(`_output/<매체>/`)

문맥에 없는 사실은 **지어내지 말고** 플레이스홀더(`{{…}}`)로 남긴다.

## 산출물 저장 (`_output/`)

파일로 남길 때는 **`_output/<매체>/`** (예: `blogger/`, `naver-blog/`, `newsletter/`, `social-instagram/`, `social-threads/`, `card-news/`, `shared/`). 템플릿은 `_template/`만, **생성·보내기**는 `_output/`만 쓴다. 규칙은 `_output/README.md`.

## 채널 맵 (이 저장소 전제)

| 채널 | 산출물 역할 | 기본 저장 (`_output/`) |
| --- | --- | --- |
| Google Blogger | 긴 글·태그·(예약) 발행용 본문 | `blogger/` |
| 네이버 블로그 | HTML 복사용 블록 + 수동 체크리스트 문구 | `naver-blog/` |
| 인스타그램·Threads | 캡션·스레드 분할 + Buffer 큐에 넣을 메모(미디어는 별도) | `social-instagram/` · `social-threads/` |
| 메일리 | `_template/newsletter/` 스타일에 맞춘 Markdown | `newsletter/` |
| 카드뉴스 | **Gemini 이미지 생성용** 슬라이드별 프롬프트·구도·문구·금지 요소(실제 API 호출은 구현 코드) | `card-news/` |

## 워크플로

### 1) 브리핑 정리 (10줄 이내)

- 캠페인 한 줄 목표, 핵심 메시지 1~2개, **근거 가능한** 교재·오퍼 사실만
- 타깃 독자·원하는 행동(CTA) 한 가지 우선

### 2) 채널 선택

사용자가 채널을 지정하지 않으면 **기본:** Blogger 요약본 + 네이버 HTML 패널 + 인스타 캡션 + Threads 3~7포스트 + 메일리 1통 + 카드뉴스 4~8슬라이드 브리프.

### 3) 채널별 초안

- **블로그:** 제목 후보 3, H2 개요, 본문, CTA, 메타 설명 155자 내
- **네이버:** `<article>` 친화 단순 HTML, 이미지 자리 표시 설명
- **인스타:** 첫 줄 훅, 본문, 해시태그 5~12개(스팸처럼 보이지 않게)
- **Threads:** 번호 또는 빈 줄로 분리된 짧은 포스트 연쇄
- **메일리:** `maily-story-qa.md`의 `#` / `## Q.` 리듬 유지; YAML 머리말은 메일리에 붙일 때 제거 가능
- **카드뉴스:** 슬라이드마다 `슬라이드 n`, `시각 요소`, `텍스트(있으면)`, `Gemini 프롬프트 (영문 또는 한글)`, `피해야 할 표현`

### 4) 일관성 패스

- 용어·교재명·CTA URL·가격·혜택이 채널 간에 동일한지
- 교육·표시광고상 위험한 단정·미검증 수치 제거

### 5) 넘기기 형식

응답 마지막에 **「다음 액션」** 블록을 둔다: 누가 무엇을 검수하는지, 메일리/Buffer에 붙일 순서.

## 품질 체크리스트 (출력 전 스스로 검토)

- [ ] `product-marketing-context`와 톤·금지 정보 충돌 없음
- [ ] 허위 통계·가짜 후기·내부 비공개 정보 없음
- [ ] CTA가 하나로 수렴하는지
- [ ] 네이버/자동화 리스크 문구가 필요한 곳에 한 줄 고지 포함

## 문장 다듬기

미세 카피·헤드라인만 다듬을 때는 프로젝트 **`.cursor/skills/copywriting/SKILL.md`** 를 병행한다.

## 추가 참고 (선택 로드)

채널별 길이·예시가 더 필요하면 같은 디렉터리의 [references/checklist.md](references/checklist.md)를 연다.
