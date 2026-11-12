import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vessel = await prisma.vessel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { schedules: true },
        },
      },
    });

    if (!vessel) {
      return NextResponse.json({ error: 'Kapal tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ vessel });
  } catch (error) {
    console.error('Error fetching vessel:', error);
    return NextResponse.json({ error: 'Gagal memuat detail kapal' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    const body = await req.json();
    const { name, vesselType, loa, beam, draft, grossTonnage, agentName, remarks, imageUrl } = body;

    const existing = await prisma.vessel.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kapal tidak ditemukan' }, { status: 404 });
    }

    const numLoa = loa !== undefined ? parseFloat(loa) : existing.loa;
    const numBeam = beam !== undefined ? parseFloat(beam) : existing.beam;
    const numDraft = draft !== undefined ? parseFloat(draft) : existing.draft;
    const numGt = grossTonnage !== undefined ? parseFloat(grossTonnage) : existing.grossTonnage;

    if (numLoa <= 0) {
      return NextResponse.json({ error: 'Panjang kapal (LOA) harus positif' }, { status: 400 });
    }

    const updated = await prisma.vessel.update({
      where: { id: params.id },
      data: {
        name: name ? name.trim().toUpperCase() : existing.name,
        vesselType: vesselType || existing.vesselType,
        loa: numLoa,
        beam: numBeam,
        draft: numDraft,
        grossTonnage: numGt,
        agentName: agentName !== undefined ? agentName?.trim() : existing.agentName,
        remarks: remarks !== undefined ? remarks?.trim() : existing.remarks,
        imageUrl: imageUrl || existing.imageUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'UPDATE',
        entityType: 'VESSEL',
        entityId: updated.id,
        details: JSON.stringify({ name: updated.name }),
      },
    });

    return NextResponse.json({ success: true, vessel: updated });
  } catch (error) {
    console.error('Error updating vessel:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data kapal' }, { status: 500 });
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

    const vessel = await prisma.vessel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { schedules: true },
        },
      },
    });

    if (!vessel) {
      return NextResponse.json({ error: 'Kapal tidak ditemukan' }, { status: 404 });
    }

    // Safe deletion: If vessel already has schedule entries, perform soft delete
    if (vessel._count.schedules > 0) {
      await prisma.vessel.update({
        where: { id: params.id },
        data: { isDeleted: true },
      });
    } else {
      await prisma.vessel.delete({
        where: { id: params.id },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'DELETE',
        entityType: 'VESSEL',
        entityId: vessel.id,
        details: JSON.stringify({ name: vessel.name, hadSchedules: vessel._count.schedules > 0 }),
      },
    });

    return NextResponse.json({
      success: true,
      message: vessel._count.schedules > 0
        ? 'Data kapal dinonaktifkan (soft delete) untuk mempertahankan riwayat jadwal sandar'
        : 'Data kapal berhasil dihapus permanen',
    });
  } catch (error) {
    console.error('Error deleting vessel:', error);
    return NextResponse.json({ error: 'Gagal menghapus kapal' }, { status: 500 });
  }
}

