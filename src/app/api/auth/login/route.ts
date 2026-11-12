import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password tidak valid' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Username atau password tidak valid' },
        { status: 401 }
      );
    }

    // Set Session Cookie
    await setSessionCookie({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'AUTH',
        details: JSON.stringify({ ip: req.headers.get('x-forwarded-for') || 'local' }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat proses autentikasi' },
      { status: 500 }
    );
  }
}

