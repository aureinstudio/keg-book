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

export async function createBufferTextPost(params: {
  accessToken: string;
  channelId: string;
  text: string;
  mode?: BufferShareMode;
  schedulingType?: BufferSchedulingType;
}): Promise<{ postId: string }> {
  const input = {
    channelId: params.channelId,
    text: params.text,
    mode: params.mode ?? "addToQueue",
    schedulingType: params.schedulingType ?? "automatic",
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
