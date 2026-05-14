"use server";

import { createBufferTextPost } from "@/lib/buffer/createBufferPost";
import { redirect } from "next/navigation";

export async function submitBufferQueue(formData: FormData) {
  const token = process.env.BUFFER_API_ACCESS_TOKEN?.trim();
  if (!token) {
    redirect(
      "/social?bf=err&msg=" +
        encodeURIComponent("BUFFER_API_ACCESS_TOKEN이 설정되어 있지 않습니다."),
    );
  }
  const channelId = String(formData.get("channelId") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!channelId || !text) {
    redirect(
      "/social?bf=err&msg=" +
        encodeURIComponent("채널과 본문을 모두 입력하세요."),
    );
  }
  try {
    const { postId } = await createBufferTextPost({
      accessToken: token,
      channelId,
      text,
    });
    redirect("/social?bf=ok&postId=" + encodeURIComponent(postId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Buffer 큐 저장 실패";
    redirect("/social?bf=err&msg=" + encodeURIComponent(msg.slice(0, 220)));
  }
}
