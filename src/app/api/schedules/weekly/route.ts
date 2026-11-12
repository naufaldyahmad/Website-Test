import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentIsoWeek, getWeekBounds } from '@/lib/date-utils';
import { detectCollisions, ScheduleCandidate } from '@/lib/collision';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get first day of week setting
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'firstDayOfWeek' },
    });
    const firstDay = setting ? parseInt(setting.value) : 1;

    const defaultIso = getCurrentIsoWeek(firstDay);

    const weekNumber = searchParams.get('week')
      ? parseInt(searchParams.get('week')!)
      : defaultIso.weekNumber;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : defaultIso.year;

    const bounds = getWeekBounds(year, weekNumber, firstDay);

    let weeklySchedule = await prisma.weeklySchedule.findUnique({
      where: {
        year_weekNumber: {
          year,
          weekNumber,
        },
      },
      include: {
        entries: {
          include: {
            vessel: true,
            berth: true,
          },
          orderBy: { eta: 'asc' },
        },
      },
    });

    // Auto-create blank schedule if not exists yet
    if (!weeklySchedule) {
      weeklySchedule = await prisma.weeklySchedule.create({
        data: {
          year,
          weekNumber,
          startDate: bounds.startDate,
          endDate: bounds.endDate,
          status: 'AKTIF',
          notes: `Jadwal Mingguan Periode Minggu ke-${weekNumber} Tahun ${year}`,
        },
        include: {
          entries: {
            include: {
              vessel: true,
              berth: true,
            },
          },
        },
      });
    } else {
      // Sync date bounds with firstDay setting if needed
      if (
        weeklySchedule.startDate.getTime() !== bounds.startDate.getTime() ||
        weeklySchedule.endDate.getTime() !== bounds.endDate.getTime()
      ) {
        weeklySchedule = await prisma.weeklySchedule.update({
          where: { id: weeklySchedule.id },
          data: {
            startDate: bounds.startDate,
            endDate: bounds.endDate,
          },
          include: {
            entries: {
              include: {
                vessel: true,
                berth: true,
              },
              orderBy: { eta: 'asc' },
            },
          },
        });
      }
    }

    // Run collision detection across all entries in the week
    const candidates: ScheduleCandidate[] = weeklySchedule.entries.map((entry) => ({
      id: entry.id,
      vesselId: entry.vesselId,
      vesselName: entry.vessel.name,
      eta: entry.eta,
      etd: entry.etd,
      startMeter: entry.startMeter,
      endMeter: entry.endMeter,
    }));

    const collisionsMap: Record<string, string[]> = {};
    const globalCollisionWarnings: string[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const check = detectCollisions(candidates[i], candidates, candidates[i].id);
      if (check.hasCollision) {
        collisionsMap[candidates[i].id!] = check.collisions.map((c) => c.message);
        for (const c of check.collisions) {
          if (!globalCollisionWarnings.includes(c.message)) {
            globalCollisionWarnings.push(c.message);
          }
        }
      }
    }

    return NextResponse.json({
      schedule: weeklySchedule,
      firstDayOfWeek: firstDay,
      collisionsMap,
      globalCollisionWarnings,
    });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    return NextResponse.json(
      { error: 'Gagal memuat jadwal mingguan kapal' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === 'VISITOR') {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi untuk membuat jadwal' }, { status: 403 });
    }

    const body = await req.json();
    const { year, weekNumber, notes, status } = body;

    if (!year || !weekNumber) {
      return NextResponse.json({ error: 'Tahun dan nomor minggu wajib diisi' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'firstDayOfWeek' },
    });
    const firstDay = setting ? parseInt(setting.value) : 1;

    const bounds = getWeekBounds(parseInt(year), parseInt(weekNumber), firstDay);

    const schedule = await prisma.weeklySchedule.upsert({
      where: {
        year_weekNumber: {
          year: parseInt(year),
          weekNumber: parseInt(weekNumber),
        },
      },
      update: {
        notes: notes || undefined,
        status: status || undefined,
      },
      create: {
        year: parseInt(year),
        weekNumber: parseInt(weekNumber),
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        notes: notes || `Jadwal Mingguan Periode Minggu ke-${weekNumber} Tahun ${year}`,
        status: status || 'AKTIF',
      },
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error('Error creating weekly schedule:', error);
    return NextResponse.json({ error: 'Gagal membuat periode jadwal' }, { status: 500 });
  }
}
