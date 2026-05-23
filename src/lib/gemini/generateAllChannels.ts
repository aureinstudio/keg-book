import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateCardNewsSlides,
  type CardNewsContent,
} from "./generateCardNewsSlides";

const FLASH_MODEL = "gemini-3-flash-preview";
const CLAUDE_MODEL = "claude-opus-4-5";

export type ChannelContent = {
  blogger: {
    title: string;
    content_html: string;
    description: string;
    labels: string[];
  };
  naver: {
    title: string;
    content_html: string;
    description: string;
    tags: string[];
  };
  newsletter: {
    subject: string;
    preheader: string;
    body_html: string;
  };
  instagram: {
    caption: string;
    hashtags: string[];
  };
  threads: {
    text: string;
  };
  linkedin: {
    /** LinkedIn 단일 포스트 본문 (1,200–1,500자 권장, 첫 줄 = 훅) */
    text: string;
    hashtags: string[];
  };
  cardNews?: CardNewsContent;
  /**
   * 채널별 생성 실패 사유. 부분 성공 시 실패 채널만 키로 표시되고
   * 해당 채널은 placeholder 콘텐츠로 채워진다. UI에서 상단 배너로 노출.
   * 모든 채널이 성공하면 이 필드 자체가 없거나 빈 객체.
   */
  _errors?: Partial<
    Record<
      | "blogger"
      | "naver"
      | "newsletter"
      | "instagram"
      | "threads"
      | "linkedin"
      | "cardNews",
      string
    >
  >;
};

export type GenerateAllChannelsParams = {
  apiKey: string;
  anthropicApiKey?: string;
  keyword: string;
  productName?: string;
  targetAudience?: string;
  context?: string;
  /** 카드뉴스 슬라이드 수 (기본 3, 0이면 생성 안 함) */
  cardNewsCount?: number;
};

const SYSTEM_PROMPT = `당신은 코리아교육그룹(KEG) 교재 마케팅 전문 카피라이터입니다.
신뢰·교육 톤을 유지하며, 과장 광고체나 검증되지 않은 표현은 사용하지 않습니다.
반드시 유효한 JSON만 응답하세요. 마크다운 코드블록(\`\`\`json)을 포함하지 마세요.`;

/**
 * 네이버 본문 작성 규칙 — 2026.3 실측 1위 글(천안웹디자인학원 후기, 비전공자
 * 웹디자이너 취업) 역엔지니어링으로 도출된 6가지 패턴. Claude long-form
 * 프롬프트에 주입해 D.I.A.+ 원문성·C-Rank 가점을 사전 확보한다.
 */
const NAVER_RULES = `[네이버 본문 작성 규칙 — 실측 1위 글 패턴]

1. 첫 문장은 "❓"로 시작하는 검색어 그대로의 의문문.
   예: "❓ {{검색어}} 가능할까요?" / "❓ {{교재명}}, 어떤 점이 다를까요?"
2. 본문 분량 2,200–2,800자 사이 (공백 제외). 3,500자 넘기지 말 것.
3. 소제목(<h2>) 5–6개로 시간 흐름 narrative 구성:
   [배경/계기] → [현장/과정] → [감정 hook] → [디테일/노력] → [결과] → [성찰/조언]
4. 본문 3–4곳에 ✔ 체크박스 리스트 삽입. <ul> 대신 ✔ 이모지 + <br/> 줄바꿈.
   예: "✔ 매일 30분 루틴<br/>✔ 단원 끝나면 노트 정리<br/>✔ 주 1회 받아쓰기"
5. 1인칭 마커 ("저도/제가/저는/느꼈/돌이켜/직접/써본") 최소 8회, 본문 전체에 분산.
   솔직한 후기 톤. 일반론·교과서적 설명 금지.
6. 절대 쓰지 말 것 — 다음 어휘 사용 시 D.I.A.+ 원문성 감점 및 광고성 패널티:
   - 한국어 AI 어휘: "또한, 따라서, 결론적으로, 궁극적으로, 핵심적으로, 뿐만 아니라, 그러므로, 즉,, 한편,"
   - 상업어: "할인, 이벤트, 무료증정, 특가, 최저가, 구매, 쿠폰, 적립"
   - 클릭베이트 단정: "최고, 유일, 필수, 무조건"
   - CTA는 "확인해보셔도 좋을 것 같습니다 :)" 같은 우회·정보 안내형.`;

/**
 * Blogger(Google 검색) 본문 작성 규칙 — Google E-E-A-T(Experience·Expertise·
 * Authoritativeness·Trustworthiness) + Helpful Content System 가이드 기반.
 * 네이버 D.I.A.+ 와 공통 신호(1인칭 경험·구조화·AI 어휘 회피)는 유지하되,
 * 차이점: 메타 description 중요, FAQ 블록(People Also Ask 대비),
 * 정의형 스니펫 후보, 내부/외부 링크 제안, 영문 slug.
 */
const BLOGGER_RULES = `[Blogger(Google 검색) 본문 작성 규칙 — E-E-A-T + Helpful Content]

1. 첫 단락(2~3문장)에서 검색 의도 직답.
   - 첫 문장: 사용자 문제·질문 한 줄로 재진술.
   - 둘째 문장: 이 글이 어떤 답을 주는지 한 문장 요약.
   - 셋째(선택): 누구에게 유용한지 (학년·과목·상황).
2. 본문 분량 1,800–2,500자 (공백 제외). 한 화면에 한 H2 단위가 보일 정도로 단락 분리.
3. 소제목 구조 — 검색 의도에 맞춘 H2 4~6개. 첫 H2는 "정의/요약"형,
   중간은 "방법/단계/비교", 마지막은 "FAQ" 또는 "정리/다음 단계".
4. **FAQ 블록 필수** — 본문 끝에 <h2>자주 묻는 질문</h2> + Q&A 3~5쌍.
   각 답은 50~120자(정의형 스니펫 후보). People Also Ask 대비.
5. 1인칭 경험 + 출처 균형:
   - 1인칭 마커("저는/제가/직접/써본/느낀") 본문에 5~8회 — E-E-A-T의 Experience.
   - 검증 가능한 사실(통계·연구·교과서 페이지)에는 출처 또는 "출처 미상" 표기.
   - 단정 금지: "OOO 교재가 최고" → "제가 써본 범위에서는 OOO 단원이 도움이 됐어요"
6. 정의·핵심 용어는 첫 등장 시 한 문장 정의 (정의형 스니펫 후보).
   예: "수능 듣기는 6월·9월 평가원 모의고사를 기준으로 출제 경향을 분석한다."
7. 메타 설명(description) — 120~155자, 본문 첫 단락 요약 + CTA 1구.
   본문 첫 문장과 동일하게 복사 금지(요약체로 변형).
8. 절대 쓰지 말 것 (Helpful Content 감점):
   - 한국어 AI 어휘: "또한, 따라서, 결론적으로, 궁극적으로, 핵심적으로, 뿐만 아니라, 그러므로"
   - 클릭베이트: "이것만 알면 끝, 100% 보장, 완벽 정복"
   - 키워드 스터핑: 같은 키워드 한 단락 3회 이상
   - 광고성 단정: "최고/유일/필수/무조건"
9. labels(Blogger 태그) 3~5개 — 광범위(\"교육\")보다 구체(\"중1 영어 듣기\") 우선.`;

/**
 * 뉴스레터(메일리) 본문 작성 규칙 — Josh-style Q&A 인터뷰형.
 * 참고: https://maily.so/josh/posts/knrj1pn1rld (5.65K 조회, 2026-05-20)
 * 템플릿: _template/newsletter/maily-story-qa.md
 *
 * 핵심: 단순 정보 전달이 아니라 "스토리·Q&A 구조" 로 끝까지 읽게 만든다.
 */
const NEWSLETTER_RULES = `[뉴스레터(메일리) Josh-style Q&A 작성 규칙]

1. subject (이메일 제목) 20~50자 — 구체 숫자·결과 포함 권장.
   예: "고객 한 명당 월 5,000달러를 받는 1인 AI 사업가" (구체 숫자 + 결과)
2. preheader (인박스 미리보기) 40~90자 — 제목을 보완하는 한 줄 요약,
   제목과 동일 문장 금지(중복 노출 비효율).
3. body_html 분량 1,500~3,000자 (공백 제외). 짧으면 후크 약해지고 길면 이탈.
4. 본문 구조 — 순서대로:
   a) <h2> 한 줄 후크(부제) — '~를 파세요' / '~가 정답이에요' 단언형
   b) <p> 리드 3문단 — 누구의 이야기·왜 지금·독자가 얻을 것
   c) <p><strong>"도입 인용"</strong> ...해설</p>
   d) <hr/>
   e) <h2>1부. 제목</h2> + Q&A 2~4개
   f) <hr/>
   g) <h2>2부. 제목</h2> + Q&A 2~4개
   h) <hr/>
   i) <h3>☕ 본문 중간 CTA</h3> + <p><a>CTA 버튼</a></p>
   j) (선택) <h2>3부. 제목</h2> + Q&A
   k) <hr/>
   l) <h3>푸터 직전 CTA</h3>
5. Q&A 단위 — 매 질문은 <h3>Q. 질문문장</h3> 다음 줄에
   <p><strong>답변 첫 문장 (결론 먼저)</strong> 이어지는 본문.</p>
6. 1인칭 친근체 강제 — "저는·제가·저도" 본문에 6회+. "당사·본 회사" 금지.
7. 구체 수치·시간·금액 1~3회 — 추상어("많이/대부분") 대신 "주 3회·30분".
8. 강조(<strong>) 는 문장 단위로 절제 — 한 Q 당 1~2개. 단어만 굵게 금지.
9. CTA 2개 필수 — 본문 중간 1개 + 푸터 직전 1개. 각각 다른 각도(예: 신청·미리보기).
   CTA 링크 형식: <a href="{{URL}}"><strong>👉 문구</strong></a>
10. 사용 가능 태그 — <h2>, <h3>, <p>, <strong>, <em>, <a>, <ul>, <li>, <ol>,
    <blockquote>, <hr/>. (이미지는 메일리 에디터에서 직접 첨부, body_html 에서 생략)
11. 절대 쓰지 말 것 (스팸·AI 슬롭):
    - "또한, 따라서, 결론적으로, 궁극적으로, 핵심적으로"
    - "할인·100%·무료증정·즉시·지금 바로·이번 기회"
    - 광고성 단정 ("최고·유일·필수")
12. dek(부제, JSON 의 preheader) 와 본문 첫 <h2> 후크는 의미 중복 금지.`;

function buildMeta(p: GenerateAllChannelsParams): string {
  const product = p.productName ? `교재/제품명: ${p.productName}` : "";
  const audience = p.targetAudience ? `타겟 독자: ${p.targetAudience}` : "";
  const extra = p.context ? `추가 맥락: ${p.context}` : "";
  return [product, audience, extra].filter(Boolean).join("\n");
}

function stripCodeBlock(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/**
 * 1회 재시도 가능한 작업 실행기 — Gemini/Claude 호출이 429나 일시 5xx로
 * 깜빡일 때 사용자에게 즉시 실패로 보이지 않게 한 번 더 시도한다.
 * 두 번째 시도는 300ms 백오프 후 한 번만.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (e1) {
    const msg = e1 instanceof Error ? e1.message : String(e1);
    console.warn(`[generate] ${label} 1차 실패, 재시도: ${msg.slice(0, 200)}`);
    await new Promise((r) => setTimeout(r, 300));
    return await fn();
  }
}

// 채널별 placeholder — 부분 실패 시 이 값으로 채운다.
const PLACEHOLDER: Pick<
  ChannelContent,
  "blogger" | "naver" | "newsletter" | "instagram" | "threads" | "linkedin"
> = {
  blogger: {
    title: "(생성 실패)",
    content_html: "<p>이 채널 생성에 실패했습니다. 재시도해 주세요.</p>",
    description: "",
    labels: [],
  },
  naver: {
    title: "(생성 실패)",
    content_html: "<p>이 채널 생성에 실패했습니다. 재시도해 주세요.</p>",
    description: "",
    tags: [],
  },
  newsletter: {
    subject: "(생성 실패)",
    preheader: "",
    body_html: "<p>뉴스레터 생성에 실패했습니다.</p>",
  },
  instagram: { caption: "(생성 실패)", hashtags: [] },
  threads: { text: "(생성 실패)" },
  linkedin: { text: "(생성 실패)", hashtags: [] },
};

// 블로거 + 네이버: Claude (장문 고품질)
async function generateLongForm(
  p: GenerateAllChannelsParams,
): Promise<Pick<ChannelContent, "blogger" | "naver">> {
  const client = new Anthropic({ apiKey: p.anthropicApiKey });
  const meta = buildMeta(p);

  const prompt = `다음 키워드와 정보를 바탕으로 교재 마케팅 블로그 콘텐츠를 생성하세요.

키워드: ${p.keyword}
${meta}

${BLOGGER_RULES}

${NAVER_RULES}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "blogger": {
    "title": "Google SEO 제목 (28~60자, 키워드 앞배치, 숫자/구체 혜택 1개 권장)",
    "content_html": "HTML 본문 1,800~2,500자. 위 [Blogger 본문 작성 규칙] 9가지 준수. 첫 단락 검색 의도 직답 + H2 4~6개 + 본문 끝 <h2>자주 묻는 질문</h2> + Q&A 3~5쌍. <h2>, <h3>, <p>, <ul>, <li>, <strong>, <a> 태그만 사용.",
    "description": "메타 설명 120~155자, 본문 요약 + CTA 1구 (첫 문장 그대로 복사 금지)",
    "labels": ["구체 태그1 (예: 중1 영어 듣기)", "태그2", "태그3 (3~5개)"]
  },
  "naver": {
    "title": "네이버 SEO 제목 (25~38자, 후기/의문형 권장 — 1위 패턴)",
    "content_html": "HTML 본문 2,200~2,800자. 위 [네이버 본문 작성 규칙] 6가지를 반드시 지킬 것. 첫 문장은 ❓ 의문문. <h2> 5~6개로 시간순 narrative. ✔ 체크박스 3~4곳. 1인칭 마커 8회 이상. 이미지 자리는 [이미지: 설명] 텍스트로. <h2>, <h3>, <p>, <strong>, <br>만 사용 (<ul>/<li>는 ✔ 리스트로 대체).",
    "description": "블로그 요약 설명 (50~100자, 첫 문장과 동기화)",
    "tags": ["태그1", "태그2", "태그3", "태그4", "태그5 (5~10개)"]
  }
}`;

  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const parsed = JSON.parse(stripCodeBlock(raw));
  return parsed as Pick<ChannelContent, "blogger" | "naver">;
}

// 소셜 + 뉴스레터: Gemini Flash (속도 우선)
async function generateShortForm(
  p: GenerateAllChannelsParams,
): Promise<
  Pick<ChannelContent, "newsletter" | "instagram" | "threads" | "linkedin">
> {
  const ai = new GoogleGenAI({ apiKey: p.apiKey });
  const meta = buildMeta(p);

  const prompt = `다음 키워드와 정보를 바탕으로 교재 마케팅 소셜/뉴스레터 콘텐츠를 생성하세요.

키워드: ${p.keyword}
${meta}

${NEWSLETTER_RULES}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "newsletter": {
    "subject": "이메일 제목 — 위 규칙 1번 (20~50자, 구체 숫자/결과 포함)",
    "preheader": "프리헤더 — 위 규칙 2번 (40~90자, 제목과 다른 각도)",
    "body_html": "뉴스레터 HTML 본문 — 위 규칙 3~12번을 모두 따를 것. Josh-style Q&A 구조 필수."
  },
  "instagram": {
    "caption": "인스타그램 캡션 (150~300자, 이모지 포함, 해시태그 제외)",
    "hashtags": ["해시태그1", "해시태그2 (# 포함, 10~15개)"]
  },
  "threads": {
    "text": "Threads 글 (100~200자, 이모지 포함, 자연스러운 짧은 글)"
  },
  "linkedin": {
    "text": "LinkedIn 단일 포스트 (1,200~1,500자). 첫 줄은 140자 이내 훅 (\\\"더보기\\\" 컷오프 대응). 단락은 \\\\n\\\\n 두 번 줄바꿈으로 구분. 전문가/교육 톤, 이모지 1~2개만 절제 사용. 본문 마지막에 1줄 우회 CTA.",
    "hashtags": ["해시태그1", "해시태그2 (# 없이 단어만, 3~5개)"]
  }
}`;

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const raw = response.text?.trim() ?? "";
  const parsed = JSON.parse(stripCodeBlock(raw));
  return parsed as Pick<
    ChannelContent,
    "newsletter" | "instagram" | "threads" | "linkedin"
  >;
}

export async function generateAllChannels(
  params: GenerateAllChannelsParams,
): Promise<ChannelContent> {
  const cardNewsCount = params.cardNewsCount ?? 3;
  const _errors: NonNullable<ChannelContent["_errors"]> = {};

  // 카드뉴스는 텍스트 채널과 병렬로 시작 (실패해도 텍스트는 살림)
  const cardNewsPromise: Promise<CardNewsContent | undefined> =
    cardNewsCount > 0
      ? generateCardNewsSlides({
          apiKey: params.apiKey,
          keyword: params.keyword,
          productName: params.productName,
          targetAudience: params.targetAudience,
          context: params.context,
          count: cardNewsCount,
        }).catch((e) => ({
          slides: [],
          error: `카드뉴스 생성 실패: ${e instanceof Error ? e.message : String(e)}`,
        }))
      : Promise.resolve(undefined);

  // ── 분기 1: Anthropic 키 없음 → Gemini 단일 호출
  if (!params.anthropicApiKey) {
    const ai = new GoogleGenAI({ apiKey: params.apiKey });
    const meta = buildMeta(params);
    const prompt = `다음 키워드와 정보를 바탕으로 교재 마케팅 콘텐츠를 채널별로 생성하세요.

키워드: ${params.keyword}
${meta}

${BLOGGER_RULES}

${NAVER_RULES}

${NEWSLETTER_RULES}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "blogger": { "title": "Google SEO 제목 28~60자", "content_html": "본문 1,800~2,500자, 위 [Blogger 본문 작성 규칙] 9가지 준수. 첫 단락 검색 의도 직답 + H2 4~6 + FAQ 블록 필수", "description": "메타 120~155자, 본문 첫 문장과 다른 요약", "labels": ["구체 태그 3~5"] },
  "naver": { "title": "네이버 제목 25~38자 (의문/후기형)", "content_html": "본문 2,200~2,800자, 위 [네이버 본문 작성 규칙] 6가지 준수. 첫 문장 ❓ 의문문, <h2> 5~6개 시간순, ✔ 체크박스 3~4곳, 1인칭 마커 8회+", "description": "요약 50~100자", "tags": ["태그"] },
  "newsletter": { "subject": "20~50자 (구체 숫자 포함)", "preheader": "40~90자 (제목과 다른 각도)", "body_html": "1,500~3,000자, 위 [뉴스레터 규칙] 12가지 준수. Josh-style Q&A 구조 필수 — h2 후크 + 리드 3문단 + Q&A 섹션 + CTA 2개" },
  "instagram": { "caption": "캡션 (이모지 포함)", "hashtags": ["#태그"] },
  "threads": { "text": "Threads 글" },
  "linkedin": { "text": "LinkedIn 포스트 1,200~1,500자, 첫 줄 140자 이내 훅, 단락 사이 \\\\n\\\\n", "hashtags": ["3~5개 단어만 (# 없이)"] }
}`;

    const textPromise = withRetry(async () => {
      const r = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7, maxOutputTokens: 8192 },
      });
      return JSON.parse(stripCodeBlock(r.text?.trim() ?? "")) as ChannelContent;
    }, "Gemini single-call");

    const [textResult, cardNews] = await Promise.allSettled([
      textPromise,
      cardNewsPromise,
    ]);

    let body: ChannelContent;
    if (textResult.status === "fulfilled") {
      body = textResult.value;
    } else {
      const msg =
        textResult.reason instanceof Error
          ? textResult.reason.message
          : String(textResult.reason);
      console.error(`[generate] Gemini 단일 호출 실패: ${msg}`);
      // 5개 채널 전부 placeholder + 동일 사유 기록
      body = { ...PLACEHOLDER } as ChannelContent;
      _errors.blogger = msg;
      _errors.naver = msg;
      _errors.newsletter = msg;
      _errors.instagram = msg;
      _errors.threads = msg;
      _errors.linkedin = msg;
    }

    const cardNewsValue =
      cardNews.status === "fulfilled" ? cardNews.value : undefined;
    if (cardNews.status === "rejected") {
      _errors.cardNews =
        cardNews.reason instanceof Error
          ? cardNews.reason.message
          : String(cardNews.reason);
    } else if (cardNewsValue?.error) {
      _errors.cardNews = cardNewsValue.error;
    }

    return {
      ...body,
      cardNews: cardNewsValue,
      ...(Object.keys(_errors).length ? { _errors } : {}),
    };
  }

  // ── 분기 2: Claude(장문) + Gemini(소셜) + Gemini Image(카드뉴스) 병렬
  const longFormRetry = withRetry(() => generateLongForm(params), "Claude long-form");
  const shortFormRetry = withRetry(() => generateShortForm(params), "Gemini short-form");

  const [longResult, shortResult, cardResult] = await Promise.allSettled([
    longFormRetry,
    shortFormRetry,
    cardNewsPromise,
  ]);

  // longForm 결과 처리 (blogger + naver)
  let longForm: Pick<ChannelContent, "blogger" | "naver">;
  if (longResult.status === "fulfilled") {
    longForm = longResult.value;
  } else {
    const msg =
      longResult.reason instanceof Error
        ? longResult.reason.message
        : String(longResult.reason);
    console.error(`[generate] Claude long-form 실패: ${msg}`);
    longForm = { blogger: PLACEHOLDER.blogger, naver: PLACEHOLDER.naver };
    _errors.blogger = msg;
    _errors.naver = msg;
  }

  // shortForm 결과 처리 (newsletter + instagram + threads + linkedin)
  let shortForm: Pick<
    ChannelContent,
    "newsletter" | "instagram" | "threads" | "linkedin"
  >;
  if (shortResult.status === "fulfilled") {
    shortForm = shortResult.value;
  } else {
    const msg =
      shortResult.reason instanceof Error
        ? shortResult.reason.message
        : String(shortResult.reason);
    console.error(`[generate] Gemini short-form 실패: ${msg}`);
    shortForm = {
      newsletter: PLACEHOLDER.newsletter,
      instagram: PLACEHOLDER.instagram,
      threads: PLACEHOLDER.threads,
      linkedin: PLACEHOLDER.linkedin,
    };
    _errors.newsletter = msg;
    _errors.instagram = msg;
    _errors.threads = msg;
    _errors.linkedin = msg;
  }

  // cardNews 결과 처리
  const cardNewsValue =
    cardResult.status === "fulfilled" ? cardResult.value : undefined;
  if (cardResult.status === "rejected") {
    _errors.cardNews =
      cardResult.reason instanceof Error
        ? cardResult.reason.message
        : String(cardResult.reason);
  } else if (cardNewsValue?.error) {
    _errors.cardNews = cardNewsValue.error;
  }

  return {
    ...longForm,
    ...shortForm,
    cardNews: cardNewsValue,
    ...(Object.keys(_errors).length ? { _errors } : {}),
  };
}
