import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'pelindo_berthing_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'pelindo_parepare_secret_key_2026';

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

// Simple signed token encoding for sessions
export function signSessionToken(payload: SessionUser): string {
  const jsonStr = JSON.stringify(payload);
  const base64Str = Buffer.from(jsonStr).toString('base64');
  // Simple checksum using secret
  const checksum = Buffer.from(`${base64Str}:${SESSION_SECRET}`).toString('base64');
  return `${base64Str}.${checksum}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Str, checksum] = parts;
    const expectedChecksum = Buffer.from(`${base64Str}:${SESSION_SECRET}`).toString('base64');
    if (checksum !== expectedChecksum) return null;

    const jsonStr = Buffer.from(base64Str, 'base64').toString('utf-8');
    return JSON.parse(jsonStr) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const token = signSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

