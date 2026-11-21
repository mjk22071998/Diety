import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { UserRole } from "@diety/types";
import {
  middleware,
  isAuthorizedRole,
  decodeJwtPayload,
  extractToken,
} from "@/middleware";

function createJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mockSignature`;
}

describe("Role Authorization Utility", () => {
  it("allows ADMIN and ARBITRATOR roles", () => {
    expect(isAuthorizedRole(UserRole.ADMIN)).toBe(true);
    expect(isAuthorizedRole(UserRole.ARBITRATOR)).toBe(true);
  });

  it("denies non-admin roles (CLIENT, DIETITIAN, or invalid)", () => {
    expect(isAuthorizedRole(UserRole.CLIENT)).toBe(false);
    expect(isAuthorizedRole(UserRole.DIETITIAN)).toBe(false);
    expect(isAuthorizedRole(undefined)).toBe(false);
    expect(isAuthorizedRole("GUEST")).toBe(false);
  });
});

describe("Token Extraction", () => {
  it("extracts token from cookie or authorization header", () => {
    const cookieReq = new NextRequest(new URL("http://localhost:3002/"), {
      headers: { cookie: "diety_token=cookie-token-123" },
    });
    expect(extractToken(cookieReq)).toBe("cookie-token-123");

    const authReq = new NextRequest(new URL("http://localhost:3002/"), {
      headers: { authorization: "Bearer header-token-456" },
    });
    expect(extractToken(authReq)).toBe("header-token-456");

    const emptyReq = new NextRequest(new URL("http://localhost:3002/"));
    expect(extractToken(emptyReq)).toBeNull();
  });
});

describe("JWT Payload Parsing", () => {
  it("correctly decodes standard JWT payload", () => {
    const token = createJwt({
      sub: "usr_123",
      role: UserRole.ADMIN,
      email: "admin@diety.test",
    });
    const decoded = decodeJwtPayload(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("usr_123");
    expect(decoded?.role).toBe(UserRole.ADMIN);
  });

  it("handles malformed tokens gracefully", () => {
    expect(decodeJwtPayload("invalid.token")).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
  });
});

describe("Edge Security Middleware", () => {
  const baseUrl = "http://localhost:3002";

  it("allows unauthenticated access to /login without redirection", () => {
    const request = new NextRequest(new URL("/login", baseUrl));
    const response = middleware(request);

    // Next.js NextResponse.next() returns status 200
    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated requests on protected routes to /login", () => {
    const request = new NextRequest(new URL("/", baseUrl));
    const response = middleware(request);

    expect(response.status).toBe(307);
    const redirectUrl = response.headers.get("location");
    expect(redirectUrl).toContain("/login");
  });

  it("denies access with 403 Forbidden for CLIENT role in cookie", () => {
    const token = createJwt({
      sub: "client_001",
      role: UserRole.CLIENT,
      email: "client@test.com",
    });

    const request = new NextRequest(new URL("/tribunal", baseUrl), {
      headers: {
        cookie: `diety_token=${token}`,
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(403);
  });

  it("denies access with 403 Forbidden for DIETITIAN role in authorization header", () => {
    const token = createJwt({
      sub: "dietitian_002",
      role: UserRole.DIETITIAN,
      email: "dietitian@test.com",
    });

    const request = new NextRequest(new URL("/credentials", baseUrl), {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(403);
  });

  it("allows access for ADMIN role via diety_token cookie", () => {
    const token = createJwt({
      sub: "admin_master_01",
      role: UserRole.ADMIN,
      email: "admin@diety.platform",
    });

    const request = new NextRequest(new URL("/", baseUrl), {
      headers: {
        cookie: `diety_token=${token}`,
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-user-role")).toBe(UserRole.ADMIN);
  });

  it("allows access for ARBITRATOR role via authorization header", () => {
    const token = createJwt({
      sub: "arbitrator_panel_07",
      role: UserRole.ARBITRATOR,
      email: "arbitrator@diety.platform",
    });

    const request = new NextRequest(new URL("/tribunal", baseUrl), {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-user-role")).toBe(UserRole.ARBITRATOR);
  });

  it("redirects expired tokens to /login", () => {
    const token = createJwt({
      sub: "admin_old",
      role: UserRole.ADMIN,
      exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
    });

    const request = new NextRequest(new URL("/", baseUrl), {
      headers: {
        cookie: `diety_token=${token}`,
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=session_expired");
  });
});
