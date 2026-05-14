import { escapeHtml } from "@/lib/naver/escapeHtml";

export type NewsletterFields = {
  subject: string;
  preheader: string;
  /** HTML 본문(이미 이스케이프된 안전한 조각이거나, 단순 `<p>`만 쓰는 경우) */
  bodyHtml: string;
};

/** 메일리·일반 ESP에 붙여넣기 좋은 최소 HTML 래퍼. */
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
</head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:system-ui,sans-serif;color:#18181b;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;">
    <tr>
      <td style="padding:28px 24px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${subject}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3f3f46;">
          ${inner}
        </div>
      </td>
    </tr>
  </table>
  <p style="max-width:600px;margin:16px auto 0;font-size:11px;color:#a1a1aa;text-align:center;">
    keg-book에서 생성 · 발송·구독자 관리는 메일리 정책을 따릅니다.
  </p>
</body>
</html>`;
}
