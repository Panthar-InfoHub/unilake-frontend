import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/app/types/auth";

// ── Route config ───────────────────────────────────────────────────────────────
const PROTECTED_USER_ROUTES = ["/dashboard"];
const PROTECTED_ADMIN_ROUTES = ["/admin"];
const PUBLIC_ROUTES = ["/login", "/", "/terms", "/privacy"];

// ── Session cookie name — must match what Better Auth sets on the backend ──────
const SESSION_COOKIE_NAME = "better-auth.session_token";

// ── Helpers ────────────────────────────────────────────────────────────────────
function isPathUnder(pathname: string, prefixes: string[]): boolean {
    return prefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

// ── Proxy function (Next.js 16 — "middleware" is deprecated) ───────────────────
export function proxy(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    // Read the session cookie — Better Auth sets this automatically
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    const hasSession = Boolean(sessionCookie?.value);

    // Attempt to read role from a separate lightweight cookie the backend may set
    // e.g. better-auth.session_data or a custom role cookie
    const roleCookie = request.cookies.get("user_role");
    const role = roleCookie?.value as UserRole | undefined;

    const isAdminRoute = isPathUnder(pathname, PROTECTED_ADMIN_ROUTES);
    const isUserRoute = isPathUnder(pathname, PROTECTED_USER_ROUTES);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // ── Unauthenticated user trying to access protected routes ─────────────────
    if ((isAdminRoute || isUserRoute) && !hasSession) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("returnTo", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ── Authenticated user trying to access /admin without ADMIN role ──────────
    if (isAdminRoute && hasSession && role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ── Authenticated user trying to visit /login → redirect to dashboard ──────
    if (isPublicRoute && pathname === "/login" && hasSession) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

// ── Matcher: run on all pages except static assets and API routes ──────────────
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
