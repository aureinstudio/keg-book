import { escapeHtml } from "@/lib/naver/escapeHtml";

export type NewsletterFields = {
  subject: string;
  preheader: string;
  /** HTML 본문(이미 이스케이프된 안전한 조각이거나, 단순 태그만 쓰는 경우) */
  bodyHtml: string;
};

/**
 * 메일리·일반 ESP 에 붙여넣기 좋은 최소 HTML 래퍼.
 *
 * 톤·구조 기준: 메일리 Josh-style Q&A 인터뷰형
 * (참고: _template/newsletter/maily-story-qa.md, https://maily.so/josh/posts/knrj1pn1rld)
 *
 * - 헤더 (H1 제목) + 프리헤더 (숨김)
 * - 본문 — H2 섹션 / H3 Q&A / strong 강조 / blockquote 인용 / hr 구분
 * - 푸터 한 줄
 *
 * 이메일 클라이언트 호환성을 위해 본문 요소별 스타일은 <head><style> 에 정의
 * (Maily / Gmail / Apple Mail / Outlook web 지원). Outlook 데스크톱처럼 style 을
 * 잘라먹는 클라이언트에서는 디폴트 폰트로 fallback.
 */
export function buildNewsletterHtml(fields: NewsletterFields): string {
  const subject = escapeHtml(fields.subject.trim() || "뉴스레터");
  const preheader = escapeHtml(fields.preheader.trim());
  const inner = fields.bodyHtml.trim() || "<p></p>";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
  <style>
    /* ─── 메일리 Josh-style Q&A 본문 스타일 ─── */
    .keg-body { font-size: 15px; line-height: 1.7; color: #18181b; }
    .keg-body h2 {
      margin: 32px 0 12px;
      font-size: 20px;
      line-height: 1.35;
      font-weight: 700;
      color: #0a0a0a;
      letter-spacing: -0.01em;
    }
    .keg-body h3 {
      margin: 24px 0 8px;
      font-size: 16px;
      line-height: 1.4;
      font-weight: 600;
      color: #18181b;
    }
    .keg-body p { margin: 0 0 14px; }
    .keg-body strong { font-weight: 700; color: #0a0a0a; }
    .keg-body a {
      color: #0a0a0a;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .keg-body ul, .keg-body ol { margin: 10px 0 16px 22px; padding: 0; }
    .keg-body li { margin: 4px 0; }
    .keg-body blockquote {
      margin: 16px 0;
      padding: 8px 16px;
      border-left: 3px solid #d4d4d4;
      color: #525252;
      font-style: italic;
    }
    .keg-body hr {
      margin: 28px 0;
      border: 0;
      border-top: 1px solid #e5e5e5;
    }
    .keg-body img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 12px auto;
      border-radius: 6px;
    }
    .keg-body em { color: #737373; }
  </style>
</head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:'Pretendard Variable',Pretendard,'Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif;color:#18181b;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;">
    <tr>
      <td style="padding:32px 28px;">
        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-0.015em;color:#0a0a0a;">${subject}</h1>
        <div class="keg-body">
          ${inner}
        </div>
      </td>
    </tr>
  </table>
  <p style="max-width:640px;margin:16px auto 0;font-size:11px;color:#a1a1aa;text-align:center;">
    keg-book 에서 생성 · 발송·구독자 관리는 메일리 정책을 따릅니다.
  </p>
</body>
</html>`;
}
