'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Archive,
  Search,
  Calendar,
  Ship,
  FileDown,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { formatWitaDateOnly } from '@/lib/date-utils';
import PdfExportModal from '@/components/berthing/PdfExportModal';

interface ArchiveWeeklySchedule {
  id: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  entries: {
    id: string;
    vessel: {
      name: string;
      code: string;
      vesselType: string;
      loa: number;
    };
    eta: string;
    etd: string;
    startMeter: number;
    endMeter: number;
    orientation: string;
    dockedLength: number;
    overhangLength: number;
  }[];
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<ArchiveWeeklySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [vesselSearch, setVesselSearch] = useState<string>('');
  const [selectedScheduleForPdf, setSelectedScheduleForPdf] = useState<any>(null);

  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (vesselSearch.trim()) params.append('vessel', vesselSearch.trim());

      const res = await fetch(`/api/schedules/archives?${params.toString()}`);
      const data = await res.json();
      setArchives(data.schedules || []);
    } catch (err) {
      console.error('Failed to load archives:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, [selectedYear]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArchives();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Archive className="w-6 h-6 text-pelindo-500" />
            <span>Arsip Jadwal Sandar Mingguan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat penyimpanan jadwal kapal mingguan Pelabuhan Nusantara Parepare tanpa batas retensi
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={vesselSearch}
            onChange={(e) => setVesselSearch(e.target.value)}
            placeholder="Cari berdasarkan nama kapal..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-pelindo-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Tahun:</span>
          {['2026', '2025', '2024'].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-[#005BAC] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Archive List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-pelindo-200 border-t-pelindo-500 rounded-full animate-spin mx-auto mb-3" />
            Memuat arsip riwayat jadwal...
          </div>
        ) : archives.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
            Tidak ada arsip jadwal yang sesuai dengan filter.
          </div>
        ) : (
          archives.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pelindo-50 text-pelindo-700 flex flex-col items-center justify-center font-black flex-shrink-0 border border-pelindo-200">
                  <span className="text-sm">W{item.weekNumber}</span>
                  <span className="text-[10px] text-pelindo-500 font-medium">{item.year}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Minggu ke-{item.weekNumber} Tahun {item.year}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      {item.status || 'AKTIF'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    Periode: {formatWitaDateOnly(item.startDate)} s.d.{' '}
                    {formatWitaDateOnly(item.endDate)} WITA
                  </div>

                  {/* Scheduled Vessels preview badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.entries.map((entry, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md"
                      >
                        {entry.vessel.name} ({entry.startMeter}–{entry.endMeter}m)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                <button
                  onClick={() => setSelectedScheduleForPdf(item)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-[#005BAC]" />
                  <span>Unduh PDF A3</span>
                </button>

                <Link
                  href={`/schedule?week=${item.weekNumber}&year=${item.year}`}
                  className="px-4 py-2 bg-[#005BAC] hover:bg-[#004E94] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                >
                  <span>Buka Jadwal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PDF Export Modal */}
      {selectedScheduleForPdf && (
        <PdfExportModal
          isOpen={!!selectedScheduleForPdf}
          onClose={() => setSelectedScheduleForPdf(null)}
          schedule={selectedScheduleForPdf}
          berthLengthMeters={366}
        />
      )}
    </div>
  );
}

