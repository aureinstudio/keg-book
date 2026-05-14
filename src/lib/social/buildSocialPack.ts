import { htmlToPlainText } from "@/lib/social/htmlToPlain";

const INSTAGRAM_MAX = 2200;
const THREADS_MAX = 480;

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

export type SocialPack = {
  instagramCaption: string;
  threadsPosts: string[];
  plainBody: string;
};

/**
 * Blogger/에디터 HTML과 제목에서 인스타 캡션·Threads 분할 문안을 만든다.
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
  return {
    instagramCaption: ig,
    threadsPosts,
    plainBody,
  };
}
