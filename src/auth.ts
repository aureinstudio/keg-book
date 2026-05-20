import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const DEV_ONLY_AUTH_SECRET =
  "keg-book-dev-only-auth-secret-not-for-production";

/**
 * AUTH_SECRET 해석 정책:
 * - production: 비어있으면 throw — fail-secure (session hijack 방지).
 * - test/CI: AUTH_SECRET 또는 NEXTAUTH_SECRET 이 있으면 사용, 없으면 throw.
 * - development: 비어있을 때만 DEV_ONLY_AUTH_SECRET 으로 동작 + 로그 경고.
 */
function resolveAuthSecret(): string {
  const fromEnv =
    (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "").trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] AUTH_SECRET (또는 NEXTAUTH_SECRET) 이 production 환경에 설정되어 있지 않습니다. 빌드/배포를 중단합니다.",
    );
  }

  console.warn(
    "[auth] AUTH_SECRET 미설정 — 개발용 임시 시크릿 사용 중. 배포 전 반드시 .env 에 설정하세요.",
  );
  return DEV_ONLY_AUTH_SECRET;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/blogger",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});
