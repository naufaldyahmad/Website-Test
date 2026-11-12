import { NextRequest, NextResponse } from 'next/server';
import { previewDuplicateSchedule, executeDuplicateSchedule } from '@/lib/duplication';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceScheduleId = searchParams.get('sourceScheduleId');
    const targetYear = parseInt(searchParams.get('targetYear') || '0');
    const targetWeekNumber = parseInt(searchParams.get('targetWeekNumber') || '0');

    if (!sourceScheduleId || !targetYear || !targetWeekNumber) {
      return NextResponse.json(
        { error: 'Parameter sourceScheduleId, targetYear, dan targetWeekNumber wajib disertakan' },
        { status: 400 }
      );
    }

    const preview = await previewDuplicateSchedule({
      sourceScheduleId,
      targetYear,
      targetWeekNumber,
    });

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('Error previewing duplication:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pratinjau duplikasi jadwal' },
      { status: 400 }
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
    const { sourceScheduleId, targetYear, targetWeekNumber } = body;

    if (!sourceScheduleId || !targetYear || !targetWeekNumber) {
      return NextResponse.json(
        { error: 'ID jadwal sumber, tahun target, dan nomor minggu target wajib diisi' },
        { status: 400 }
      );
    }

    const result = await executeDuplicateSchedule({
      sourceScheduleId,
      targetYear: parseInt(targetYear),
      targetWeekNumber: parseInt(targetWeekNumber),
      adminUserId: session.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error executing duplication:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menduplikasi jadwal mingguan' },
      { status: 400 }
    );
  }
}

