# Product & marketing context — keg-book

에이전트·카피라이팅 스킬이 먼저 읽는 **브랜드·제품 맥락**입니다. ([copywriting 스킬](https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting)의 Before Writing 절.)

## 조직·목적

- **조직:** 코리아교육그룹(KEG)
- **비즈니스 목적:** 그룹에서 **출판하는 교재**에 대한 **바이럴·콘텐츠 마케팅** (블로그·**인스타그램**·**Threads** 등으로 노출·신뢰 형성)
- **이 저장소(keg-book)의 역할:** 교재 홍보용 글을 작성·큐잉하고, **네이버 블로그·Google(Blogger)** 발행을 돕고, 동일 원고에서 **인스타그램·Threads용 카피**를 만들며 **Buffer(또는 API)** 로 예약 게시까지 연결할 수 있게 한다. **이메일 뉴스레터**는 **[메일리](https://maily.so/)**([개발자 API](https://maily.so/app/guides/dev/dev-api))와 연동하는 쪽을 전제로 한다. **카드뉴스** 이미지는 **[Gemini API](https://ai.google.dev/gemini-api/docs)** 로 생성하는 전제로 한다(아래 채널 절).

## 제품·오퍼 (초안 — 구체는 팀이 갱신)

- **무엇을 파는가:** 출판 교재(학년·과목·시리즈명은 공개 가능한 범위에서 여기에 기입)
- **차별점:** (예: 커리큘럼 정합성, 학습 설계, 누적 검증 등 — **검증 가능한 표현만**)
- **전환(원하는 행동):** (예: 교재 상세 페이지 방문, 체험 신청 등 — 실제 캠페인에 맞게 수정)

## 타깃 독자

- (예: 학부모, 초·중·고 학생, 입시 준비생, 교사/학원 등)
- 각 세그먼트가 **겪는 문제**·**말하는 표현**(보이스 오브 커스터머)을 나중에 보강

## 톤·원칙

- **신뢰·교육** 톤 우선. 과장 광고체·낚시성 헤드라인 지양.
- **허위·미검증 통계·허구 후기**는 사용하지 않는다. ([SKILL.md 원칙: Honest over sensational](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copywriting/SKILL.md))
- **법적 표현:** 이 파일은 법률 자문이 아니다. 표시광고·교육 관련 규정이 걸리는 문구는 내부 검수·법무 확인 후 사용.

## 채널

- **네이버 블로그**, **Google(Blogger)** — 긴 글·검색 유입. 기술적 제약은 `docs/design-auto-posting.md` 참고.
- **인스타그램·Threads:** 예약·큐잉은 **[Buffer](https://buffer.com/)** 로 자동화 가능(공식 UI 또는 [Buffer GraphQL API](https://developers.buffer.com/) — `createPost` 등). 비즈니스 계정·플랜·채널 연결 전제는 Buffer 도움말을 따른다.
- **뉴스레터(이메일):** Buffer는 **소셜 관리 도구**이며 **구독자 메일 발송 플랫폼이 아니다.** 발송·블로그·통계는 **[메일리](https://maily.so/)**에서 하고, keg-book에서는 원고에서 **HTML·제목**을 만들고 메일리 API로 트리거·연동하는 전제로 한다.
- **카드뉴스(이미지):** 인스타 등용 슬라이드 비주얼은 **Gemini API**로 생성한다. `_template/card-news/`에 스타일·비율·문구 배치 규칙을 두고, 생성물은 **저작권·표시광고·브랜드 가이드** 검수 후 게시한다.

## 금지·주의 (내부 정보)

- **비공개** 내부전략·미공개 실적·개인정보·협상 중 정보는 카피·검색·로그에 넣지 않는다.
- 공개된 교재명·공식 보도·스토어에 올라간 정보 범위에서 캠페인을 설계한다.
