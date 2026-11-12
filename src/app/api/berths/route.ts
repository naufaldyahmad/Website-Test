import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const berths = await prisma.berth.findMany({
      orderBy: { code: 'asc' },
    });
    return NextResponse.json({ berths });
  } catch (error) {
    console.error('Error fetching berths:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dermaga' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, lengthMeters, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID dermaga wajib disediakan' }, { status: 400 });
    }

    const numLength = lengthMeters ? parseFloat(lengthMeters) : undefined;
    if (numLength !== undefined && numLength <= 0) {
      return NextResponse.json({ error: 'Panjang dermaga harus positif' }, { status: 400 });
    }

    const updated = await prisma.berth.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(numLength !== undefined && { lengthMeters: numLength }),
        ...(description !== undefined && { description: description.trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'UPDATE',
        entityType: 'BERTH',
        entityId: updated.id,
        details: JSON.stringify({ name: updated.name, lengthMeters: updated.lengthMeters }),
      },
    });

    return NextResponse.json({ success: true, berth: updated });
  } catch (error) {
    console.error('Error updating berth:', error);
    return NextResponse.json({ error: 'Gagal memperbarui konfigurasi dermaga' }, { status: 500 });
  }
}

