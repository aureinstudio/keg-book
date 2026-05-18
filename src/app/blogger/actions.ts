"use server";

import { auth } from "@/auth";
import { createDraftPost } from "@/lib/blogger/createDraftPost";
import { logActivity } from "@/lib/db/generations";
import { redirect } from "next/navigation";

function bloggerRedirect(
  params: Record<string, string | undefined>,
  fromId: string | null,
): never {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  if (fromId) q.set("from", fromId);
  redirect(`/blogger${q.toString() ? `?${q}` : ""}`);
}

export async function submitBloggerDraft(formData: FormData) {
  const session = await auth();
  const generationId = String(formData.get("generationId") ?? "").trim() || null;

  if (!session?.accessToken) {
    bloggerRedirect(
      { draftError: "로그인이 필요합니다. 우측 상단에서 다시 로그인해 주세요." },
      generationId,
    );
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
    bloggerRedirect({ draftError: "블로그를 선택하세요." }, generationId);
  }

  let post: Awaited<ReturnType<typeof createDraftPost>>;
  try {
    post = await createDraftPost({
      blogId,
      accessToken: session.accessToken,
      title,
      content,
      description: description || undefined,
      labels: labels.length > 0 ? labels : undefined,
    });
  } catch (e) {
    const rawMsg = e instanceof Error ? e.message : "초안 저장 실패";
    // Google OAuth token 만료 — 친절 메시지로 치환
    const friendly =
      /401|invalid_token|UNAUTHENTICATED|Invalid Credentials|access_token/i.test(
        rawMsg,
      )
        ? "Google 인증이 만료되었습니다. 우측 상단에서 로그아웃 후 다시 로그인해 주세요."
        : rawMsg.slice(0, 200);
    bloggerRedirect({ draftError: friendly }, generationId);
  }

  // 활동 로그 기록 (실패해도 진행)
  await logActivity({
    userEmail: session?.user?.email ?? null,
    userName: session?.user?.name ?? null,
    action: "publish",
    targetType: "blogger",
    targetId: post.id,
    detail: {
      blogId,
      title,
      postUrl: post.url ?? null,
      generationId,
      labelCount: labels.length,
    },
  }).catch(() => {});

  bloggerRedirect(
    {
      draftOk: "1",
      postId: post.id,
      ...(post.url ? { postUrl: post.url } : {}),
    },
    generationId,
  );
}
