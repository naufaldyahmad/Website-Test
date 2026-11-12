import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentIsoWeek } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaultIso = getCurrentIsoWeek();

    // 1. Total Kapal
    const totalVessels = await prisma.vessel.count({
      where: { isDeleted: false },
    });

    // 2. Active Weekly Schedule
    const activeSchedule = await prisma.weeklySchedule.findUnique({
      where: {
        year_weekNumber: {
          year: defaultIso.year,
          weekNumber: defaultIso.weekNumber,
        },
      },
      include: {
        entries: {
          include: {
            vessel: true,
          },
          orderBy: { eta: 'asc' },
        },
      },
    });

    const activeEntriesCount = activeSchedule ? activeSchedule.entries.length : 0;
    
    // Unique vessels scheduled this week
    const activeScheduledVesselsCount = activeSchedule
      ? new Set(activeSchedule.entries.map((e) => e.vesselId)).size
      : 0;

    const earliestEntry = activeSchedule && activeSchedule.entries.length > 0
      ? activeSchedule.entries[0]
      : null;

    const latestEntry = activeSchedule && activeSchedule.entries.length > 0
      ? [...activeSchedule.entries].sort((a, b) => new Date(b.etd).getTime() - new Date(a.etd).getTime())[0]
      : null;

    // 3. Recent Schedules
    const recentSchedules = await prisma.weeklySchedule.findMany({
      take: 5,
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' },
      ],
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    // 4. Recent Audit Logs
    const recentActivities = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, username: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalVessels,
        activeWeek: {
          year: defaultIso.year,
          weekNumber: defaultIso.weekNumber,
          startDate: activeSchedule?.startDate || null,
          endDate: activeSchedule?.endDate || null,
          entriesCount: activeEntriesCount,
          vesselsCount: activeScheduledVesselsCount,
          earliestVessel: earliestEntry
            ? { name: earliestEntry.vessel.name, eta: earliestEntry.eta }
            : null,
          latestVessel: latestEntry
            ? { name: latestEntry.vessel.name, etd: latestEntry.etd }
            : null,
        },
      },
      recentSchedules,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik dashboard' }, { status: 500 });
  }
}

