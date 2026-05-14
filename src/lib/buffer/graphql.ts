const BUFFER_GRAPHQL_URL = "https://api.buffer.com";

export type BufferGraphqlError = {
  message: string;
};

export async function bufferGraphql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(BUFFER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (!res.ok) {
    throw new Error(`Buffer HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (json.data === undefined) {
    throw new Error("Buffer 응답에 data가 없습니다.");
  }
  return json.data;
}
