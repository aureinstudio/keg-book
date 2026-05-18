import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/supabase";

export const metadata: Metadata = { title: "DB 진단 — keg-book" };
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "missing" | "error";
type Check = {
  name: string;
  detail: string;
  status: CheckStatus;
  hint?: string;
};

async function probeTable(table: string): Promise<Check> {
  try {
    const db = getDb();
    const { error, count } = await db
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      const code = (error as { code?: string }).code ?? "";
      // 42P01 = undefined_table
      if (code === "42P01" || /relation .* does not exist/i.test(error.message)) {
        return {
          name: `table: ${table}`,
          detail: `테이블이 존재하지 않습니다 (${code || "missing"}).`,
          status: "missing",
          hint:
            "Supabase Dashboard → SQL Editor 에서 supabase/migrations/002_generations_history_log.sql 전체 실행.",
        };
      }
      return {
        name: `table: ${table}`,
        detail: `${error.message} (${code})`,
        status: "error",
        hint: "권한(서비스 롤 키)·RLS 정책을 확인하세요.",
      };
    }
    return {
      name: `table: ${table}`,
      detail: `OK — 현재 행 수: ${count ?? 0}`,
      status: "ok",
    };
  } catch (e) {
    return {
      name: `table: ${table}`,
      detail: e instanceof Error ? e.message : "조회 실패",
      status: "error",
      hint: "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY env 누락 여부를 확인하세요.",
    };
  }
}

async function probeBucket(bucketId: string): Promise<Check> {
  try {
    const db = getDb();
    const { data, error } = await db.storage.getBucket(bucketId);
    if (error) {
      if (/not found|does not exist/i.test(error.message)) {
        return {
          name: `bucket: ${bucketId}`,
          detail: `버킷이 존재하지 않습니다.`,
          status: "missing",
          hint:
            "Supabase Dashboard → SQL Editor 에서 supabase/migrations/003_card_news_storage.sql 실행.",
        };
      }
      return {
        name: `bucket: ${bucketId}`,
        detail: error.message,
        status: "error",
      };
    }
    if (!data) {
      return {
        name: `bucket: ${bucketId}`,
        detail: "버킷 응답이 비어 있습니다.",
        status: "error",
      };
    }
    return {
      name: `bucket: ${bucketId}`,
      detail: `OK — public=${data.public}, id=${data.id}`,
      status: data.public ? "ok" : "error",
      hint: data.public
        ? undefined
        : "버킷이 비공개입니다. 003 마이그레이션이 public=true 로 적용됐는지 확인.",
    };
  } catch (e) {
    return {
      name: `bucket: ${bucketId}`,
      detail: e instanceof Error ? e.message : "조회 실패",
      status: "error",
    };
  }
}

function envStatus(): Check[] {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];
  return required.map((k) => {
    const v = process.env[k];
    if (!v) {
      return {
        name: `env: ${k}`,
        detail: "미설정",
        status: "missing",
        hint: "Vercel → Project → Settings → Environment Variables 확인.",
      };
    }
    return {
      name: `env: ${k}`,
      detail: `설정됨 (길이 ${v.length})`,
      status: "ok",
    };
  });
}

function badge(status: CheckStatus) {
  const map: Record<CheckStatus, { bg: string; color: string; label: string }> = {
    ok: { bg: "rgba(38,38,38,0.1)", color: "#262626", label: "OK" },
    missing: { bg: "rgba(115,115,115,0.15)", color: "#525252", label: "MISSING" },
    error: { bg: "rgba(82,82,82,0.18)", color: "#171717", label: "ERROR" },
  };
  const s = map[status];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default async function DbHealthPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>
          DB 진단
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          로그인이 필요합니다.
        </p>
        <Link
          href="/login?redirect=/admin/db-health"
          className="mt-5 inline-block rounded-full px-5 py-2 text-[13px] font-medium text-white"
          style={{ backgroundColor: "#262626" }}
        >
          로그인
        </Link>
      </div>
    );
  }

  const tableChecks = await Promise.all([
    probeTable("generations"),
    probeTable("channel_drafts"),
    probeTable("activity_log"),
    probeTable("publish_jobs"),
  ]);
  const bucketChecks = await Promise.all([probeBucket("card-news")]);
  const envChecks = envStatus();

  const all = [...envChecks, ...tableChecks, ...bucketChecks];
  const okCount = all.filter((c) => c.status === "ok").length;
  const missingCount = all.filter((c) => c.status === "missing").length;
  const errorCount = all.filter((c) => c.status === "error").length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-7">
        <h1 className="text-[20px] font-normal" style={{ color: "var(--color-text)" }}>
          DB · Storage · ENV 진단
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          Supabase 마이그레이션(002, 003)과 필수 환경변수의 실제 적용 상태를 확인합니다.
        </p>
      </div>

      <div
        className="mb-6 grid grid-cols-3 gap-3"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "16px 20px",
        }}
      >
        <SummaryCell label="정상" value={okCount} tone="ok" />
        <SummaryCell label="누락" value={missingCount} tone="missing" />
        <SummaryCell label="오류" value={errorCount} tone="error" />
      </div>

      <Section title="환경 변수">
        {envChecks.map((c, i) => (
          <CheckRow key={`e-${i}`} c={c} />
        ))}
      </Section>

      <Section title="테이블 (마이그레이션 001 · 002)">
        {tableChecks.map((c, i) => (
          <CheckRow key={`t-${i}`} c={c} />
        ))}
      </Section>

      <Section title="Storage 버킷 (마이그레이션 003)">
        {bucketChecks.map((c, i) => (
          <CheckRow key={`b-${i}`} c={c} />
        ))}
      </Section>

      <div
        className="mt-6 rounded-lg p-4 text-[12px]"
        style={{
          backgroundColor: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
        }}
      >
        <p className="mb-1 font-medium" style={{ color: "var(--color-text)" }}>
          누락 항목이 있을 때
        </p>
        <ol className="ml-4 list-decimal space-y-0.5">
          <li>
            Supabase Dashboard 열기 → 좌측 <strong>SQL Editor</strong>.
          </li>
          <li>
            저장소의{" "}
            <code style={{ color: "var(--color-text)" }}>
              supabase/migrations/002_generations_history_log.sql
            </code>{" "}
            전체를 붙여 넣고 실행.
          </li>
          <li>
            다음으로{" "}
            <code style={{ color: "var(--color-text)" }}>
              supabase/migrations/003_card_news_storage.sql
            </code>{" "}
            실행.
          </li>
          <li>이 페이지를 새로고침해 모든 항목이 OK인지 재확인.</li>
        </ol>
        <p className="mt-2" style={{ color: "var(--color-text-faint)" }}>
          이 페이지는 운영자 진단용입니다 — 일반 사용자에게 노출하지 마세요.
        </p>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: CheckStatus;
}) {
  const color =
    tone === "ok" ? "#262626" : tone === "missing" ? "#525252" : "#171717";
  return (
    <div className="text-center">
      <p
        className="text-[28px] font-light tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
      <p
        className="text-[11px] uppercase tracking-wider"
        style={{ color: "var(--color-text-faint)" }}
      >
        {label}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2
        className="mb-2 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--color-text-faint)" }}
      >
        {title}
      </h2>
      <ul
        className="overflow-hidden rounded-lg"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {children}
      </ul>
    </section>
  );
}

function CheckRow({ c }: { c: Check }) {
  return (
    <li
      className="flex items-start justify-between gap-3 px-4 py-2.5"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="text-[12px]" style={{ color: "var(--color-text)" }}>
            {c.name}
          </code>
          {badge(c.status)}
        </div>
        <p
          className="mt-0.5 text-[11px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          {c.detail}
        </p>
        {c.hint && (
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            ↪ {c.hint}
          </p>
        )}
      </div>
    </li>
  );
}
