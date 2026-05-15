import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

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
};

export type GenerateAllChannelsParams = {
  apiKey: string;
  anthropicApiKey?: string;
  keyword: string;
  productName?: string;
  targetAudience?: string;
  context?: string;
};

const SYSTEM_PROMPT = `당신은 코리아교육그룹(KEG) 교재 마케팅 전문 카피라이터입니다.
신뢰·교육 톤을 유지하며, 과장 광고체나 검증되지 않은 표현은 사용하지 않습니다.
반드시 유효한 JSON만 응답하세요. 마크다운 코드블록(\`\`\`json)을 포함하지 마세요.`;

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

// 블로거 + 네이버: Claude (장문 고품질)
async function generateLongForm(
  p: GenerateAllChannelsParams,
): Promise<Pick<ChannelContent, "blogger" | "naver">> {
  const client = new Anthropic({ apiKey: p.anthropicApiKey });
  const meta = buildMeta(p);

  const prompt = `다음 키워드와 정보를 바탕으로 교재 마케팅 블로그 콘텐츠를 생성하세요.

키워드: ${p.keyword}
${meta}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "blogger": {
    "title": "SEO 최적화 블로그 제목 (30~60자)",
    "content_html": "HTML 본문. h2/h3 소제목 포함, 2000자 이상 상세한 교육 정보 콘텐츠. <h2>, <h3>, <p>, <ul>, <li> 태그만 사용.",
    "description": "메타 설명 (100~160자, 핵심 키워드 포함)",
    "labels": ["관련 태그1", "태그2", "태그3 (최대 5개)"]
  },
  "naver": {
    "title": "네이버 SEO 제목 (30~50자, 핵심 키워드 앞배치)",
    "content_html": "HTML 본문. h2/h3 포함, 2000자 이상, 이미지 설명 [이미지: 설명] 텍스트로 표시. <h2>, <h3>, <p>, <ul>, <li> 태그만 사용.",
    "description": "블로그 요약 설명 (100~150자)",
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
  // Anthropic 키가 없으면 Gemini로 전체 생성
  if (!params.anthropicApiKey) {
    const ai = new GoogleGenAI({ apiKey: params.apiKey });
    const meta = buildMeta(params);
    const prompt = `다음 키워드와 정보를 바탕으로 교재 마케팅 콘텐츠를 채널별로 생성하세요.

키워드: ${params.keyword}
${meta}

아래 JSON 스키마를 정확히 따라 응답하세요 (JSON 외 텍스트 없이):

{
  "blogger": { "title": "SEO 블로그 제목", "content_html": "HTML 본문 2000자 이상", "description": "메타 설명 100~160자", "labels": ["태그"] },
  "naver": { "title": "네이버 SEO 제목", "content_html": "HTML 본문 2000자 이상", "description": "요약 설명", "tags": ["태그"] },
  "newsletter": { "subject": "이메일 제목", "preheader": "프리헤더", "body_html": "뉴스레터 본문" },
  "instagram": { "caption": "캡션 (이모지 포함)", "hashtags": ["#태그"] },
  "threads": { "text": "Threads 글" }
}`;
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7, maxOutputTokens: 8192 },
    });
    const raw = response.text?.trim() ?? "";
    return JSON.parse(stripCodeBlock(raw)) as ChannelContent;
  }

  // 병렬 생성: 블로그(Claude) + 소셜(Gemini)
  const [longForm, shortForm] = await Promise.all([
    generateLongForm(params),
    generateShortForm(params),
  ]);

  return { ...longForm, ...shortForm };
}
