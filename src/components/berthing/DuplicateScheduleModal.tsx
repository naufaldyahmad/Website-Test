'use client';

import { useState, useEffect } from 'react';
import {
  Copy,
  X,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { formatWitaDateTime } from '@/lib/date-utils';

interface DuplicateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourceSchedule: {
    id: string;
    year: number;
    weekNumber: number;
    startDate: string | Date;
    endDate: string | Date;
    entries: any[];
  };
}

export default function DuplicateScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  sourceSchedule,
}: DuplicateScheduleModalProps) {
  const [targetYear, setTargetYear] = useState<number>(sourceSchedule.year);
  const [targetWeekNumber, setTargetWeekNumber] = useState<number>(
    sourceSchedule.weekNumber + 1 > 52 ? 1 : sourceSchedule.weekNumber + 1
  );
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preview whenever target year or week number changes
  useEffect(() => {
    if (!isOpen || !sourceSchedule?.id) return;

    setIsLoadingPreview(true);
    setError(null);

    const params = new URLSearchParams({
      sourceScheduleId: sourceSchedule.id,
      targetYear: targetYear.toString(),
      targetWeekNumber: targetWeekNumber.toString(),
    });

    fetch(`/api/schedules/duplicate?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat pratinjau');
        setPreviewData(data);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat pratinjau pergeseran jadwal');
        setPreviewData(null);
      })
      .finally(() => {
        setIsLoadingPreview(false);
      });
  }, [isOpen, sourceSchedule.id, targetYear, targetWeekNumber]);

  if (!isOpen) return null;

  const handleDuplicateConfirm = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/schedules/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceScheduleId: sourceSchedule.id,
          targetYear,
          targetWeekNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menduplikasi jadwal mingguan');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses duplikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Copy className="w-5 h-5 text-[#005BAC]" />
              <span>Duplikasi Jadwal Sandar Mingguan</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Salin seluruh armada kapal dan posisi tambat ke minggu berikutnya (+7 hari)
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source and Target Comparison Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Jadwal Sumber (Asal)
              </span>
              <div className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                Minggu ke-{sourceSchedule.weekNumber} ({sourceSchedule.year})
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Total: <span className="font-bold text-[#005BAC]">{sourceSchedule.entries.length}</span> pergerakan kapal
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold text-[#005BAC] uppercase tracking-wider block">
                Jadwal Target (Tujuan Duplikasi)
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Nomor Minggu
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={targetWeekNumber}
                    onChange={(e) => setTargetWeekNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Tahun
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2035"
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value) || 2026)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table of Shifted Schedules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pratinjau Jadwal yang Akan Diduplikasi
              </span>
              {previewData && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {previewData.previewEntries?.length || 0} Kapal Siap Disalin
                </span>
              )}
            </div>

            {isLoadingPreview ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                Memproses perhitungan pergeseran tanggal dan validasi benturan...
              </div>
            ) : previewData?.previewEntries && previewData.previewEntries.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Kapal</th>
                      <th className="py-2.5 px-3">ETA Baru (+7 Hari)</th>
                      <th className="py-2.5 px-3">ETD Baru (+7 Hari)</th>
                      <th className="py-2.5 px-3">Posisi Dermaga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewData.previewEntries.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{item.vesselName}</td>
                        <td className="py-2 px-3 font-mono text-emerald-700">
                          {formatWitaDateTime(item.eta)}
                        </td>
                        <td className="py-2 px-3 font-mono text-amber-700">
                          {formatWitaDateTime(item.etd)}
                        </td>
                        <td className="py-2 px-3">
                          {item.startMeter}–{item.endMeter} m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
                Tidak ada data entri pada jadwal sumber.
              </div>
            )}
          </div>

          {/* Collision Warnings for Duplicated Schedule */}
          {previewData?.collisionWarnings && previewData.collisionWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-800">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Peringatan Benturan Terdeteksi pada Hasil Duplikasi:</span>
              </div>
              {previewData.collisionWarnings.map((w: string, i: number) => (
                <div key={i} className="pl-5 text-[11px] leading-relaxed">
                  • {w}
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDuplicateConfirm}
              disabled={isSubmitting || !previewData || previewData.previewEntries?.length === 0}
              className="px-5 py-2 text-xs font-bold bg-[#005BAC] hover:bg-[#004E94] text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>{isSubmitting ? 'Menduplikasi...' : 'Eksekusi Duplikasi Jadwal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
