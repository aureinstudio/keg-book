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
    const text = await res.text();
    throw new Error(`posts.insert ${res.status}: ${text.slice(0, 240)}`);
  }

  const data = (await res.json()) as { id?: string; url?: string };
  return {
    id: data.id ?? "",
    url: data.url ?? "",
  };
}
