import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const dashboardPageAuth = withAuth(
  function onDashboard(req) {
    const role = req.nextauth.token?.role as string;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/teachers")) {
      if (role === "ADMIN") return NextResponse.next();
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/subscription-students")) {
      if (role === "ADMIN") return NextResponse.next();
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/students") || path.startsWith("/dashboard/courses/new")) {
      if (path.startsWith("/dashboard/students")) {
        if (role === "ADMIN" || role === "ASSISTANT_ADMIN") {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const teacherBlocked =
      role === "TEACHER" &&
      (path.startsWith("/dashboard/settings/homepage") ||
        path.startsWith("/dashboard/reviews") ||
        path.startsWith("/dashboard/password-change-requests"));
    if (teacherBlocked) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } },
);

async function auditStaffApiMutation(req: NextRequest) {
  const method = req.method.toUpperCase();
  if (!MUTATION_METHODS.has(method)) return;
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/dashboard")) return;
  if (path.includes("/settings/login-log")) return;
  /* already audited with richer details in the route handler */
  if (path.endsWith("/settings/security")) return;

  try {
    const secret =
      process.env.NEXTAUTH_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      (process.env.NODE_ENV !== "production"
        ? "local-dev-only-nextauth-secret-not-for-production"
        : undefined);
    const token = await getToken({ req, secret });
    const role = String(token?.role ?? "");
    if (!token || (role !== "ADMIN" && role !== "ASSISTANT_ADMIN")) return;

    const cookie = req.headers.get("cookie") ?? "";
    const auditUrl = new URL("/api/internal/staff-audit", req.url);
    void fetch(auditUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ method, path }),
    }).catch(() => undefined);
  } catch {
    /* never block API */
  }
}

export default async function middleware(req: NextRequest, event: unknown) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/dashboard")) {
    await auditStaffApiMutation(req);
    return NextResponse.next();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (dashboardPageAuth as any)(req, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
