export type CreatedBloggerPost = {
  id: string;
  url: string;
};

/** Blogger API v3 — `posts.insert` with `isDraft=true` (서버에서만 호출). */
export async function createDraftPost(params: {
  blogId: string;
  accessToken: string;
  title: string;
  /** HTML 본문 */
  content: string;
  /** SEO 태그/레이블 (최대 20개) */
  labels?: string[];
  /** 메타 설명 — Blogger customMetaData 또는 본문 앞에 주석으로 삽입 */
  description?: string;
}): Promise<CreatedBloggerPost> {
  const url = new URL(
    `https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(params.blogId)}/posts`,
  );
  url.searchParams.set("isDraft", "true");

  // 메타 설명을 본문 상단 <meta> 주석으로 삽입 (Blogger는 별도 description 필드 미지원)
  const contentWithMeta = params.description
    ? `<!-- meta-description: ${params.description.replace(/-->/g, "—>")} -->\n${params.content}`
    : params.content;

  const body: Record<string, unknown> = {
    kind: "blogger#post",
    title: params.title,
    content: contentWithMeta,
  };
  if (params.labels && params.labels.length > 0) {
    body.labels = params.labels.slice(0, 20);
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 응답 본문은 서버 로그에만 남기고, 호출자 에러에는 status code만 노출한다.
    // (응답에 OAuth 토큰 echo, 내부 API 경로 등이 포함될 수 있어 사용자 메시지로는 부적합.)
    console.error("[blogger] posts.insert failed", { status: res.status, body: text.slice(0, 500) });
    if (res.status === 401 || res.status === 403) {
      throw new Error("Google 인증이 만료되었거나 권한이 없습니다.");
    }
    if (res.status === 429) {
      throw new Error("Blogger API 호출 한도 초과. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error(`Blogger 초안 저장 실패 (status=${res.status}).`);
  }

  const data = (await res.json()) as { id?: string; url?: string };
  return {
    id: data.id ?? "",
    url: data.url ?? "",
  };
}
