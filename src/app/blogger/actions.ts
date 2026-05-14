"use server";

import { auth } from "@/auth";
import { createDraftPost } from "@/lib/blogger/createDraftPost";
import { redirect } from "next/navigation";

export async function submitBloggerDraft(formData: FormData) {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/?draftError=" + encodeURIComponent("로그인이 필요합니다."));
  }

  const blogId = String(formData.get("blogId") ?? "").trim();
  const title =
    String(formData.get("title") ?? "").trim() || "keg-book 테스트 초안";
  const content =
    String(formData.get("content") ?? "").trim() || "<p>(빈 본문)</p>";
  const description = String(formData.get("description") ?? "").trim();
  const labelsRaw = String(formData.get("labels") ?? "").trim();
  const labels = labelsRaw
    ? labelsRaw.split(/[,，\s]+/).map((l) => l.trim()).filter(Boolean)
    : [];

  if (!blogId) {
    redirect("/?draftError=" + encodeURIComponent("블로그를 선택하세요."));
  }

  try {
    const post = await createDraftPost({
      blogId,
      accessToken: session.accessToken,
      title,
      content,
      description: description || undefined,
      labels: labels.length > 0 ? labels : undefined,
    });
    const q = new URLSearchParams({
      draftOk: "1",
      postId: post.id,
    });
    if (post.url) q.set("postUrl", post.url);
    redirect(`/?${q.toString()}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "초안 저장 실패";
    redirect("/?draftError=" + encodeURIComponent(msg.slice(0, 200)));
  }
}
