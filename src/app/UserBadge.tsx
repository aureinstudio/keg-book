import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "./auth-actions";

export async function UserBadge() {
  const session = await auth().catch(() => null);
  const user = session?.user;

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium transition-colors"
        style={{
          border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
          backgroundColor: "var(--color-surface-2)",
        }}
      >
        <span
          className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          G
        </span>
        Google 로그인
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-2 rounded-full px-2 py-1.5">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt=""
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)" }}
        >
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[12px] font-medium leading-tight"
          style={{ color: "var(--color-sidebar-text-active)" }}
        >
          {user.name ?? "사용자"}
        </p>
        <p
          className="truncate text-[10px] leading-tight"
          style={{ color: "var(--color-text-faint)" }}
        >
          {user.email}
        </p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-full px-2 py-1 text-[10px] transition-colors"
          style={{ color: "var(--color-text-faint)" }}
          title="로그아웃"
        >
          ⇥
        </button>
      </form>
    </div>
  );
}
