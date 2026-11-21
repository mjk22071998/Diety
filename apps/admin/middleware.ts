import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@diety/types";

export const ALLOWED_ROLES: string[] = [UserRole.ADMIN, UserRole.ARBITRATOR];

export interface DecodedToken {
  sub?: string;
  email?: string;
  role?: string;
  status?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Extracts authentication token from either:
 * 1. `diety_token` cookie
 * 2. `authorization` header (Bearer <token> or raw token)
 */
export function extractToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("diety_token");
  if (cookie?.value) {
    return cookie.value;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      return authHeader.slice(7).trim();
    }
    return authHeader.trim();
  }

  return null;
}

/**
 * Decodes base64url JWT payload or parses JSON token payload.
 */
export function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length >= 2 && parts[1]) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      
      if (typeof Buffer !== "undefined") {
        const decoded = Buffer.from(padded, "base64").toString("utf-8");
        return JSON.parse(decoded);
      }

      const decodedString = decodeURIComponent(
        atob(padded)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(decodedString);
    }

    // Try parsing raw JSON (for test mocks or simplified tokens)
    return JSON.parse(token);
  } catch {
    return null;
  }
}

/**
 * Verifies if user has ADMIN or ARBITRATOR privileges.
 */
export function isAuthorizedRole(role?: string): boolean {
  if (!role) return false;
  return role === UserRole.ADMIN || role === UserRole.ARBITRATOR;
}

/**
 * Edge security middleware for Admin & Tribunal Console (port 3302).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login route and public static assets without redirection
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Extract token from cookie or authorization header
  const token = extractToken(request);
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Decode payload
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_token");
    return NextResponse.redirect(loginUrl);
  }

  // Check token expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    return NextResponse.redirect(loginUrl);
  }

  // 4. Validate role: ADMIN or ARBITRATOR
  if (!isAuthorizedRole(payload.role)) {
    // Return 403 Forbidden for unauthorized roles (e.g. CLIENT, DIETITIAN)
    return new NextResponse(
      JSON.stringify({
        error: "Forbidden",
        message: "Access denied. Insufficient administrative privileges.",
        role: payload.role,
      }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      }
    );
  }

  // Authorized role: forward request
  const response = NextResponse.next();
  if (payload.sub) {
    response.headers.set("x-user-id", payload.sub);
  }
  if (payload.role) {
    response.headers.set("x-user-role", payload.role);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
