import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const DEV_ONLY_AUTH_SECRET =
  "keg-book-dev-only-auth-secret-not-for-production";

let warnedMissingAuthSecret = false;

/**
 * 공개 배포 전에는 `AUTH_SECRET`(또는 `NEXTAUTH_SECRET`) 설정을 권장.
 * 비어 있으면 Auth.js `MissingSecret`·500을 피하기 위해 개발용 기본 시크릿으로 채운다.
 * `NODE_ENV === "production"` 이고 비어 있을 때만 서버 로그에 한 번 경고한다.
 */
function resolveAuthSecret(): string {
  const fromEnv =
    (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "").trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return DEV_ONLY_AUTH_SECRET;
  }

  if (!warnedMissingAuthSecret) {
    warnedMissingAuthSecret = true;
    console.error(
      "[auth] AUTH_SECRET / NEXTAUTH_SECRET 이 비어 있습니다. 공개 서비스 전에는 반드시 설정하세요. 지금은 개발용 기본 시크릿으로 동작합니다.",
    );
  }
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
