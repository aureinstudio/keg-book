import { htmlToPlainText } from "@/lib/social/htmlToPlain";

const INSTAGRAM_MAX = 2200;
const THREADS_MAX = 480;
// LinkedIn 본문 텍스트 한도는 3,000자이나 피드 "더보기" 컷오프가
// 모바일 ~210자 / 데스크톱 ~140자라 권장 길이는 1,200–1,500자로 둔다.
const LINKEDIN_MAX = 3000;
const LINKEDIN_RECOMMENDED = 1500;

function truncate(s: string, max: number): string {
  const lim = Number.isFinite(max) && max > 0 ? max : INSTAGRAM_MAX;
  if (s.length <= lim) return s;
  return `${s.slice(0, lim - 1)}…`;
}

/** Threads용: 문단·공백 우선으로 잘라 여러 트윗으로 나눔. */
export function splitForThreads(text: string, maxLen = THREADS_MAX): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= maxLen) return [t];
  const parts: string[] = [];
  let rest = t;
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      parts.push(rest.trim());
      break;
    }
    let cut = rest.lastIndexOf("\n\n", maxLen);
    if (cut < maxLen * 0.45) cut = rest.lastIndexOf(". ", maxLen);
    if (cut < maxLen * 0.45) cut = rest.lastIndexOf(" ", maxLen);
    if (cut < maxLen * 0.35) cut = maxLen;
    const chunk = rest.slice(0, cut).trim();
    if (chunk) parts.push(chunk);
    rest = rest.slice(cut).trimStart();
  }
  return parts;
}

/**
 * LinkedIn 단일 게시물용 본문 빌더.
 * - 첫 줄은 훅(140자 이내) — 데스크톱 "더보기" 컷오프 대응
 * - 빈 줄로 단락 구분 (LinkedIn 모바일은 \n 두 번이 시각적 break)
 * - 해시태그는 본문 끝에 3–5개 (전문가 톤 권장 수치)
 * - 최대 1,500자로 자름 (3,000자 한도지만 도달률 ↓)
 */
export function buildLinkedInPost(
  title: string,
  plainBody: string,
  hashtags: string[] = ["코리아교육그룹", "교재", "출판", "교육"],
): string {
  const hook = title.trim() || "새 글 소개";
  const body = plainBody.trim();
  // 단락 단위로 split → \n\n 두 번 줄바꿈으로 join (LinkedIn 가독성)
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const formatted = paragraphs.join("\n\n");
  const tagLine = hashtags
    .slice(0, 5)
    .map((t) => `#${t.replace(/^#/, "")}`)
    .join(" ");
  const composed = `${hook}\n\n${formatted}\n\n${tagLine}`.trim();
  return truncate(composed, LINKEDIN_RECOMMENDED);
}

export type SocialPack = {
  instagramCaption: string;
  threadsPosts: string[];
  linkedinPost: string;
  plainBody: string;
};

/**
 * Blogger/에디터 HTML과 제목에서 인스타 캡션·Threads 분할·LinkedIn 본문을 만든다.
 * (해시태그·톤은 추후 템플릿으로 확장 가능.)
 */
export function buildSocialPack(title: string, bodyHtml: string): SocialPack {
  const plainBody = htmlToPlainText(bodyHtml);
  const headline = title.trim() || "새 글";
  const core = `${headline}\n\n${plainBody}`.trim();
  const hashtags =
    "\n\n#코리아교육그룹 #교재 #독서 #출판";
  const ig = truncate(`${core}${hashtags}`, INSTAGRAM_MAX);
  const threadsSource = `${headline}\n\n${plainBody}`;
  const threadsPosts = splitForThreads(threadsSource, THREADS_MAX);
  const linkedinPost = buildLinkedInPost(headline, plainBody);
  return {
    instagramCaption: ig,
    threadsPosts,
    linkedinPost,
    plainBody,
  };
}

export const SOCIAL_LIMITS = {
  instagram: { max: INSTAGRAM_MAX, recommended: 1500, hashtags: { min: 5, max: 30 } },
  threads: { max: THREADS_MAX, recommended: 280, hashtags: { min: 0, max: 5 } },
  linkedin: { max: LINKEDIN_MAX, recommended: LINKEDIN_RECOMMENDED, hashtags: { min: 3, max: 5 } },
  twitter: { max: 280, recommended: 250, hashtags: { min: 0, max: 3 } },
  facebook: { max: 63206, recommended: 400, hashtags: { min: 0, max: 3 } },
} as const;

export type SocialService = keyof typeof SOCIAL_LIMITS;

/** Buffer 채널 descriptor/name 에서 서비스 종류를 추정. */
export function detectService(
  descriptor: string,
  name: string,
): SocialService | "unknown" {
  const s = `${descriptor} ${name}`.toLowerCase();
  if (/instagram/.test(s)) return "instagram";
  if (/threads/.test(s)) return "threads";
  if (/linkedin/.test(s)) return "linkedin";
  if (/twitter|^x\b|\bx\.com/.test(s)) return "twitter";
  if (/facebook/.test(s)) return "facebook";
  return "unknown";
}
