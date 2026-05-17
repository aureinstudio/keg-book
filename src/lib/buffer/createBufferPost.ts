import { bufferGraphql } from "@/lib/buffer/graphql";

const CREATE_MUTATION = `
  mutation KegBookCreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post {
          id
          text
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export type BufferShareMode = "addToQueue" | "shareNow" | "shareNext";
export type BufferSchedulingType = "automatic" | "notification";

export type BufferImageAsset = {
  /** 공개 접근 가능한 이미지 URL */
  url: string;
  thumbnailUrl?: string;
};

export type CreateBufferPostParams = {
  accessToken: string;
  channelId: string;
  text: string;
  mode?: BufferShareMode;
  schedulingType?: BufferSchedulingType;
  /**
   * 첨부할 이미지 — 순서대로 carousel/album이 됨.
   * 인스타그램은 2장 이상이면 자동으로 캐러셀로 발행됨.
   */
  images?: BufferImageAsset[];
};

/**
 * Buffer GraphQL `createPost` — 텍스트 + (선택) 이미지 캐러셀.
 *
 * 이미지가 1장 이상이면 `assets: [{ image: { url } }, ...]`로 전송하고,
 * Buffer가 채널 타입(인스타 등)에 맞춰 캐러셀 또는 단일 이미지로 발행합니다.
 */
export async function createBufferTextPost(
  params: CreateBufferPostParams,
): Promise<{ postId: string }> {
  const assets =
    (params.images ?? [])
      .filter((a) => a.url)
      .map((a) => ({
        image: {
          url: a.url,
          ...(a.thumbnailUrl ? { thumbnailUrl: a.thumbnailUrl } : {}),
        },
      })) ?? [];

  const input: Record<string, unknown> = {
    channelId: params.channelId,
    text: params.text,
    mode: params.mode ?? "addToQueue",
    schedulingType: params.schedulingType ?? "automatic",
    assets,
  };

  const data = await bufferGraphql<{ createPost?: unknown }>(
    params.accessToken,
    CREATE_MUTATION,
    { input },
  );

  const payload = data.createPost as
    | { post?: { id?: string }; message?: string; __typename?: string }
    | undefined;

  if (payload && typeof payload === "object" && "message" in payload && payload.message) {
    throw new Error(String(payload.message));
  }
  if (payload?.post?.id) {
    return { postId: payload.post.id };
  }
  throw new Error("Buffer createPost 결과를 해석할 수 없습니다.");
}
