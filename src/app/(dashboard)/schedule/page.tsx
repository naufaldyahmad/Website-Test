'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CalendarDays,
  Plus,
  Copy,
  FileDown,
  AlertTriangle,
  RotateCcw,
  Ship,
  Compass,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import BerthingTimeline, { TimelineEntry } from '@/components/berthing/BerthingTimeline';
import MonthlyWeekNavigator from '@/components/berthing/MonthlyWeekNavigator';
import ScheduleEntryModal from '@/components/berthing/ScheduleEntryModal';
import DuplicateScheduleModal from '@/components/berthing/DuplicateScheduleModal';
import PdfExportModal from '@/components/berthing/PdfExportModal';
import { getCurrentIsoWeek, formatWitaDateOnly } from '@/lib/date-utils';

function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstDayOfWeek, setFirstDayOfWeek] = useState<number>(1);
  const defaultIso = getCurrentIsoWeek(firstDayOfWeek);

  const weekParam = searchParams.get('week');
  const yearParam = searchParams.get('year');

  const [currentWeek, setCurrentWeek] = useState<number>(
    weekParam ? parseInt(weekParam) : defaultIso.weekNumber
  );
  const [currentYear, setCurrentYear] = useState<number>(
    yearParam ? parseInt(yearParam) : defaultIso.year
  );

  const [scheduleData, setScheduleData] = useState<any>(null);
  const [vessels, setVessels] = useState<any[]>([]);
  const [berths, setBerths] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collisionsMap, setCollisionsMap] = useState<Record<string, string[]>>({});
  const [globalCollisionWarnings, setGlobalCollisionWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedEntryToEdit, setSelectedEntryToEdit] = useState<TimelineEntry | null>(null);

  const isVisitor = currentUser?.role === 'VISITOR';

  // Fetch current user, vessels, berths, and settings
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated) setCurrentUser(d.user);
      });

    fetch('/api/vessels')
      .then((res) => res.json())
      .then((d) => setVessels(d.vessels || []));

    fetch('/api/berths')
      .then((res) => res.json())
      .then((d) => setBerths(d.berths || []));

    fetch('/api/settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.settings?.firstDayOfWeek !== undefined) {
          setFirstDayOfWeek(parseInt(d.settings.firstDayOfWeek));
        }
      });
  }, []);

  // Fetch schedule whenever currentWeek or currentYear changes
  const fetchWeeklySchedule = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/schedules/weekly?week=${currentWeek}&year=${currentYear}`);
      const data = await res.json();
      setScheduleData(data.schedule || null);
      if (data.firstDayOfWeek !== undefined) {
        setFirstDayOfWeek(data.firstDayOfWeek);
      }
      setCollisionsMap(data.collisionsMap || {});
      setGlobalCollisionWarnings(data.globalCollisionWarnings || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySchedule();
  }, [currentWeek, currentYear]);

  const handleSelectWeek = (wNo: number, yr: number) => {
    setCurrentWeek(wNo);
    setCurrentYear(yr);
  };

  const handleJumpToCurrentWeek = () => {
    const cur = getCurrentIsoWeek(firstDayOfWeek);
    setCurrentWeek(cur.weekNumber);
    setCurrentYear(cur.year);
  };

  const handleEntryClick = (entry: TimelineEntry) => {
    if (isVisitor) return;
    setSelectedEntryToEdit(entry);
    setIsEntryModalOpen(true);
  };

  const handleOpenAddEntry = () => {
    if (isVisitor) return;
    setSelectedEntryToEdit(null);
    setIsEntryModalOpen(true);
  };

  const isCurrentWeekActive =
    currentWeek === defaultIso.weekNumber && currentYear === defaultIso.year;

  return (
    <div className="max-w-[1700px] mx-auto space-y-5">
      {/* Visitor Banner if Visitor Mode is Active */}
      {isVisitor && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-semibold">
              Mode Tamu / Visitor (Hanya Baca): Anda dapat menelusuri seluruh jadwal kapal mingguan yang selalu diperbarui secara langsung oleh Admin.
            </span>
          </div>
          <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">
            READ-ONLY
          </span>
        </div>
      )}

      {/* Top Header & Operational Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-[#005BAC]" />
              <span>Vessel Berthing Schedule</span>
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#005BAC] border border-blue-200">
              WITA (UTC+8)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi & Perencanaan Sandar Kapal Mingguan Dermaga Pelabuhan Nusantara Parepare (0 s/d 366 meter)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isVisitor && (
            <>
              <button
                onClick={handleOpenAddEntry}
                className="px-4 py-2 bg-[#005BAC] hover:bg-[#004E94] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Kapal</span>
              </button>

              <button
                onClick={() => setIsDuplicateModalOpen(true)}
                disabled={!scheduleData || scheduleData.entries?.length === 0}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Duplikasi Jadwal Ini</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsPdfModalOpen(true)}
            disabled={!scheduleData || scheduleData.entries?.length === 0}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-[#005BAC]" />
            <span>Ekspor PDF A3</span>
          </button>
        </div>
      </div>

      {/* 1. MONTHLY WEEK NAVIGATOR (Navigasi Bulan & Pemilihan Minggu Horizontal) */}
      <MonthlyWeekNavigator
        currentWeekNumber={currentWeek}
        currentYear={currentYear}
        firstDayOfWeek={firstDayOfWeek}
        onSelectWeek={handleSelectWeek}
      />

      {/* Week Status & Metrics Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xs font-extrabold text-slate-900 font-mono">
            Minggu ke-{currentWeek} ({currentYear})
          </div>
          {scheduleData?.startDate && (
            <div className="text-xs text-slate-500 font-mono">
              {formatWitaDateOnly(scheduleData.startDate)} s.d.{' '}
              {formatWitaDateOnly(scheduleData.endDate)}
            </div>
          )}
          {!isCurrentWeekActive && (
            <button
              onClick={handleJumpToCurrentWeek}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Kembali ke Minggu Ini</span>
            </button>
          )}
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Ship className="w-4 h-4 text-[#005BAC]" />
            <div>
              <span className="text-slate-400 text-[10px] block">Kapal Terjadwal</span>
              <span className="font-bold text-slate-800">
                {scheduleData?.entries?.length || 0} Pergerakan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Compass className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-400 text-[10px] block">Rentang Dermaga</span>
              <span className="font-bold text-slate-800">0 s/d 366 meter</span>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL COLLISION ALERT BANNER */}
      {globalCollisionWarnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-bounce" />
            <span>Peringatan Deteksi Benturan Jadwal Sandar ({globalCollisionWarnings.length} Potensi Konflik):</span>
          </div>
          <div className="space-y-1 pl-6">
            {globalCollisionWarnings.map((warning, index) => (
              <p key={index} className="text-xs text-amber-800 font-medium leading-relaxed">
                • {warning}
              </p>
            ))}
          </div>
          <div className="text-[10px] text-amber-700 italic pl-6">
            * Peringatan ini bersifat operasional. Blok kapal yang berbenturan ditandai dengan kontur merah berkedip pada diagram.
          </div>
        </div>
      )}

      {/* Main Berthing Diagram Canvas */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-24 text-center">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#005BAC] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            Memuat diagram posisi sandar kapal...
          </p>
        </div>
      ) : scheduleData ? (
        <BerthingTimeline
          startDate={scheduleData.startDate}
          endDate={scheduleData.endDate}
          berthLengthMeters={366}
          firstDayOfWeek={firstDayOfWeek}
          entries={scheduleData.entries || []}
          collisionsMap={collisionsMap}
          onEntryClick={handleEntryClick}
          isReadOnly={isVisitor}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 text-xs">
          Jadwal belum tersedia untuk periode ini.
        </div>
      )}

      {/* MODALS */}
      {/* 1. Schedule Entry Modal */}
      {!isVisitor && scheduleData && (
        <ScheduleEntryModal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          onSuccess={fetchWeeklySchedule}
          entryToEdit={selectedEntryToEdit}
          vessels={vessels}
          berths={berths}
          weeklyScheduleId={scheduleData.id}
          existingEntries={scheduleData.entries || []}
          defaultDate={new Date(scheduleData.startDate)}
        />
      )}

      {/* 2. Duplicate Schedule Modal */}
      {!isVisitor && scheduleData && (
        <DuplicateScheduleModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          onSuccess={() => {
            setCurrentWeek((w) => (w >= 52 ? 1 : w + 1));
            fetchWeeklySchedule();
          }}
          sourceSchedule={scheduleData}
        />
      )}

      {/* 3. A3 Landscape PDF Export Modal */}
      {scheduleData && (
        <PdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          schedule={scheduleData}
          berthLengthMeters={366}
        />
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat modul jadwal...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
