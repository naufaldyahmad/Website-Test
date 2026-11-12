import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const whereClause: any = {};
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { agentName: { contains: search } },
      ];
    }
    if (type) {
      whereClause.vesselType = type;
    }

    const vessels = await prisma.vessel.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ vessels });
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data master kapal' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, vesselType, loa, beam, draft, grossTonnage, agentName, remarks, imageUrl } = body;

    if (!code || !name || !loa) {
      return NextResponse.json(
        { error: 'Kode kapal, Nama kapal, dan LOA (Panjang) wajib diisi' },
        { status: 400 }
      );
    }

    const numLoa = parseFloat(loa);
    const numBeam = parseFloat(beam || 0);
    const numDraft = parseFloat(draft || 0);
    const numGt = parseFloat(grossTonnage || 0);

    if (numLoa <= 0) {
      return NextResponse.json(
        { error: 'Panjang kapal (LOA) harus berupa angka positif' },
        { status: 400 }
      );
    }

    // Check unique code
    const existing = await prisma.vessel.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Kode kapal ${code} sudah terdaftar dalam sistem` },
        { status: 400 }
      );
    }

    const vessel = await prisma.vessel.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim().toUpperCase(),
        vesselType: vesselType || 'Kargo Umum',
        loa: numLoa,
        beam: numBeam,
        draft: numDraft,
        grossTonnage: numGt,
        agentName: agentName ? agentName.trim() : null,
        remarks: remarks ? remarks.trim() : null,
        imageUrl: imageUrl || '/images/vessels/sample-ship.svg',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'CREATE',
        entityType: 'VESSEL',
        entityId: vessel.id,
        details: JSON.stringify({ name: vessel.name, code: vessel.code }),
      },
    });

    return NextResponse.json({ success: true, vessel }, { status: 201 });
  } catch (error) {
    console.error('Error creating vessel:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menambahkan kapal' },
      { status: 500 }
    );
  }
}

