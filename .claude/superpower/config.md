# Superpower 동작 설정 — KEG keg-book

> 참고: `ai-hrms` 등 다른 KEG 레포의 `.claude/superpower/config.md`와 동일한 **역할**(에이전트 검색·산출물 규칙)이며, 이 프로젝트는 **교재 바이럴 마케팅** + **블로그·인스타그램·Threads** 관련 웹앱에 맞춤.

**구현 스택·MVP 경계(Superpower ①):** [`docs/mvp-stack-boundary.md`](../../docs/mvp-stack-boundary.md) — 검색·아티팩트·코드 구조 제안 시 본 config와 충돌하면 **mvp** 문서를 우선한다(제품 비전·제약의 단일 출처는 [`docs/design-auto-posting.md`](../../docs/design-auto-posting.md)).

## 자동 활성화 조건

### 검색 (Web Search)
- 외부 정보 필요 시: 네이버·구글 **개발자 공식 문서**, OAuth 정책, Blogger API 변경, **Buffer GraphQL API** / **Meta 개발자 문서**, **[메일리 개발자 API](https://maily.so/app/guides/dev/dev-api)**, **[Gemini API](https://ai.google.dev/gemini-api/docs)**
- 교육·출판 **공개** 트렌드, 표시광고·교육 광고 일반 가이드(일반 검색; 법률 자문 대체 아님)
- 키워드 트리거: "최신", "현재", "2026", "찾아봐", "검색", "공식"
- 이용약관·자동화 정책 확인이 필요할 때

### 시각 산출물 (Artifacts)
- 포스팅 플로우 다이어그램, OAuth 시퀀스, 큐/스케줄 아키텍처
- UI 와이어프레임 요청 시

## 검색 우선순위

### 네이버 블로그·정책
1. 네이버 개발자 센터 공지·블로그 API 관련 공지
2. 네이버 오픈API 가이드 (현재 제공 범위 확인)
3. 블로그 서비스 이용약관·자동화·스팸 관련 안내

> **전제:** 과거 블로그 **글쓰기 API는 종료**된 바 있음. "공식 API로 자동 발행" 주장이 나오면 반드시 출처 연도·공지로 교차 검증.

### 구글 Blogger
1. [Blogger API v3](https://developers.google.com/blogger/docs/3.0/using) — OAuth 범위 `https://www.googleapis.com/auth/blogger`
2. Google Cloud Console — OAuth 클라이언트·동의 화면
3. `posts.insert` / `posts.publish` 레퍼런스

### Meta (인스타그램·Threads — Buffer 미사용 시)
1. [Meta for Developers](https://developers.facebook.com/) — Graph API, 앱 모드·권한·검수 요건
2. Instagram Content Publishing 등 **공식 가이드**
3. Threads 관련 API·정책은 공지 기준으로만 설계

### Buffer (인스타·Threads 예약·API 연동 시)
1. [Buffer GraphQL API](https://developers.buffer.com/) — 인증, `createPost`, 채널 목록
2. [Buffer — Instagram](https://buffer.com/instagram), [Buffer — Threads](https://buffer.com/threads), [도움말: Threads](https://support.buffer.com/article/857-using-threads-with-buffer)

### 메일리 (뉴스레터)
1. [메일리](https://maily.so/) — 서비스 개요
2. [개발자 API](https://maily.so/app/guides/dev/dev-api) — `https://api.maily.so`, 인증·엔드포인트(로그인 후 상세 확인)
3. [도움말 홈](https://maily.so/app/guides) — 자동 이메일·웹훅·통계 등

### Gemini (카드뉴스 이미지)
1. [Gemini API 문서](https://ai.google.dev/gemini-api/docs) — 인증, 모델, 이미지 생성(해당 시점 지원 범위)
2. [Google AI Studio](https://aistudio.google.com/) — 키 발급·프로토타입(팀 정책에 맞게 사용)

### 블로그 · SEO (검색 품질·온페이지)
1. [SEO 기초 가이드](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [유용한 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
2. [Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article) — JSON-LD 참고 시
3. 프로젝트 스킬: `.claude/skills/blog-seo/SKILL.md`

### 일반
- 위에서 해결되지 않으면 일반 웹 검색

## 산출물 저장 정책

### 아티팩트·채널별보내기
- **루트 `_output/<매체>/`** 에 저장한다. 매체 폴더 의미·파일명 규칙은 **`_output/README.md`**.
- 매체 예: `blogger/`, `naver-blog/`, `newsletter/`, `social-instagram/`, `social-threads/`, `card-news/`, `shared/`.
- 파일명 권장: `{YYYY-MM-DD}_{campaign-slug}_{설명}.{ext}` (날짜는 실제 작업일).

### 다이어그램·정적 산출물 (문서용)
- 사람이 붙이는 설계 이미지·다이어그램은 `docs/assets/` 하위에 둘 수 있다(폴더 없으면 생성). `_output`과 혼동하지 않는다: **`_output` = 파이프라인·캠페인 산출**, **`docs/assets` = 문서 삽입용**.

### 메타데이터
- 캠페인 단위 메모는 `_output/shared/_meta.md` 등 선택 경로에 누적하거나, 팀 규칙에 맞게 조정한다.

## 금지·주의 검색

- 타인 계정·크리덴셜이 포함된 검색
- 코리아교육그룹 **비공개** 내부전략·미공개 실적·개인정보를 검색어·프롬프트에 섞는 행위(외부 유출 위험)
- 약관 위반을 전제로 한 우회 기법 검색(에이전트는 **공식 경로·합법 자동화** 권장)
