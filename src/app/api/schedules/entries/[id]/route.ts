import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectCollisions, ScheduleCandidate } from '@/lib/collision';
import { getSession } from '@/lib/auth';
import { parseDateTimeLocalInput } from '@/lib/date-utils';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id: params.id },
      include: { vessel: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Entri jadwal tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    const {
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

    const newEta = eta
      ? typeof eta === 'string' && !eta.endsWith('Z') && eta.includes('T')
        ? parseDateTimeLocalInput(eta)
        : new Date(eta)
      : existing.eta;

    const newEtd = etd
      ? typeof etd === 'string' && !etd.endsWith('Z') && etd.includes('T')
        ? parseDateTimeLocalInput(etd)
        : new Date(etd)
      : existing.etd;

    if (newEta.getTime() >= newEtd.getTime()) {
      return NextResponse.json(
        { error: 'Waktu ETD harus lebih lambat dari waktu ETA' },
        { status: 400 }
      );
    }

    const targetVesselId = vesselId || existing.vesselId;
    const vessel = await prisma.vessel.findUnique({ where: { id: targetVesselId } });
    if (!vessel) {
      return NextResponse.json({ error: 'Kapal tidak ditemukan' }, { status: 404 });
    }

    const sMeter = startMeter !== undefined ? parseFloat(startMeter) : existing.startMeter;
    const eMeter = endMeter !== undefined ? parseFloat(endMeter) : existing.endMeter;

    // Check collision with other entries
    const otherEntries = await prisma.scheduleEntry.findMany({
      where: {
        weeklyScheduleId: existing.weeklyScheduleId,
        id: { not: existing.id },
      },
      include: { vessel: true },
    });

    const candidates: ScheduleCandidate[] = otherEntries.map((e) => ({
      id: e.id,
      vesselId: e.vesselId,
      vesselName: e.vessel.name,
      eta: e.eta,
      etd: e.etd,
      startMeter: e.startMeter,
      endMeter: e.endMeter,
    }));

    const updatedCandidate: ScheduleCandidate = {
      id: existing.id,
      vesselId: vessel.id,
      vesselName: vessel.name,
      eta: newEta,
      etd: newEtd,
      startMeter: sMeter,
      endMeter: eMeter,
    };

    const collisionCheck = detectCollisions(updatedCandidate, candidates, existing.id);

    const updated = await prisma.scheduleEntry.update({
      where: { id: params.id },
      data: {
        vesselId: vessel.id,
        berthId: berthId || existing.berthId,
        eta: newEta,
        etd: newEtd,
        startMeter: sMeter,
        endMeter: eMeter,
        bowPositionMeter: bowPositionMeter !== undefined ? parseFloat(bowPositionMeter) : existing.bowPositionMeter,
        sternPositionMeter: sternPositionMeter !== undefined ? parseFloat(sternPositionMeter) : existing.sternPositionMeter,
        orientation: orientation || existing.orientation,
        dockedLength: dockedLength !== undefined ? parseFloat(dockedLength) : existing.dockedLength,
        overhangLength: overhangLength !== undefined ? parseFloat(overhangLength) : existing.overhangLength,
        overhangPosition: overhangPosition || existing.overhangPosition,
        notes: notes !== undefined ? notes?.trim() : existing.notes,
      },
      include: {
        vessel: true,
        berth: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'UPDATE',
        entityType: 'SCHEDULE_ENTRY',
        entityId: updated.id,
        details: JSON.stringify({ vessel: vessel.name }),
      },
    });

    return NextResponse.json({
      success: true,
      entry: updated,
      collisionWarning: collisionCheck.hasCollision ? collisionCheck.collisions : null,
    });
  } catch (error) {
    console.error('Error updating schedule entry:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jadwal kapal' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id: params.id },
      include: { vessel: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 });
    }

    await prisma.scheduleEntry.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'DELETE',
        entityType: 'SCHEDULE_ENTRY',
        entityId: params.id,
        details: JSON.stringify({ vesselName: existing.vessel.name }),
      },
    });

    return NextResponse.json({ success: true, message: 'Entri jadwal sandar berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting schedule entry:', error);
    return NextResponse.json({ error: 'Gagal menghapus entri jadwal' }, { status: 500 });
  }
}
