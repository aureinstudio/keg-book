import { bufferGraphql } from "@/lib/buffer/graphql";

export type BufferChannelLite = {
  id: string;
  name: string;
  descriptor: string;
  isDisconnected: boolean;
  isLocked: boolean;
};

type OrgRow = { id?: string; name?: string };

const ORGS_QUERY = `
  query KegBookOrgs {
    account {
      organizations {
        id
        name
      }
    }
  }
`;

const CHANNELS_QUERY = `
  query KegBookChannels($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      id
      name
      descriptor
      isDisconnected
      isLocked
    }
  }
`;

/** Buffer Publish API 토큰으로 연결된 채널 목록(첫 조직 기준). */
export async function listBufferChannels(
  accessToken: string,
): Promise<BufferChannelLite[]> {
  type OrgData = {
    account?: { organizations?: OrgRow[] };
  };
  const orgData = await bufferGraphql<OrgData>(accessToken, ORGS_QUERY);
  const orgs = orgData.account?.organizations ?? [];
  const first = orgs.find((o) => o.id);
  if (!first?.id) return [];

  type ChData = {
    channels?: BufferChannelLite[];
  };
  const chData = await bufferGraphql<ChData>(accessToken, CHANNELS_QUERY, {
    organizationId: first.id,
  });

  return (chData.channels ?? []).map((c) => ({
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    descriptor: String(c.descriptor ?? ""),
    isDisconnected: Boolean(c.isDisconnected),
    isLocked: Boolean(c.isLocked),
  }));
}
