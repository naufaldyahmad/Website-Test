import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectCollisions, ScheduleCandidate } from '@/lib/collision';
import { getSession } from '@/lib/auth';
import { parseDateTimeLocalInput } from '@/lib/date-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    if (session.role === 'VISITOR') {
      return NextResponse.json(
        { error: 'Pengguna dengan peran Visitor hanya memiliki hak akses baca (read-only)' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      weeklyScheduleId,
      vesselId,
      berthId,
      eta,
      etd,
      startMeter,
      endMeter,
      bowPositionMeter,
      sternPositionMeter,
      orientation,
      dockedLength,
      overhangLength,
      overhangPosition,
      notes,
    } = body;

    if (!weeklyScheduleId || !vesselId || !berthId || !eta || !etd) {
      return NextResponse.json(
        { error: 'Data jadwal belum lengkap (Kapal, Dermaga, ETA, dan ETD wajib diisi)' },
        { status: 400 }
      );
    }

    const etaDate = typeof eta === 'string' && !eta.endsWith('Z') && eta.includes('T')
      ? parseDateTimeLocalInput(eta)
      : new Date(eta);

    const etdDate = typeof etd === 'string' && !etd.endsWith('Z') && etd.includes('T')
      ? parseDateTimeLocalInput(etd)
      : new Date(etd);

    if (etaDate.getTime() >= etdDate.getTime()) {
      return NextResponse.json(
        { error: 'Waktu ETD (Keberangkatan) harus lebih lambat dari waktu ETA (Kedatangan)' },
        { status: 400 }
      );
    }

    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel) {
      return NextResponse.json({ error: 'Kapal tidak ditemukan' }, { status: 404 });
    }

    const berth = await prisma.berth.findUnique({ where: { id: berthId } });
    if (!berth) {
      return NextResponse.json({ error: 'Dermaga tidak ditemukan' }, { status: 404 });
    }

    const sMeter = parseFloat(startMeter);
    const eMeter = parseFloat(endMeter);
    const bowM = bowPositionMeter !== undefined ? parseFloat(bowPositionMeter) : eMeter;
    const sternM = sternPositionMeter !== undefined ? parseFloat(sternPositionMeter) : sMeter;
    const dLength = dockedLength !== undefined ? parseFloat(dockedLength) : Math.abs(eMeter - sMeter);
    const oLength = overhangLength !== undefined ? parseFloat(overhangLength) : 0;

    // Check collisions with other entries in this weekly schedule
    const existingEntries = await prisma.scheduleEntry.findMany({
      where: { weeklyScheduleId },
      include: { vessel: true },
    });

    const candidates: ScheduleCandidate[] = existingEntries.map((e) => ({
      id: e.id,
      vesselId: e.vesselId,
      vesselName: e.vessel.name,
      eta: e.eta,
      etd: e.etd,
      startMeter: e.startMeter,
      endMeter: e.endMeter,
    }));

    const newCandidate: ScheduleCandidate = {
      vesselId,
      vesselName: vessel.name,
      eta: etaDate,
      etd: etdDate,
      startMeter: sMeter,
      endMeter: eMeter,
    };

    const collisionCheck = detectCollisions(newCandidate, candidates);

    // Create entry in database
    const created = await prisma.scheduleEntry.create({
      data: {
        weeklyScheduleId,
        vesselId,
        berthId,
        eta: etaDate,
        etd: etdDate,
        startMeter: sMeter,
        endMeter: eMeter,
        bowPositionMeter: bowM,
        sternPositionMeter: sternM,
        orientation: orientation || 'BOW_NORTH_STERN_SOUTH',
        dockedLength: dLength,
        overhangLength: oLength,
        overhangPosition: overhangPosition || 'NONE',
        notes: notes ? notes.trim() : null,
      },
      include: {
        vessel: true,
        berth: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'CREATE',
        entityType: 'SCHEDULE_ENTRY',
        entityId: created.id,
        details: JSON.stringify({
          vessel: vessel.name,
          eta: created.eta,
          etd: created.etd,
          meter: `${sMeter}-${eMeter}`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      entry: created,
      collisionWarning: collisionCheck.hasCollision ? collisionCheck.collisions : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding schedule entry:', error);
    return NextResponse.json({ error: 'Gagal menambahkan entri jadwal sandar' }, { status: 500 });
  }
}
