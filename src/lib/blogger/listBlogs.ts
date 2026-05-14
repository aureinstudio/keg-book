export type BloggerBlogItem = {
  id: string;
  name: string;
  url: string;
};

/** Blogger API v3 — `users.self.blogs` (서버에서만 호출). */
export async function listBlogsForAccessToken(
  accessToken: string,
): Promise<BloggerBlogItem[]> {
  const res = await fetch("https://www.googleapis.com/blogger/v3/users/self/blogs", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Blogger API ${res.status}: ${text.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    items?: { id?: string; name?: string; url?: string }[];
  };

  return (data.items ?? []).map((i) => ({
    id: i.id ?? "",
    name: i.name ?? "",
    url: i.url ?? "",
  }));
}
