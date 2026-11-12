/**
 * Layanan Duplikasi Jadwal Mingguan (Weekly Schedule Duplication Engine)
 * PT Pelabuhan Indonesia - Pelabuhan Nusantara Parepare
 */

import { prisma } from './prisma';
import { getWeekBounds } from './date-utils';
import { detectCollisions, ScheduleCandidate } from './collision';

export interface DuplicateScheduleParams {
  sourceScheduleId: string;
  targetYear: number;
  targetWeekNumber: number;
  adminUserId?: string;
}

export async function previewDuplicateSchedule(params: {
  sourceScheduleId: string;
  targetYear: number;
  targetWeekNumber: number;
}) {
  const sourceSchedule = await prisma.weeklySchedule.findUnique({
    where: { id: params.sourceScheduleId },
    include: {
      entries: {
        include: {
          vessel: true,
          berth: true,
        },
      },
    },
  });

  if (!sourceSchedule) {
    throw new Error('Jadwal sumber tidak ditemukan');
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'firstDayOfWeek' },
  });
  const firstDay = setting ? parseInt(setting.value) : 1;

  const targetBounds = getWeekBounds(params.targetYear, params.targetWeekNumber, firstDay);

  // Perbedaan waktu dalam milidetik antara awal minggu sumber dan target
  const timeDifferenceMs = targetBounds.startDate.getTime() - new Date(sourceSchedule.startDate).getTime();

  // Preview data hasil pergeseran tanggal
  const previewEntries = sourceSchedule.entries.map((entry) => {
    const newEta = new Date(new Date(entry.eta).getTime() + timeDifferenceMs);
    const newEtd = new Date(new Date(entry.etd).getTime() + timeDifferenceMs);

    return {
      vesselId: entry.vesselId,
      vesselName: entry.vessel.name,
      vesselCode: entry.vessel.code,
      vesselType: entry.vessel.vesselType,
      loa: entry.vessel.loa,
      berthId: entry.berthId,
      berthName: entry.berth.name,
      eta: newEta,
      etd: newEtd,
      startMeter: entry.startMeter,
      endMeter: entry.endMeter,
      bowPositionMeter: entry.bowPositionMeter,
      sternPositionMeter: entry.sternPositionMeter,
      orientation: entry.orientation,
      dockedLength: entry.dockedLength,
      overhangLength: entry.overhangLength,
      overhangPosition: entry.overhangPosition,
      notes: entry.notes,
    };
  });

  // Validasi potensi benturan internal di antara data yang diduplikasi
  const collisionWarnings: string[] = [];
  const candidates: ScheduleCandidate[] = previewEntries.map((e, idx) => ({
    id: `temp-${idx}`,
    vesselId: e.vesselId,
    vesselName: e.vesselName,
    eta: e.eta,
    etd: e.etd,
    startMeter: e.startMeter,
    endMeter: e.endMeter,
  }));

  for (let i = 0; i < candidates.length; i++) {
    const check = detectCollisions(candidates[i], candidates, candidates[i].id);
    for (const c of check.collisions) {
      if (!collisionWarnings.includes(c.message)) {
        collisionWarnings.push(c.message);
      }
    }
  }

  return {
    source: {
      id: sourceSchedule.id,
      year: sourceSchedule.year,
      weekNumber: sourceSchedule.weekNumber,
      totalEntries: sourceSchedule.entries.length,
    },
    target: {
      year: params.targetYear,
      weekNumber: params.targetWeekNumber,
      startDate: targetBounds.startDate,
      endDate: targetBounds.endDate,
    },
    previewEntries,
    collisionWarnings,
  };
}

export async function executeDuplicateSchedule(params: DuplicateScheduleParams) {
  const preview = await previewDuplicateSchedule({
    sourceScheduleId: params.sourceScheduleId,
    targetYear: params.targetYear,
    targetWeekNumber: params.targetWeekNumber,
  });

  const { target, previewEntries } = preview;

  // Cek apakah target sudah memiliki jadwal
  const existingTarget = await prisma.weeklySchedule.findUnique({
    where: {
      year_weekNumber: {
        year: target.year,
        weekNumber: target.weekNumber,
      },
    },
  });

  if (existingTarget) {
    throw new Error(
      `Jadwal untuk Minggu ke-${target.weekNumber} Tahun ${target.year} sudah ada di database. Hapus atau pilih minggu lain untuk mencegah duplikasi ganda.`
    );
  }

  // Simpan secara transaksional
  const newWeeklySchedule = await prisma.$transaction(async (tx) => {
    const createdSchedule = await tx.weeklySchedule.create({
      data: {
        year: target.year,
        weekNumber: target.weekNumber,
        startDate: target.startDate,
        endDate: target.endDate,
        status: 'AKTIF',
        notes: `Jadwal hasil duplikasi dari Minggu ke-${preview.source.weekNumber} Tahun ${preview.source.year}`,
      },
    });

    for (const item of previewEntries) {
      await tx.scheduleEntry.create({
        data: {
          weeklyScheduleId: createdSchedule.id,
          vesselId: item.vesselId,
          berthId: item.berthId,
          eta: item.eta,
          etd: item.etd,
          startMeter: item.startMeter,
          endMeter: item.endMeter,
          bowPositionMeter: item.bowPositionMeter,
          sternPositionMeter: item.sternPositionMeter,
          orientation: item.orientation,
          dockedLength: item.dockedLength,
          overhangLength: item.overhangLength,
          overhangPosition: item.overhangPosition,
          notes: item.notes,
        },
      });
    }

    if (params.adminUserId) {
      await tx.auditLog.create({
        data: {
          userId: params.adminUserId,
          action: 'DUPLICATE',
          entityType: 'SCHEDULE',
          entityId: createdSchedule.id,
          details: JSON.stringify({
            fromWeek: preview.source.weekNumber,
            fromYear: preview.source.year,
            toWeek: target.weekNumber,
            toYear: target.year,
            copiedCount: previewEntries.length,
          }),
        },
      });
    }

    return createdSchedule;
  });

  return {
    success: true,
    createdSchedule,
    totalCopied: previewEntries.length,
    warnings: preview.collisionWarnings,
  };
}

