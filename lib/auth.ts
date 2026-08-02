import type { NextAuthOptions } from "next-auth";
import { decode as defaultJwtDecode } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { getUserByEmailOrPhone, getCurrentSessionId, setCurrentSessionId } from "@/lib/db";
import type { UserRole } from "@/lib/types";
import { CONCURRENT_SESSION_ERROR } from "@/lib/auth-constants";
import {
  getClientIpFromHeaders,
  recordAdminAudit,
  recordFailedLogin,
  recordUserLogin,
} from "@/lib/admin-security-db";

export { CONCURRENT_SESSION_ERROR };

/**
 * NextAuth requires a stable secret. If NEXTAUTH_SECRET is missing, NextAuth hashes the whole
 * config object — that hash changes on hot reload / edits and breaks existing session cookies
 * (JWEDecryptionFailed). In development only, use a fixed fallback when env is unset.
 */
function resolveNextAuthSecret(): string {
  const fromEnv =
    process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-only-nextauth-secret-not-for-production";
  }
  throw new Error(
    "NEXTAUTH_SECRET or AUTH_SECRET must be set in production. See .env.example."
  );
}

const nextAuthSecret = resolveNextAuthSecret();

function requestMeta(req: unknown): { ip: string | null; userAgent: string | null } {
  try {
    const headers =
      req && typeof req === "object" && "headers" in req
        ? ((req as { headers: Headers | { get(name: string): string | null } }).headers)
        : null;
    if (!headers || typeof headers.get !== "function") {
      return { ip: null, userAgent: null };
    }
    return {
      ip: getClientIpFromHeaders(headers),
      userAgent: headers.get("user-agent"),
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني أو رقم الهاتف", type: "text" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials, req) {
        const { ip, userAgent } = requestMeta(req);
        const loginId = credentials?.email?.trim() ?? "";

        if (!credentials?.email || !credentials?.password) {
          await recordFailedLogin({
            email: loginId || null,
            ip,
            userAgent,
            reason: "missing_credentials",
          }).catch(() => undefined);
          return null;
        }

        const user = await getUserByEmailOrPhone(credentials.email);
        if (!user) {
          await recordFailedLogin({
            email: loginId,
            ip,
            userAgent,
            reason: "user_not_found",
          }).catch(() => undefined);
          return null;
        }

        const ok = await compare(credentials.password, user.password_hash);
        if (!ok) {
          await recordFailedLogin({
            email: user.email,
            userId: user.id,
            ip,
            userAgent,
            reason: "invalid_password",
          }).catch(() => undefined);
          return null;
        }

        const suspended = Boolean(
          (user as { is_suspended?: boolean }).is_suspended ??
            (user as { isSuspended?: boolean }).isSuspended,
        );
        if (suspended) {
          await recordFailedLogin({
            email: user.email,
            userId: user.id,
            ip,
            userAgent,
            reason: "account_suspended",
          }).catch(() => undefined);
          throw new Error("ACCOUNT_SUSPENDED");
        }

        const existingSessionId = await getCurrentSessionId(user.id);
        if (existingSessionId != null && existingSessionId !== "") {
          await recordFailedLogin({
            email: user.email,
            userId: user.id,
            ip,
            userAgent,
            reason: "concurrent_session",
          }).catch(() => undefined);
          throw new Error(CONCURRENT_SESSION_ERROR);
        }

        const sessionId = randomUUID();
        await setCurrentSessionId(user.id, sessionId);
        try {
          const { updateUser } = await import("@/lib/db");
          await updateUser(user.id, { last_login_at: new Date() });
          await recordUserLogin({
            userId: user.id,
            email: user.email,
            ip,
            userAgent,
            sessionId,
          });
          if (user.role === "ADMIN" || user.role === "ASSISTANT_ADMIN") {
            await recordAdminAudit({
              actorId: user.id,
              actorEmail: user.email,
              action: "login",
              ip,
              userAgent,
              method: "POST",
              path: "/api/auth/callback/credentials",
            }).catch(() => undefined);
          }
        } catch {
          /* columns / audit may not be ready */
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: null,
          sessionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role;
        token.sessionId = (user as { sessionId?: string }).sessionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        const { getCurrentSessionId: getSessionId } = await import("@/lib/db");
        const dbSessionId = await getSessionId((session.user as { id: string }).id);
        const sessionMismatch = !dbSessionId || dbSessionId.trim() === "" || dbSessionId !== token.sessionId;
        if (token.sessionId && sessionMismatch) {
          (session as { forceLogout?: boolean }).forceLogout = true;
        }
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/`;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: nextAuthSecret,
  jwt: {
    async decode(params) {
      try {
        return await defaultJwtDecode(params);
      } catch {
        // Stale cookie after secret rotation, or legacy token from unstable default secret
        return null;
      }
    },
  },
};
