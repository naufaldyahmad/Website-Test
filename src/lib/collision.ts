/**
 * Algoritma Deteksi Benturan Jadwal Sandar (Collision Detection Engine)
 * PT Pelabuhan Indonesia - Pelabuhan Nusantara Parepare
 */

import { formatWitaDateTime, formatWitaTimeOnly } from './date-utils';

export interface ScheduleCandidate {
  id?: string;
  vesselId: string;
  vesselName: string;
  eta: Date | string;
  etd: Date | string;
  startMeter: number;
  endMeter: number;
  bowPositionMeter?: number;
  sternPositionMeter?: number;
  orientation?: string;
  dockedLength?: number;
  overhangLength?: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  collisions: {
    conflictingEntryId?: string;
    conflictingVesselName: string;
    overlapStartMeter: number;
    overlapEndMeter: number;
    overlapStartTime: Date;
    overlapEndTime: Date;
    message: string;
  }[];
}

export function detectCollisions(
  candidate: ScheduleCandidate,
  existingEntries: ScheduleCandidate[],
  ignoreEntryId?: string
): CollisionResult {
  const cEta = new Date(candidate.eta).getTime();
  const cEtd = new Date(candidate.etd).getTime();
  const cStartM = Math.min(candidate.startMeter, candidate.endMeter);
  const cEndM = Math.max(candidate.startMeter, candidate.endMeter);

  const collisions: CollisionResult['collisions'] = [];

  for (const entry of existingEntries) {
    if (ignoreEntryId && entry.id === ignoreEntryId) continue;
    if (candidate.id && entry.id === candidate.id) continue;

    const eEta = new Date(entry.eta).getTime();
    const eEtd = new Date(entry.etd).getTime();
    const eStartM = Math.min(entry.startMeter, entry.endMeter);
    const eEndM = Math.max(entry.startMeter, entry.endMeter);

    // 1. Cek Irisan Waktu (Temporal Overlap): Max(ETA_A, ETA_B) < Min(ETD_A, ETD_B)
    const timeOverlapStart = Math.max(cEta, eEta);
    const timeOverlapEnd = Math.min(cEtd, eEtd);
    const hasTimeOverlap = timeOverlapStart < timeOverlapEnd;

    if (!hasTimeOverlap) continue;

    // 2. Cek Irisan Posisi Dermaga (Spatial Overlap): Max(Start_A, Start_B) < Min(End_A, End_B)
    const spaceOverlapStart = Math.max(cStartM, eStartM);
    const spaceOverlapEnd = Math.min(cEndM, eEndM);
    const hasSpaceOverlap = spaceOverlapStart < spaceOverlapEnd;

    if (hasSpaceOverlap) {
      const overlapStartDt = new Date(timeOverlapStart);
      const overlapEndDt = new Date(timeOverlapEnd);

      const message = `Perhatian: Jadwal kapal ${candidate.vesselName} berpotensi berbenturan dengan ${entry.vesselName} pada posisi dermaga ${spaceOverlapStart.toFixed(1)}–${spaceOverlapEnd.toFixed(1)} meter dan rentang waktu ${formatWitaDateTime(overlapStartDt)} s.d ${formatWitaTimeOnly(overlapEndDt)}.`;

      collisions.push({
        conflictingEntryId: entry.id,
        conflictingVesselName: entry.vesselName,
        overlapStartMeter: spaceOverlapStart,
        overlapEndMeter: spaceOverlapEnd,
        overlapStartTime: overlapStartDt,
        overlapEndTime: overlapEndDt,
        message,
      });
    }
  }

  return {
    hasCollision: collisions.length > 0,
    collisions,
  };
}

