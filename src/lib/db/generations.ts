import { randomUUID } from "node:crypto";
import { getDb } from "./supabase";
import type { ChannelContent } from "@/lib/gemini/generateAllChannels";

export type Generation = {
  id: string;
  user_email: string | null;
  user_name: string | null;
  keyword: string;
  product_name: string | null;
  target_audience: string | null;
  context: string | null;
  raw_json: ChannelContent;
  created_at: number;
};

export type ChannelKey =
  | "blogger"
  | "naver"
  | "newsletter"
  | "instagram"
  | "threads"
  | "card-news";

export type ChannelDraft = {
  id: string;
  generation_id: string;
  channel: ChannelKey;
  status: "draft" | "scheduled" | "published" | "archived";
  content_json: unknown;
  external_url: string | null;
  updated_at: number;
};

export type ActivityAction =
  | "generate"
  | "publish"
  | "schedule"
  | "edit"
  | "archive"
  | "signin";

export type ActivityLog = {
  id: number;
  user_email: string | null;
  user_name: string | null;
  action: ActivityAction;
  target_type: string | null;
  target_id: string | null;
  detail: unknown;
  created_at: number;
};

// ─────────────────────────────────────────────────────────────
// generations
// ─────────────────────────────────────────────────────────────

export async function createGeneration(input: {
  keyword: string;
  productName?: string;
  targetAudience?: string;
  context?: string;
  rawJson: ChannelContent;
  userEmail?: string | null;
  userName?: string | null;
}): Promise<Generation> {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();

  const row = {
    id,
    user_email: input.userEmail ?? null,
    user_name: input.userName ?? null,
    keyword: input.keyword,
    product_name: input.productName ?? null,
    target_audience: input.targetAudience ?? null,
    context: input.context ?? null,
    raw_json: input.rawJson,
    created_at: now,
  };

  const { error } = await db.from("generations").insert(row);
  if (error) throw new Error(`generations 저장 실패: ${error.message}`);

  // 5채널 초안 자동 생성
  const drafts: ChannelDraft[] = (
    ["blogger", "naver", "newsletter", "instagram", "threads"] as const
  ).map((channel) => ({
    id: randomUUID(),
    generation_id: id,
    channel,
    status: "draft" as const,
    content_json: input.rawJson[channel],
    external_url: null,
    updated_at: now,
  }));

  const { error: dErr } = await db.from("channel_drafts").insert(drafts);
  if (dErr) throw new Error(`channel_drafts 저장 실패: ${dErr.message}`);

  return row as Generation;
}

export async function listRecentGenerations(limit = 20): Promise<Generation[]> {
  const db = getDb();
  const { data, error } = await db
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`generations 조회 실패: ${error.message}`);
  return (data ?? []) as Generation[];
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const db = getDb();
  const { data, error } = await db
    .from("generations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`generation 조회 실패: ${error.message}`);
  return (data as Generation | null) ?? null;
}

// ─────────────────────────────────────────────────────────────
// channel_drafts
// ─────────────────────────────────────────────────────────────

export async function listDraftsByChannel(
  channel: ChannelKey,
  limit = 20,
): Promise<(ChannelDraft & { generation: Generation })[]> {
  const db = getDb();
  const { data, error } = await db
    .from("channel_drafts")
    .select("*, generation:generations(*)")
    .eq("channel", channel)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`channel_drafts 조회 실패: ${error.message}`);
  return (data ?? []) as (ChannelDraft & { generation: Generation })[];
}

export async function updateDraftStatus(
  draftId: string,
  status: ChannelDraft["status"],
  externalUrl?: string,
): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("channel_drafts")
    .update({
      status,
      external_url: externalUrl ?? null,
      updated_at: Date.now(),
    })
    .eq("id", draftId);
  if (error) throw new Error(`channel_drafts 업데이트 실패: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// activity_log
// ─────────────────────────────────────────────────────────────

export async function logActivity(input: {
  userEmail?: string | null;
  userName?: string | null;
  action: ActivityAction;
  targetType?: string;
  targetId?: string;
  detail?: unknown;
}): Promise<void> {
  const db = getDb();
  const row = {
    user_email: input.userEmail ?? null,
    user_name: input.userName ?? null,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    detail: input.detail ?? null,
    created_at: Date.now(),
  };
  const { error } = await db.from("activity_log").insert(row);
  if (error) {
    console.warn(`[activity_log] insert 실패 (무시): ${error.message}`);
  }
}

export async function listRecentActivity(limit = 50): Promise<ActivityLog[]> {
  const db = getDb();
  const { data, error } = await db
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`activity_log 조회 실패: ${error.message}`);
  return (data ?? []) as ActivityLog[];
}
