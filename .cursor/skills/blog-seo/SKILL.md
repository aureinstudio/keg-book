---
name: blog-seo
description: >-
  Writes and outlines long-form blog posts optimized for search engines (Google
  and Naver-friendly structure): search intent, titles, heading hierarchy, meta
  descriptions, slugs, internal links, FAQ blocks, and readability. Use when the
  user asks for a blog post, 블로그 글, SEO 글, 검색 최적화, Blogger 글, 네이버
  블로그 HTML, 메타 설명, 제목 추천, slug, 목차, H1 H2, featured snippet,
  or educational article for textbook marketing. Complements copywriting for
  sentence polish. Reads `.agents/product-marketing-context.md` when present.
  When saving drafts to disk, use `_output/blogger/` or `_output/naver-blog/` per
  `_output/README.md`.
---

> **형식:** [Claude Code Skills](https://docs.claude.com/en/docs/claude-code/skills) — 플러그인·스크립트 불필요. **원본:** `.claude/skills/blog-seo/` · **Cursor 복제:** `.cursor/skills/blog-seo/` (수정 시 동기화).

# 블로그 글 작성 · SEO (keg-book)

검색엔진과 독자 모두에게 **주제가 명확하고 구조가 읽기 쉬운** 글을 설계·초안한다. 키워드 나열·과장 클릭베이트·미검증 통계는 피한다. 공식 가이드는 [Google 검색 Essentials / SEO 기초](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)와 [검색 중심 콘텐츠에 관한 가이드](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)를 따른다.

**역할 분리:** `blog-seo`는 **한 편의 블로그**에 초점(의도·개요·본문·메타·내부링크·FAQ). `marketing-content`는 **한 브리프에서 채널별 패키지**를 나눌 때. `copywriting`은 **헤드라인·CTA·문장 다듬기**에 가깝다.

## 선행 읽기

1. `.agents/product-marketing-context.md` — 톤·교재·금지 정보
2. `docs/design-auto-posting.md` — Blogger·네이버 채널 전제
3. `_output/README.md` — 블로그 초안·HTML을 남길 매체 경로(`blogger/`, `naver-blog/` 등)

주제 사실이 없으면 `{{확인 필요}}`로 표시한다. 사용자가 파일 저장을 원하면 **`_output/blogger/`**(Markdown 등)·**`_output/naver-blog/`**(붙여넣기 HTML) 등에 `_output/README.md` 명명 규칙으로 쓴다.

## 1) 검색 의도 (Intent)

- **정보형 / 교육형:** 정의·비교·학습 팁·오해 바로잡기 → 본문이 답을 완결한다.
- **탐색형:** 특정 교재·시리즈 소개 → 제품명·근거 가능한 차별만.
- 한 글에 의도를 하나에 수렴시킨다. 상위 개념은 **한 문단 요약** 후 H2로 세분화.

## 2) 키워드 (자연스럽게)

- **주 키워드 1개** + **관련어(동의어·질문형)** 를 H2·소제목·첫 단락에 **자연스럽게** 배치한다. 같은 구절 반복(스터핑) 금지.
- 제목·첫 100~150단어에 주제가 드러나게(독자·크롤러 모두).

## 3) 제목·URL·메타

출력 시 **별도 블록**으로 제시한다.

| 항목 | 규칙 |
| --- | --- |
| **제목 (H1 후보)** | 28~60자(한글 기준 대략) 전후, 숫자·구체 혜택 1개 이내, 과장 금지 |
| **메타 설명** | 120~155자(한글), 검색 결과용 요약, CTA 1구 |
| **슬러그 (영문 URL)** | 소문자·하이픈, 불용어 최소, 3~6단어 권장 |
| **Blogger 라벨** | 3~7개, 넓은 태그보다 **구체 라벨** |

## 4) 본문 구조 (온페이지 SEO)

1. **리드 (2~4문단):** 문제 인식 → 이 글이 주는 답 → 범위
2. **목차:** H2 제목만 리스트 (앵커 링크는 플랫폼 지원 시)
3. **H2:** 큰 질문 단위(각 2~5문단 + 필요 시 H3)
4. **리스트·표:** 비교·단계는 스캔 가능하게
5. **FAQ (선택):** People Also Ask 대비 3~5개 Q&A, 답은 짧고 명확히
6. **내부 링크 자리:** `{{내부: 관련 글 제목}}` 형태로 2~5개 제안
7. **CTA:** 한 가지 주 행동으로 통일

## 5) E-E-A-T (교육·출판 맥락)

- **경험·전문성:** 교재·커리큘럼 주장은 **검증 가능한** 표현만.
- **신뢰:** 날짜·개정 여부·출처(통계·연구) 명시; 없으면 단정 피하기.
- 저자·교정 정보가 있으면 본문 하단에 한 줄(없으면 생략).

## 6) 이미지·미디어 (설명만)

- 각 삽입 위치에 `alt` 텍스트 초안(15~125자 권장, 장식 이미지는 빈 alt 안내).
- 파일명은 의미 있게(영문/로마자) 제안: `{{파일명-제안}}`.

## 7) 네이버 블로그용 HTML 분리 (선택)

동일 주제로 **단순 HTML** 블록을 추가한다: 한 `article`, 의미 있는 `h2`/`h3`, 과도한 `div` 중첩 금지. 인라인 스타일 최소.

## 8) 스니펫·가독성

- **정의 블록:** 용어 첫 등장 시 한 문장 정의 → 정의형 스니펫 후보.
- **단락 길이:** 모바일 기준 3~5문장 이내 선호.
- **굵게:** 한 단락 1~2곳, 키워드만 연속 강조 금지.

## 9) 구조화 데이터 (참고 문구만)

필요 시 사용자가 템플릿에 붙일 **JSON-LD `Article` 초안**을 코드펜스로 제시한다. 필드는 [Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article)에 맞춘다. 실제 삽입은 플랫폼·도메인 확정 후.

## 품질 체크 (출력 전)

- [ ] H1 논리상 1개(제목 후보도 1개로 수렴)
- [ ] 메타 설명이 본문 첫 문단과 중복만 하지 않고 요약인지
- [ ] 표시광고·교육 표현 리스크 문구 없음
- [ ] `product-marketing-context`와 톤 충돌 없음

## 문장 톤만 다듬을 때

`.cursor/skills/copywriting/SKILL.md` 를 병행한다.

## 추가 참고

- [references/on-page.md](references/on-page.md) — 체크리스트·예시 슬러그.
- [references/naver-1st-rank-pattern.md](references/naver-1st-rank-pattern.md) — 네이버 1위 글 실측 패턴(2026.5 기준): 6가지 작성 규칙, 한국어 AI 어휘 블랙리스트, KEG 교재 적용 예시. `NaverExportPanel` SEO 점수 + Claude 프롬프트의 근거 문서.
