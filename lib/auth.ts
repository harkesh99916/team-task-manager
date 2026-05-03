import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "ttm_token";

type AuthTokenPayload = {
  userId: string;
  email: string;
  name: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as AuthTokenPayload;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: true,   // 🔥 force true
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getAuthenticatedUser() {
  const headerStore = headers();
  const headerId = headerStore.get("x-user-id");
  const headerEmail = headerStore.get("x-user-email");
  const headerName = headerStore.get("x-user-name");

  if (headerId && headerEmail && headerName) {
    return {
      id: headerId,
      email: headerEmail,
      name: decodeURIComponent(headerName)
    };
  }

  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name
    };
  } catch {
    return null;
  }
}
