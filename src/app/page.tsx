import { BloggerDraftForm } from "@/app/blogger/BloggerDraftForm";
import { auth, signIn, signOut } from "@/auth";
import { listBlogsForAccessToken } from "@/lib/blogger/listBlogs";
import Link from "next/link";

type HomeProps = {
  searchParams: Promise<{
    draftOk?: string;
    draftError?: string;
    postId?: string;
    postUrl?: string;
  }>;
};


export default async function Home({ searchParams }: HomeProps) {
  const sp = await searchParams;
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] p-8">
        <div
          className="w-full max-w-sm"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "var(--shadow-3)",
          }}
        >
          <div className="mb-8">
            {/* Gemini 그라데이션 아이콘 */}
            <div
              className="gemini-gradient mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
            >
              B
            </div>
            <h1 className="text-[22px] font-normal" style={{ color: "var(--color-text)" }}>
              Blogger 연결
            </h1>
            <p className="mt-1 text-[14px]" style={{ color: "var(--color-text-muted)" }}>
              Google 계정으로 로그인해 Blogger API에 연결합니다.
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full text-[14px] font-medium text-white transition-colors"
              style={{
                backgroundColor: "var(--color-accent)",
                borderRadius: "20px",
                padding: "10px 24px",
              }}
            >
              Google로 로그인
            </button>
          </form>

          <p className="mt-5 text-[12px]" style={{ color: "var(--color-text-faint)", lineHeight: 1.7 }}>
            <code className="rounded px-1.5 py-0.5" style={{ backgroundColor: "var(--color-surface-2)", fontSize: "11px" }}>.env</code>에{" "}
            <code className="rounded px-1.5 py-0.5" style={{ backgroundColor: "var(--color-surface-2)", fontSize: "11px" }}>GOOGLE_CLIENT_*</code>,{" "}
            <code className="rounded px-1.5 py-0.5" style={{ backgroundColor: "var(--color-surface-2)", fontSize: "11px" }}>AUTH_SECRET</code>{" "}
            설정 필요.{" "}
            <Link href="/naver" style={{ color: "#03C75A" }}>네이버 패널</Link>은 로그인 없이 사용 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  let blogs: Awaited<ReturnType<typeof listBlogsForAccessToken>> = [];
  let blogError: string | null = null;

  if (session.accessToken) {
    try {
      blogs = await listBlogsForAccessToken(session.accessToken);
    } catch (e) {
      blogError = e instanceof Error ? e.message : "Blogger API 오류";
    }
  } else {
    blogError = "세션에 access_token이 없습니다. 로그아웃 후 다시 로그인해 보세요.";
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* 채널 헤더 */}
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
            style={{ backgroundColor: "#EA4335" }}
          >
            B
          </span>
          <div>
            <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>
              Blogger
            </h1>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              {session.user.email}
            </p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-[13px] font-medium transition-colors"
            style={{
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-text-muted)",
              backgroundColor: "transparent",
              borderRadius: "20px",
              padding: "5px 16px",
            }}
          >
            로그아웃
          </button>
        </form>
      </div>

      {/* 알림 */}
      {sp.draftOk && (
        <div
          className="mb-5 text-[13px]"
          style={{
            backgroundColor: "rgba(52,168,83,0.08)",
            border: "1px solid rgba(52,168,83,0.25)",
            color: "#137333",
            borderRadius: "8px",
            padding: "12px 16px",
          }}
          role="status"
        >
          Blogger에 초안이 저장되었습니다.
          {sp.postUrl && (
            <a href={sp.postUrl} target="_blank" rel="noopener noreferrer"
              className="ml-2 font-medium underline" style={{ color: "#137333" }}>
              Blogger에서 열기 →
            </a>
          )}
        </div>
      )}
      {sp.draftError && (
        <div
          className="mb-5 text-[13px]"
          style={{
            backgroundColor: "rgba(249,171,0,0.08)",
            border: "1px solid rgba(249,171,0,0.3)",
            color: "#B45309",
            borderRadius: "8px",
            padding: "12px 16px",
          }}
          role="alert"
        >
          {sp.draftError}
        </div>
      )}

      {/* 연결된 블로그 */}
      <div
        className="mb-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
          연결된 블로그
        </h2>
        {blogError && (
          <p className="text-[13px]" style={{ color: "#F9AB00" }} role="alert">{blogError}</p>
        )}
        {!blogError && blogs.length === 0 && (
          <p className="text-[13px]" style={{ color: "var(--color-text-faint)" }}>연결된 블로그가 없습니다.</p>
        )}
        <ul className="space-y-2.5">
          {blogs.map((b) => (
            <li key={b.id} className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "#EA4335" }} />
              <a href={b.url} target="_blank" rel="noopener noreferrer"
                className="text-[13px] font-medium hover:underline"
                style={{ color: "var(--color-accent)" }}
              >
                {b.name}
              </a>
              <code className="ml-auto rounded px-1.5 py-0.5 text-[10px]"
                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-faint)" }}>
                {b.id}
              </code>
            </li>
          ))}
        </ul>
      </div>

      {/* 초안 작성 — SEO 최적화 폼 */}
      {!blogError && blogs.length > 0 && (
        <BloggerDraftForm blogs={blogs.map((b) => ({ id: b.id, name: b.name }))} />
      )}

      <p className="mt-6 text-[12px]" style={{ color: "var(--color-text-faint)" }}>
        좌측 사이드바에서 채널을 전환하세요.
      </p>
    </div>
  );
}
