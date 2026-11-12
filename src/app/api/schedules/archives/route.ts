import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const vesselSearch = searchParams.get('vessel') || '';

    const whereClause: any = {};
    if (year) {
      whereClause.year = year;
    }

    if (vesselSearch) {
      whereClause.entries = {
        some: {
          vessel: {
            name: { contains: vesselSearch },
          },
        },
      };
    }

    const schedules = await prisma.weeklySchedule.findMany({
      where: whereClause,
      include: {
        entries: {
          include: {
            vessel: true,
            berth: true,
          },
          orderBy: { eta: 'asc' },
        },
      },
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' },
      ],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json({ error: 'Gagal memuat arsip jadwal' }, { status: 500 });
  }
}

