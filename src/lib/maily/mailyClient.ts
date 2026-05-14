/**
 * 메일리 개발자 API — https://maily.so/app/guides/dev/dev-api
 * Base: https://api.maily.so , Authorization: Bearer {API_KEY}
 * 구독자 목록 경로는 계정·버전에 따라 다를 수 있어 MAILY_SUBSCRIBERS_PATH로 덮어쓸 수 있다.
 */

export function getMailyConfig(): { apiKey: string | undefined; baseUrl: string; subscribersPath: string } {
  const apiKey = process.env.MAILY_API_KEY?.trim() || undefined;
  const baseUrl = (process.env.MAILY_API_BASE?.trim() || "https://api.maily.so").replace(/\/$/, "");
  const subscribersPath =
    process.env.MAILY_SUBSCRIBERS_PATH?.trim() || "/subscribers";
  return { apiKey, baseUrl, subscribersPath };
}

export function mailySubscribersUrl(page?: string): string {
  const { baseUrl, subscribersPath } = getMailyConfig();
  const path = subscribersPath.startsWith("/") ? subscribersPath : `/${subscribersPath}`;
  const u = new URL(path, `${baseUrl}/`);
  if (page) u.searchParams.set("page", page);
  return u.toString();
}
