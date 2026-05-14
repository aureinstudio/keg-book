# 개발 지침서

`keg-book` 웹 애플리케이션을 로컬에서 안전하게 개발하기 위한 규칙입니다.

## 1. 사전 요구

- **Node.js**: LTS 권장 (버전은 스택 확정 후 `package.json`의 `engines`에 기록).
- **Git**: 커밋 메시지는 무엇을·왜 바꿨는지 한 문장 이상으로 쓴다.
- **Google Cloud**: Blogger API 사용 시 OAuth 클라이언트·동의 화면·리다이렉트 URI 사전 등록.

## 2. 환경 변수

1. `.env.example`을 참고해 로컬에 `.env` 또는 `.env.local`을 만든다.
2. **절대** `.env*` 파일에 실제 시크릿을 넣은 채로 커밋하지 않는다.
3. 팀 공유는 비밀 관리 도구(1Password, Doppler, 클라우드 시크릿 매니저 등)로 하고, 저장소에는 키 이름만 문서화한다.

필요한 변수 예시는 `.env.example`을 본다.

## 3. 브랜치·커밋

- `main`(또는 `master`): 배포 가능 상태를 유지하는 것을 목표로 한다.
- 기능 단위: `feature/짧은-설명`, 수정: `fix/이슈-요약`.
- PR 전에 로컬에서 린트·테스트를 실행한다 (스크립트는 `package.json` 확정 후 이 문서에 링크).

## 4. 보안

- OAuth **access/refresh token**은 서버 메모리·암호화 저장소에만 둔다. 클라이언트 번들에 넣지 않는다.
- **Buffer·메일리(Maily)·Gemini** API 키도 동일하게 취급한다.
- 로그에 본문 전체·Authorization 헤더·쿼리에 포함된 토큰을 남기지 않는다.
- 외부 입력(마크다운·HTML)은 저장·렌더 전 XSS·SSRF 관점에서 검토한다.
- **설정 UI**에 API·계정 값을 넣는 경우: 저장은 **서버 측**만, 화면에는 **마스킹**·연결 상태·재연결·테스트 호출로 검증한다. 브라우저 `localStorage`에 시크릿·리프레시 토큰만 두는 방식은 사용하지 않는다. 상세는 `docs/design-auto-posting.md`의「설정 UI」절을 본다.

## 5. 외부 서비스 정책

- **Blogger**: [공식 API](https://developers.google.com/blogger/docs/3.0/using) 범위 내에서만 호출한다.
- **메일리(뉴스레터):** [개발자 API 안내](https://maily.so/app/guides/dev/dev-api)를 따른다. 키는 서버 비밀로만 보관하고, 요청 제한·플랜별 기능(웹훅 등)은 메일리 도움말 기준으로 확인한다.
- **Gemini(카드뉴스 이미지):** [Gemini API 문서](https://ai.google.dev/gemini-api/docs)를 따른다. 키는 서버 비밀만 사용하고, **클라이언트 번들·브라우저에서 직접 호출하지 않는다.** 생성 프롬프트·응답 이미지 URL은 로그에 과도하게 남기지 않는다.

## 6. 디렉터리 규칙

- 앱 코드는 기본적으로 `src/` 아래에만 둔다.
- **발행 큐 DB:** `data/keg-book.sqlite`(및 WAL/SHM)는 로컬 전용이며 `.gitignore`에 포함된다. Vercel 등 서버리스에서는 파일 DB가 유지되지 않을 수 있으므로, 배포 시에는 Postgres 등 외부 DB로 교체하는 것을 권장한다.
- 문서만 추가하는 변경은 `docs/`로 한정한다.
- 대용량 바이너리·개인 메모는 저장소에 넣지 않는다.

## 7. 실행 (로컬 호스트)

개발 서버는 **`127.0.0.1:3000`** 에 고정한다(`package.json`의 `npm run dev`). 브라우저에서는 아래 중 편한 주소로 연다.

- **권장:** [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **동일 호스트:** [http://localhost:3000](http://localhost:3000)

```bash
npm install
npm run dev
```

터미널에 `Local: http://127.0.0.1:3000` 이 표시되면 준비 완료다. **`.env` 없이도** 앱은 기동되며, 네이버·소셜·뉴스레터·발행 큐·카드뉴스(프롬프트 저장) 등은 대부분 둘러볼 수 있다.

**Auth.js `AUTH_SECRET`:** `.env`에 비어 있으면 코드에 정의된 **개발용 기본 시크릿**으로 채워져 `MissingSecret`·**500 Internal Server Error**를 피한다(`npm run dev` / `npm run start` 공통). **공개 배포·팀 운영**에서는 반드시 `openssl rand -base64 32` 등으로 `AUTH_SECRET`을 넣는다. 비어 있는 채로 두면 서버 로그에 경고가 남는다.

**Blogger(P0) / Google 로그인:** `.env`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `AUTH_URL`(또는 `NEXTAUTH_URL`, 예: `http://127.0.0.1:3000`)을 채운다. Google Cloud OAuth **승인된 자바스크립트 출처**에 `http://127.0.0.1:3000`과 `http://localhost:3000`을, **승인된 리디렉션 URI**에 `http://127.0.0.1:3000/api/auth/callback/google` 및 `http://localhost:3000/api/auth/callback/google`을 등록하는 것을 권장한다.

**네이버 보조 패널(P1):** [/naver](http://127.0.0.1:3000/naver) — OAuth·`.env` 없이 HTML 미리보기·복사·체크리스트만 사용할 수 있다(공식 자동 발행 없음).

**소셜·뉴스레터·발행 큐·카드뉴스:** [/social](http://127.0.0.1:3000/social), [/newsletter](http://127.0.0.1:3000/newsletter), [/publish-queue](http://127.0.0.1:3000/publish-queue), [/card-news](http://127.0.0.1:3000/card-news) — 기본은 복사·`_output/` 저장·SQLite 큐만. Buffer 큐는 `BUFFER_API_ACCESS_TOKEN`, 카드뉴스 PNG는 `GEMINI_API_KEY`, 메일리 프록시는 `MAILY_API_KEY`가 있을 때 서버에서 호출한다.

**프로덕션 모드 로컬 확인:** `npm run preview`(빌드+`next start` 한 번에) 또는 `npm run build` 후 `npm run start` — 동일하게 **http://127.0.0.1:3000** 에 바인드된다.

## 8. 관련 문서

- [DIRECTORY.md](./DIRECTORY.md) — 폴더 맵
- [design-auto-posting.md](./design-auto-posting.md) — 제품 전제·MVP 방향
- [**mvp-stack-boundary.md**](./mvp-stack-boundary.md) — 스택·MVP 경계·외부 API 리스크 (구현 착수 전 필독)
