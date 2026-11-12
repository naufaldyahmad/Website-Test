'use client';

import { useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Printer,
  Download,
  X,
  FileText,
} from 'lucide-react';
import {
  formatWitaDateTime,
  formatWitaDateOnly,
  formatWitaTimeOnly,
  getWeekDaysOrder,
} from '@/lib/date-utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: {
    id: string;
    year: number;
    weekNumber: number;
    startDate: string | Date;
    endDate: string | Date;
    entries: any[];
  };
  berthLengthMeters?: number;
  firstDayOfWeek?: number;
}

export default function PdfExportModal({
  isOpen,
  onClose,
  schedule,
  berthLengthMeters = 366,
  firstDayOfWeek = 1,
}: PdfExportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const startMs = useMemo(() => new Date(schedule.startDate).getTime(), [schedule.startDate]);
  const endMs = useMemo(() => new Date(schedule.endDate).getTime(), [schedule.endDate]);
  const totalDurationMs = useMemo(() => 7 * 24 * 3600000, []);

  const dayDates = useMemo(() => {
    const daysOrder = getWeekDaysOrder(firstDayOfWeek);
    return daysOrder.map((dayObj, idx) => {
      const d = new Date(startMs + idx * 86400000);
      return {
        dayName: dayObj.upper,
        dateStr: formatWitaDateOnly(d),
      };
    });
  }, [startMs, firstDayOfWeek]);

  const meterMarks = [0, 50, 100, 150, 200, 250, 300, 366];

  if (!isOpen) return null;

  // Direct Browser Native Print for A3 Landscape
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution A3 Landscape PDF Generator
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGenerating(true);

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1587,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 420, 297);
      pdf.save(
        `VESSEL_BERTHING_SCHEDULE_PAREPARE_W${schedule.weekNumber}_${schedule.year}.pdf`
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal menghasilkan file PDF. Anda dapat menggunakan tombol Cetak (Print) untuk mencetak langsung.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#005BAC]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Dokumen Jadwal Sandar Kapal (Format Cetak A3 Landscape)
              </h3>
              <p className="text-[11px] text-slate-500">
                Dimensi Standar: 420 × 297 mm – Pelabuhan Nusantara Parepare
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-[#005BAC] hover:bg-[#004E94] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Menghasilkan PDF...' : 'Unduh PDF A3'}</span>
            </button>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-200 flex justify-center">
          <div
            ref={printAreaRef}
            className="bg-white shadow-xl p-8 flex flex-col justify-between"
            style={{
              width: '1587px',
              minHeight: '1122px',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. DOCUMENT HEADER */}
            <div className="border-b-2 border-[#005BAC] pb-4 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="h-14 w-52 relative">
                  <Image
                    src="/images/pelindo-logo.png"
                    alt="Logo Pelindo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="border-l-2 border-slate-300 pl-4">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    VESSEL BERTHING SCHEDULE
                  </h1>
                  <h2 className="text-xs font-bold text-[#005BAC] tracking-wider mt-1 uppercase">
                    PELABUHAN NUSANTARA PAREPARE – REGIONAL 4
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    PT PELABUHAN INDONESIA (PERSERO)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold bg-blue-50 text-[#005BAC] px-3 py-1 rounded border border-blue-200 inline-block">
                  PERIODE: MINGGU KE-{schedule.weekNumber} TAHUN {schedule.year}
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1 font-mono">
                  {formatWitaDateOnly(schedule.startDate)} s.d. {formatWitaDateOnly(schedule.endDate)} (WITA)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Waktu Generate: {formatWitaDateTime(new Date())}
                </div>
              </div>
            </div>

            {/* 2. TIMELINE DIAGRAM (MAIN BODY) */}
            <div className="my-5 border border-slate-300 flex flex-col flex-1">
              {/* Day & Hour Header */}
              <div className="h-14 bg-slate-100 border-b border-slate-300 flex">
                <div className="w-24 border-r border-slate-300 flex flex-col items-center justify-center p-1 bg-slate-200 text-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-700">DERMAGA</span>
                  <span className="text-[9px] text-slate-500 font-mono">(0 – {berthLengthMeters}m)</span>
                </div>

                {/* 7 Days Columns */}
                <div className="flex-1 flex">
                  {dayDates.map((d, idx) => (
                    <div key={idx} className="flex-1 border-r border-slate-300 flex flex-col">
                      <div className="h-8 bg-slate-200 border-b border-slate-300 flex items-center justify-center gap-2 font-bold text-xs text-slate-800">
                        <span>{d.dayName}</span>
                        <span className="text-[10px] text-slate-600 font-mono">({d.dateStr})</span>
                      </div>
                      <div className="h-6 flex divide-x divide-slate-200 bg-white text-[9px] font-mono text-slate-500">
                        {Array.from({ length: 24 }).map((_, h) => (
                          <div key={h} className="flex-1 flex items-center justify-center">
                            {h % 4 === 0 ? h : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagram Area with Grid & Ships */}
              <div className="flex-1 flex relative" style={{ minHeight: '620px' }}>
                {/* Meter Scale Axis Left */}
                <div className="w-24 bg-slate-50 border-r border-slate-300 relative flex-shrink-0">
                  {meterMarks.map((meter) => {
                    const topPct = (meter / berthLengthMeters) * 100;
                    return (
                      <div
                        key={meter}
                        className="absolute w-full flex items-center justify-between pr-1 border-t border-slate-300"
                        style={{ top: `${topPct}%`, transform: 'translateY(-50%)' }}
                      >
                        <span className="text-[10px] font-bold font-mono pl-1 text-slate-800">
                          {meter} m
                        </span>
                        <div className="w-2 h-[1px] bg-slate-400" />
                      </div>
                    );
                  })}
                  <div className="absolute top-1 left-1 text-[8px] font-bold text-[#005BAC] bg-sky-100 px-1 rounded">
                    Selatan
                  </div>
                  <div className="absolute bottom-1 left-1 text-[8px] font-bold text-[#0B2545] bg-blue-100 px-1 rounded">
                    Utara
                  </div>
                </div>

                {/* Vessel Canvas Body */}
                <div className="flex-1 relative bg-white overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: 7 * 24 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-full flex-1 border-r ${
                          idx % 24 === 0
                            ? 'border-slate-300'
                            : idx % 6 === 0
                            ? 'border-slate-200'
                            : 'border-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 pointer-events-none">
                    {meterMarks.map((m) => (
                      <div
                        key={m}
                        className="absolute w-full border-t border-slate-200"
                        style={{ top: `${(m / berthLengthMeters) * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Ship Blocks */}
                  {schedule.entries.map((entry) => {
                    const etaTime = new Date(entry.eta).getTime();
                    const etdTime = new Date(entry.etd).getTime();

                    const leftPct = ((etaTime - startMs) / totalDurationMs) * 100;
                    const widthPct = Math.max(2.5, ((etdTime - etaTime) / totalDurationMs) * 100);

                    const minMeter = Math.min(entry.startMeter, entry.endMeter);
                    const maxMeter = Math.max(entry.startMeter, entry.endMeter);
                    const topPct = (minMeter / berthLengthMeters) * 100;
                    const heightPct = Math.max(4.5, ((maxMeter - minMeter) / berthLengthMeters) * 100);

                    const isBowNorth = entry.orientation === 'BOW_NORTH_STERN_SOUTH';
                    const hasOverhang = entry.overhangLength > 0;

                    return (
                      <div
                        key={entry.id}
                        className="absolute border border-[#14345B] rounded bg-[#1E6091] text-white p-1.5 flex flex-col justify-between overflow-hidden shadow-xs"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: `${topPct}%`,
                          height: `${heightPct}%`,
                        }}
                      >
                        {hasOverhang && (
                          <div className="absolute inset-x-0 h-3 bg-amber-300/40 border-dashed border-amber-200 text-[8px] font-bold text-amber-950 flex items-center justify-center">
                            OVERHANG {entry.overhangLength}m
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-bold leading-tight">
                          <span className="truncate">{entry.vessel?.name}</span>
                          <span className="text-[9px] bg-black/30 px-1 rounded flex items-center">
                            {isBowNorth ? '↑ N' : '↓ S'}
                          </span>
                        </div>

                        <div className="flex justify-between text-[9px] font-mono font-medium text-white/90">
                          <span>LOA {entry.vessel?.loa}m</span>
                          <span>{minMeter.toFixed(0)}–{maxMeter.toFixed(0)}m</span>
                        </div>

                        <div className="text-[8px] font-mono text-white/80 truncate">
                          {formatWitaTimeOnly(entry.eta)} - {formatWitaTimeOnly(entry.etd)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. DOCUMENT FOOTER (LEGEND & SIGNATURES) */}
            <div className="border-t-2 border-slate-300 pt-4 grid grid-cols-3 gap-6 text-xs">
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="font-bold text-slate-900 uppercase">LEGENDA & KETERANGAN:</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#1E6091] border border-[#14345B] rounded-xs inline-block" />
                  <span>Blok Sandar Kapal (Panjang & Rentang Meter Tambat)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-400/40 border border-dashed border-amber-600 rounded-xs inline-block" />
                  <span>Bagian Kapal Menggantung di Luar Dermaga (Overhang)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  * Seluruh waktu yang tercantum adalah Waktu Indonesia Tengah (WITA, UTC+8).
                </div>
              </div>

              <div className="text-center flex flex-col justify-between">
                <div className="font-bold text-slate-800 uppercase text-[11px]">
                  Dibuat Oleh:
                  <div className="text-[10px] font-normal text-slate-500">
                    Petugas Perencanaan Sandar Kapal (Berthing Planner)
                  </div>
                </div>
                <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px]">
                  (Tanda Tangan & Cap Operasional)
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 text-[11px]">
                  ADMIN OPERASIONAL PAREPARE
                </div>
              </div>

              <div className="text-center flex flex-col justify-between">
                <div className="font-bold text-slate-800 uppercase text-[11px]">
                  Disetujui Oleh:
                  <div className="text-[10px] font-normal text-slate-500">
                    Manager Operasi & Pelayanan Kapal
                  </div>
                </div>
                <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px]">
                  (Tanda Tangan & Stempel Resmi)
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 text-[11px]">
                  MANAGER OPERASI PELINDO PAREPARE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
