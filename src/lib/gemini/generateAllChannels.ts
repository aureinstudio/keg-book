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
  cardNews?: CardNewsContent;
  /**
   * 채널별 생성 실패 사유. 부분 성공 시 실패 채널만 키로 표시되고
   * 해당 채널은 placeholder 콘텐츠로 채워진다. UI에서 상단 배너로 노출.
   * 모든 채널이 성공하면 이 필드 자체가 없거나 빈 객체.
   */
  _errors?: Partial<
    Record<
      "blogger" | "naver" | "newsletter" | "instagram" | "threads" | "cardNews",
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
  "blogger" | "naver" | "newsletter" | "instagram" | "threads"
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

${NAVER_RULES}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "blogger": {
    "title": "SEO 최적화 블로그 제목 (30~60자)",
    "content_html": "HTML 본문. h2/h3 소제목 포함, 2000자 이상 상세한 교육 정보 콘텐츠. <h2>, <h3>, <p>, <ul>, <li> 태그만 사용.",
    "description": "메타 설명 (100~160자, 핵심 키워드 포함)",
    "labels": ["관련 태그1", "태그2", "태그3 (최대 5개)"]
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
): Promise<Pick<ChannelContent, "newsletter" | "instagram" | "threads">> {
  const ai = new GoogleGenAI({ apiKey: p.apiKey });
  const meta = buildMeta(p);

  const prompt = `다음 키워드와 정보를 바탕으로 교재 마케팅 소셜/뉴스레터 콘텐츠를 생성하세요.

키워드: ${p.keyword}
${meta}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "newsletter": {
    "subject": "이메일 제목 (20~50자, 숫자·혜택 포함)",
    "preheader": "프리헤더 텍스트 (40~90자)",
    "body_html": "뉴스레터 HTML 본문. 인사말, 본문 2~3단락, CTA 버튼 텍스트 포함. <p>, <ul>, <li>, <strong>, <a> 태그만 사용."
  },
  "instagram": {
    "caption": "인스타그램 캡션 (150~300자, 이모지 포함, 해시태그 제외)",
    "hashtags": ["해시태그1", "해시태그2 (# 포함, 10~15개)"]
  },
  "threads": {
    "text": "Threads 글 (100~200자, 이모지 포함, 자연스러운 짧은 글)"
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
  return parsed as Pick<ChannelContent, "newsletter" | "instagram" | "threads">;
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

${NAVER_RULES}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "blogger": { "title": "SEO 블로그 제목", "content_html": "HTML 본문 2000자 이상", "description": "메타 설명 100~160자", "labels": ["태그"] },
  "naver": { "title": "네이버 제목 25~38자 (의문/후기형)", "content_html": "본문 2,200~2,800자, 위 [네이버 본문 작성 규칙] 6가지 준수. 첫 문장 ❓ 의문문, <h2> 5~6개 시간순, ✔ 체크박스 3~4곳, 1인칭 마커 8회+", "description": "요약 50~100자", "tags": ["태그"] },
  "newsletter": { "subject": "이메일 제목", "preheader": "프리헤더", "body_html": "뉴스레터 본문" },
  "instagram": { "caption": "캡션 (이모지 포함)", "hashtags": ["#태그"] },
  "threads": { "text": "Threads 글" }
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

  // shortForm 결과 처리 (newsletter + instagram + threads)
  let shortForm: Pick<ChannelContent, "newsletter" | "instagram" | "threads">;
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
    };
    _errors.newsletter = msg;
    _errors.instagram = msg;
    _errors.threads = msg;
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
