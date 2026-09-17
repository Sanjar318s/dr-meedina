import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE = "dr_meedina_admin";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(login: string) {
  return new SignJWT({ login, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as { login: string; role: string };
}

export async function setAdminSession(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export { COOKIE as ADMIN_COOKIE };
