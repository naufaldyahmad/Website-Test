import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      firstDayOfWeek: '1', // default Senin
    };

    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Gagal memuat pengaturan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang berwenang mengubah pengaturan' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Parameter key dan value wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'UPDATE_SETTING',
        entityType: 'SETTING',
        entityId: updated.id,
        details: JSON.stringify({ key, value }),
      },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}

