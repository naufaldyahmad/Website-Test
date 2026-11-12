'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Ship,
  Calendar,
  Clock,
  Compass,
  AlertTriangle,
  Trash2,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatDateTimeLocalInput, parseDateTimeLocalInput } from '@/lib/date-utils';
import { detectCollisions, ScheduleCandidate } from '@/lib/collision';

interface Vessel {
  id: string;
  code: string;
  name: string;
  vesselType: string;
  loa: number;
  beam: number;
  draft: number;
  grossTonnage: number;
  agentName?: string;
  imageUrl?: string;
}

interface Berth {
  id: string;
  code: string;
  name: string;
  lengthMeters: number;
}

interface ScheduleEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entryToEdit?: any;
  vessels: Vessel[];
  berths: Berth[];
  weeklyScheduleId: string;
  existingEntries: any[];
  defaultDate?: Date;
}

export default function ScheduleEntryModal({
  isOpen,
  onClose,
  onSuccess,
  entryToEdit,
  vessels,
  berths,
  weeklyScheduleId,
  existingEntries,
  defaultDate,
}: ScheduleEntryModalProps) {
  const [selectedVesselId, setSelectedVesselId] = useState<string>('');
  const [selectedBerthId, setSelectedBerthId] = useState<string>('');
  const [eta, setEta] = useState<string>('');
  const [etd, setEtd] = useState<string>('');
  const [startMeter, setStartMeter] = useState<string>('0');
  const [endMeter, setEndMeter] = useState<string>('100');
  const [orientation, setOrientation] = useState<string>('BOW_NORTH_STERN_SOUTH');
  const [dockedLength, setDockedLength] = useState<string>('100');
  const [hasOverhang, setHasOverhang] = useState<boolean>(false);
  const [overhangLength, setOverhangLength] = useState<string>('0');
  const [overhangPosition, setOverhangPosition] = useState<string>('BOW');
  const [notes, setNotes] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected vessel object
  const activeVessel = useMemo(() => {
    return vessels.find((v) => v.id === selectedVesselId) || null;
  }, [vessels, selectedVesselId]);

  // Selected berth object
  const activeBerth = useMemo(() => {
    return berths.find((b) => b.id === selectedBerthId) || berths[0] || null;
  }, [berths, selectedBerthId]);

  // Initialize or populate form
  useEffect(() => {
    if (entryToEdit) {
      setSelectedVesselId(entryToEdit.vesselId);
      setSelectedBerthId(entryToEdit.berthId);
      setEta(formatDateTimeLocalInput(entryToEdit.eta));
      setEtd(formatDateTimeLocalInput(entryToEdit.etd));
      setStartMeter(entryToEdit.startMeter.toString());
      setEndMeter(entryToEdit.endMeter.toString());
      setOrientation(entryToEdit.orientation || 'BOW_NORTH_STERN_SOUTH');
      setDockedLength(entryToEdit.dockedLength.toString());
      setHasOverhang(entryToEdit.overhangLength > 0);
      setOverhangLength(entryToEdit.overhangLength.toString());
      setOverhangPosition(entryToEdit.overhangPosition || 'BOW');
      setNotes(entryToEdit.notes || '');
    } else {
      const v = vessels[0];
      const b = berths[0];
      const now = defaultDate || new Date();
      const nextDay = new Date(now.getTime() + 12 * 3600000);

      setSelectedVesselId(v ? v.id : '');
      setSelectedBerthId(b ? b.id : '');
      setEta(formatDateTimeLocalInput(now));
      setEtd(formatDateTimeLocalInput(nextDay));

      const initialLoa = v ? v.loa : 100;
      setStartMeter('10');
      setEndMeter((10 + initialLoa).toFixed(1));
      setDockedLength(initialLoa.toFixed(1));
      setOrientation('BOW_NORTH_STERN_SOUTH');
      setHasOverhang(false);
      setOverhangLength('0');
      setOverhangPosition('BOW');
      setNotes('');
    }
    setFormError(null);
  }, [entryToEdit, vessels, berths, defaultDate]);

  // When vessel changes on create mode, auto-calculate meters
  const handleVesselChange = (vId: string) => {
    setSelectedVesselId(vId);
    const vessel = vessels.find((v) => v.id === vId);
    if (vessel) {
      const sM = parseFloat(startMeter) || 0;
      const newEnd = sM + vessel.loa;
      setEndMeter(newEnd.toFixed(1));
      setDockedLength(vessel.loa.toFixed(1));
      setHasOverhang(false);
      setOverhangLength('0');
    }
  };

  const handleStartMeterChange = (val: string) => {
    setStartMeter(val);
    const sM = parseFloat(val);
    if (!isNaN(sM) && activeVessel) {
      const oM = hasOverhang ? parseFloat(overhangLength) || 0 : 0;
      const dM = activeVessel.loa - oM;
      setDockedLength(dM.toFixed(1));
      setEndMeter((sM + dM).toFixed(1));
    }
  };

  const handleOverhangToggle = (checked: boolean) => {
    setHasOverhang(checked);
    if (!checked) {
      setOverhangLength('0');
      if (activeVessel) {
        setDockedLength(activeVessel.loa.toFixed(1));
        const sM = parseFloat(startMeter) || 0;
        setEndMeter((sM + activeVessel.loa).toFixed(1));
      }
    }
  };

  const handleOverhangLengthChange = (val: string) => {
    setOverhangLength(val);
    const oM = parseFloat(val) || 0;
    if (activeVessel) {
      const dM = Math.max(0, activeVessel.loa - oM);
      setDockedLength(dM.toFixed(1));
      const sM = parseFloat(startMeter) || 0;
      setEndMeter((sM + dM).toFixed(1));
    }
  };

  // Real-time Collision Check
  const collisionAlerts = useMemo(() => {
    if (!activeVessel || !eta || !etd || !startMeter || !endMeter) return [];

    const candidates: ScheduleCandidate[] = existingEntries.map((e) => ({
      id: e.id,
      vesselId: e.vesselId,
      vesselName: e.vessel?.name || 'Kapal',
      eta: e.eta,
      etd: e.etd,
      startMeter: e.startMeter,
      endMeter: e.endMeter,
    }));

    const currentCandidate: ScheduleCandidate = {
      id: entryToEdit?.id,
      vesselId: activeVessel.id,
      vesselName: activeVessel.name,
      eta: parseDateTimeLocalInput(eta),
      etd: parseDateTimeLocalInput(etd),
      startMeter: parseFloat(startMeter) || 0,
      endMeter: parseFloat(endMeter) || 0,
    };

    const result = detectCollisions(currentCandidate, candidates, entryToEdit?.id);
    return result.collisions;
  }, [activeVessel, eta, etd, startMeter, endMeter, existingEntries, entryToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedVesselId || !selectedBerthId || !eta || !etd) {
      setFormError('Harap lengkapi semua data wajib (Kapal, Dermaga, ETA, ETD)');
      return;
    }

    const etaDate = parseDateTimeLocalInput(eta);
    const etdDate = parseDateTimeLocalInput(etd);

    if (etaDate.getTime() >= etdDate.getTime()) {
      setFormError('Waktu ETD (Keberangkatan) harus lebih lambat dari waktu ETA (Kedatangan)');
      return;
    }

    const sM = parseFloat(startMeter);
    const eM = parseFloat(endMeter);
    if (isNaN(sM) || isNaN(eM) || sM < 0) {
      setFormError('Posisi meter dermaga harus berupa angka non-negatif');
      return;
    }

    const oLength = hasOverhang ? parseFloat(overhangLength) || 0 : 0;
    const dLength = parseFloat(dockedLength) || Math.abs(eM - sM);

    const bowM = orientation === 'BOW_NORTH_STERN_SOUTH' ? Math.max(sM, eM) : Math.min(sM, eM);
    const sternM = orientation === 'BOW_NORTH_STERN_SOUTH' ? Math.min(sM, eM) : Math.max(sM, eM);

    setIsSubmitting(true);
    try {
      const url = entryToEdit ? `/api/schedules/entries/${entryToEdit.id}` : '/api/schedules/entries';
      const method = entryToEdit ? 'PUT' : 'POST';

      const payload = {
        weeklyScheduleId,
        vesselId: selectedVesselId,
        berthId: selectedBerthId,
        eta: etaDate.toISOString(),
        etd: etdDate.toISOString(),
        startMeter: Math.min(sM, eM),
        endMeter: Math.max(sM, eM),
        bowPositionMeter: bowM,
        sternPositionMeter: sternM,
        orientation,
        dockedLength: dLength,
        overhangLength: oLength,
        overhangPosition: hasOverhang ? overhangPosition : 'NONE',
        notes,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan jadwal');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToEdit) return;
    if (!confirm(`Hapus jadwal kapal ${entryToEdit.vessel?.name}?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schedules/entries/${entryToEdit.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus entri jadwal');
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menghapus jadwal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header with Pelindo Corporate styling */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Ship className="w-5 h-5 text-[#005BAC]" />
              <span>{entryToEdit ? 'Ubah Jadwal Sandar Kapal' : 'Tambah Jadwal Sandar Kapal'}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Pelabuhan Nusantara Parepare (Zona Waktu WITA)
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* REAL-TIME COLLISION ALERT BANNER */}
          {collisionAlerts.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-bounce" />
                <span>Peringatan Deteksi Benturan Spasial / Temporal:</span>
              </div>
              <div className="space-y-1 pl-6">
                {collisionAlerts.map((c, i) => (
                  <p key={i} className="text-xs text-amber-800 font-medium leading-relaxed">
                    {c.message}
                  </p>
                ))}
              </div>
              <div className="text-[10px] text-amber-700 italic pl-6">
                * Sistem tetap memperbolehkan penyimpanan jadwal sesuai pertimbangan operasional pelabuhan.
              </div>
            </div>
          )}

          {/* Section 1: Identitas Kapal & Dermaga */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Identitas Kapal & Fasilitas Sandar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kapal dari Master Data *
                </label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => handleVesselChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                >
                  <option value="">-- Pilih Kapal --</option>
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (LOA: {v.loa}m - {v.vesselType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dermaga Sandar *
                </label>
                <select
                  value={selectedBerthId}
                  onChange={(e) => setSelectedBerthId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  {berths.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.lengthMeters} m)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-populated Vessel Spec Card */}
            {activeVessel && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4 text-xs">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden relative flex-shrink-0">
                  <Image
                    src={activeVessel.imageUrl || '/images/vessels/sample-ship.svg'}
                    alt={activeVessel.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block">LOA (Panjang)</span>
                    <span className="font-bold text-[#005BAC]">{activeVessel.loa} m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Lebar / Draft</span>
                    <span className="font-semibold text-slate-800">
                      {activeVessel.beam}m / {activeVessel.draft}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Gross Tonnage</span>
                    <span className="font-semibold text-slate-800">
                      {activeVessel.grossTonnage ? `${activeVessel.grossTonnage.toLocaleString()} GT` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Agen Pelayaran</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {activeVessel.agentName || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Waktu Sandar (ETA & ETD) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Waktu Kedatangan & Keberangkatan (WITA)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ETA (Estimated Time of Arrival) *
                </label>
                <input
                  type="datetime-local"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format WITA (UTC+8)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ETD (Estimated Time of Departure) *
                </label>
                <input
                  type="datetime-local"
                  value={etd}
                  onChange={(e) => setEtd(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format WITA (UTC+8)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Posisi Dermaga & Orientasi */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Posisi Dermaga & Orientasi Sandar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Posisi Awal Meter [m] *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={activeBerth ? activeBerth.lengthMeters : 366}
                  value={startMeter}
                  onChange={(e) => handleStartMeterChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Posisi Akhir Meter [m] *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={activeBerth ? activeBerth.lengthMeters + 100 : 466}
                  value={endMeter}
                  onChange={(e) => setEndMeter(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Orientasi Haluan / Buritan *
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                >
                  <option value="BOW_NORTH_STERN_SOUTH">
                    Haluan Utara (366m) – Buritan Selatan (0m)
                  </option>
                  <option value="BOW_SOUTH_STERN_NORTH">
                    Haluan Selatan (0m) – Buritan Utara (366m)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Konfigurasi Overhang (Menggantung) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Konfigurasi Bagian Menggantung (Overhang)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Untuk kondisi badan kapal yang menjorok keluar batas dermaga
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOverhang}
                  onChange={(e) => handleOverhangToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-[#005BAC] focus:ring-[#005BAC] border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">Kapal Menggantung</span>
              </label>
            </div>

            {hasOverhang && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Panjang Menempel [m]
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dockedLength}
                    onChange={(e) => setDockedLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Panjang Menggantung [m]
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={overhangLength}
                    onChange={(e) => handleOverhangLengthChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg text-amber-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Posisi Bagian Menggantung
                  </label>
                  <select
                    value={overhangPosition}
                    onChange={(e) => setOverhangPosition(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="BOW">Haluan (Bow Overhang)</option>
                    <option value="STERN">Buritan (Stern Overhang)</option>
                    <option value="BOTH">Kedua Ujung (Both)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Catatan Operasional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Operasional / Muatan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Bongkar muat penumpang & sembako"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {entryToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Jadwal'}</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-[#005BAC] hover:bg-[#004E94] text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : entryToEdit ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
