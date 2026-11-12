'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  AlertTriangle,
  Compass,
  ArrowUp,
  ArrowDown,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  formatWitaDateTime,
  formatWitaTimeOnly,
  formatWitaDateOnly,
  getWeekDaysOrder,
  getWitaComponents,
  createWitaDate,
} from '@/lib/date-utils';

export interface TimelineEntry {
  id: string;
  vesselId: string;
  vessel: {
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
  };
  berthId: string;
  eta: string | Date;
  etd: string | Date;
  startMeter: number;
  endMeter: number;
  bowPositionMeter: number;
  sternPositionMeter: number;
  orientation: string; // BOW_NORTH_STERN_SOUTH | BOW_SOUTH_STERN_NORTH
  dockedLength: number;
  overhangLength: number;
  overhangPosition: string; // NONE, BOW, STERN, BOTH
  notes?: string;
}

interface BerthingTimelineProps {
  startDate: string | Date; // 00:00 WITA
  endDate: string | Date; // 23:59 WITA
  berthLengthMeters?: number; // 366 m
  firstDayOfWeek?: number; // 0 = Minggu, 1 = Senin, ...
  entries: TimelineEntry[];
  collisionsMap?: Record<string, string[]>;
  onEntryClick: (entry: TimelineEntry) => void;
  isReadOnly?: boolean;
}

// Corporate Maritime Palette - Muted, professional, easy on eyes
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  Penumpang: {
    bg: 'bg-[#1E6091]', // Soft Navy Blue
    border: 'border-[#184E77]',
    text: 'text-white',
    badge: 'bg-[#184E77] text-sky-100',
  },
  'Roro / Penumpang': {
    bg: 'bg-[#2A6F97]', // Muted Slate Blue (NO PURPLE)
    border: 'border-[#014F86]',
    text: 'text-white',
    badge: 'bg-[#014F86] text-sky-100',
  },
  Petikemas: {
    bg: 'bg-[#0E7490]', // Muted Teal
    border: 'border-[#155E75]',
    text: 'text-white',
    badge: 'bg-[#155E75] text-cyan-100',
  },
  'Kargo Curah': {
    bg: 'bg-[#B45309]', // Soft Amber
    border: 'border-[#78350F]',
    text: 'text-white',
    badge: 'bg-[#78350F] text-amber-100',
  },
  Tanker: {
    bg: 'bg-[#9F1239]', // Muted Red / Brick
    border: 'border-[#881337]',
    text: 'text-white',
    badge: 'bg-[#881337] text-rose-100',
  },
  'Tugboat / Tongkang': {
    bg: 'bg-[#334155]', // Slate Charcoal
    border: 'border-[#1E293B]',
    text: 'text-white',
    badge: 'bg-[#1E293B] text-slate-200',
  },
  'Kargo Umum': {
    bg: 'bg-[#475569]', // Neutral Slate
    border: 'border-[#334155]',
    text: 'text-white',
    badge: 'bg-[#334155] text-slate-200',
  },
};

export default function BerthingTimeline({
  startDate,
  endDate,
  berthLengthMeters = 366,
  firstDayOfWeek = 1,
  entries = [],
  collisionsMap = {},
  onEntryClick,
  isReadOnly = false,
}: BerthingTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredEntry, setHoveredEntry] = useState<TimelineEntry | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Exact start and end in ms
  const startMs = useMemo(() => new Date(startDate).getTime(), [startDate]);
  const endMs = useMemo(() => new Date(endDate).getTime(), [endDate]);
  const totalDurationMs = useMemo(() => 7 * 24 * 3600000, []); // Selalu 7 hari penuh

  // Width definitions based on zoom level
  const baseDayWidth = 240 * zoomLevel;
  const timelineWidth = baseDayWidth * 7;
  const hourWidth = baseDayWidth / 24;
  const timelineHeight = 580; // 0 - 366 meter

  // 7 days order based on configured firstDayOfWeek
  const dayDates = useMemo(() => {
    const daysOrder = getWeekDaysOrder(firstDayOfWeek);
    return daysOrder.map((dayObj, idx) => {
      const d = new Date(startMs + idx * 86400000);
      return {
        dayName: dayObj.upper,
        dateStr: formatWitaDateOnly(d),
        timestamp: d.getTime(),
      };
    });
  }, [startMs, firstDayOfWeek]);

  // Meter marks every 25m
  const meterMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = 0; m <= berthLengthMeters; m += 25) {
      marks.push(m);
    }
    if (marks[marks.length - 1] !== berthLengthMeters) {
      marks.push(berthLengthMeters);
    }
    return marks;
  }, [berthLengthMeters]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative ${
        isFullscreen ? 'p-4 bg-slate-900 text-white' : ''
      }`}
    >
      {/* Visualizer Toolbar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-[#005BAC]" />
            <span className="text-xs font-bold text-slate-800">
              Rentang Dermaga: 0 s/d {berthLengthMeters} meter
            </span>
          </div>

          {/* Color Legend (Corporate Soft Colors) */}
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#1E6091] inline-block" /> Penumpang
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#2A6F97] inline-block" /> Roro
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#0E7490] inline-block" /> Petikemas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#B45309] inline-block" /> Kargo/Curah
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#9F1239] inline-block" /> Tanker
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded border border-dashed border-amber-600 bg-amber-200/60 inline-block" /> Menggantung (Overhang)
            </span>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, parseFloat((z - 0.2).toFixed(1))))}
              title="Perkecil Timeline"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-700 min-w-[48px] text-center font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, parseFloat((z + 0.2).toFixed(1))))}
              title="Perbesar Timeline"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset Skala"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded ml-0.5 border-l border-slate-100"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Diagram Area with Horizontal & Vertical Scroll */}
      <div className="flex-1 overflow-auto relative">
        <div className="flex" style={{ width: `${timelineWidth + 90}px` }}>
          {/* Vertical Meter Scale (Y-Axis) */}
          <div className="w-[90px] flex-shrink-0 bg-slate-50 border-r border-slate-200 sticky left-0 z-20 select-none shadow-xs">
            {/* Corner Header */}
            <div className="h-16 border-b border-slate-200 flex flex-col items-center justify-center p-1 bg-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase">Posisi Dermaga</span>
              <span className="text-[9px] text-slate-400 font-mono">(0 – {berthLengthMeters}m)</span>
            </div>

            {/* Meter Scale Axis */}
            <div className="relative" style={{ height: `${timelineHeight}px` }}>
              {meterMarks.map((meter) => {
                const topPct = (meter / berthLengthMeters) * 100;
                return (
                  <div
                    key={meter}
                    className="absolute w-full flex items-center justify-between pr-2 border-t border-slate-200/80"
                    style={{ top: `${topPct}%`, transform: 'translateY(-50%)' }}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-700 pl-2">
                      {meter} m
                    </span>
                    <div className="w-2.5 h-[1.5px] bg-slate-400" />
                  </div>
                );
              })}

              {/* Directional Labels on Y Axis */}
              <div className="absolute top-2 left-2 text-[9px] font-bold text-[#005BAC] bg-sky-50 px-1 py-0.5 rounded border border-sky-200">
                0m (Selatan)
              </div>
              <div className="absolute bottom-2 left-2 text-[9px] font-bold text-[#0B2545] bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                {berthLengthMeters}m (Utara)
              </div>
            </div>
          </div>

          {/* Timeline Grid (X-Axis: Days & Hours + Vessel Blocks Canvas) */}
          <div className="flex-1 flex flex-col relative select-none" style={{ width: `${timelineWidth}px` }}>
            {/* Header: 7 Days & 24 Hours */}
            <div className="h-16 border-b border-slate-200 bg-slate-50 flex sticky top-0 z-10">
              {dayDates.map((day, dIdx) => (
                <div
                  key={dIdx}
                  className="border-r border-slate-200 flex flex-col flex-shrink-0"
                  style={{ width: `${baseDayWidth}px` }}
                >
                  {/* Day Title */}
                  <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center justify-center gap-1.5 px-2">
                    <span className="text-xs font-extrabold text-slate-800 tracking-wider">
                      {day.dayName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 font-mono">
                      {day.dateStr}
                    </span>
                  </div>

                  {/* Hourly Division Line (00 to 23) */}
                  <div className="h-7 flex divide-x divide-slate-100 bg-white">
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div
                        key={h}
                        className="flex-1 flex items-center justify-center text-[9px] font-mono text-slate-400 hover:text-slate-900"
                        title={`Jam ${String(h).padStart(2, '0')}:00 WITA`}
                      >
                        {h % 4 === 0 ? String(h).padStart(2, '0') : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Diagram Background Grid: Vertical Hour Guidelines & Horizontal Meter Guidelines */}
            <div
              className="relative bg-white"
              style={{ height: `${timelineHeight}px`, width: `${timelineWidth}px` }}
            >
              {/* Vertical 1-Hour Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: 7 * 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-full flex-shrink-0 border-r ${
                      idx % 24 === 0
                        ? 'border-slate-300'
                        : idx % 6 === 0
                        ? 'border-slate-200'
                        : 'border-slate-100'
                    }`}
                    style={{ width: `${hourWidth}px` }}
                  />
                ))}
              </div>

              {/* Horizontal Meter Guidelines */}
              <div className="absolute inset-0 pointer-events-none">
                {meterMarks.map((meter) => {
                  const topPct = (meter / berthLengthMeters) * 100;
                  return (
                    <div
                      key={meter}
                      className="absolute w-full border-t border-slate-100"
                      style={{ top: `${topPct}%` }}
                    />
                  );
                })}
              </div>

              {/* VESSEL BLOCKS (Representasi Blok Kapal) */}
              {entries.map((entry) => {
                const etaTime = new Date(entry.eta).getTime();
                const etdTime = new Date(entry.etd).getTime();

                // Precise horizontal placement based on start of week in WITA
                const leftPx = ((etaTime - startMs) / totalDurationMs) * timelineWidth;
                const widthPx = Math.max(32, ((etdTime - etaTime) / totalDurationMs) * timelineWidth);

                // Vertical placement (Berth Meter)
                const minMeter = Math.min(entry.startMeter, entry.endMeter);
                const maxMeter = Math.max(entry.startMeter, entry.endMeter);
                const meterSpan = Math.max(8, maxMeter - minMeter);

                const topPx = (minMeter / berthLengthMeters) * timelineHeight;
                const heightPx = Math.max(26, (meterSpan / berthLengthMeters) * timelineHeight);

                const hasConflict = collisionsMap[entry.id] && collisionsMap[entry.id].length > 0;
                const typeStyle = TYPE_COLORS[entry.vessel.vesselType] || TYPE_COLORS['Kargo Umum'];

                const hasOverhang = entry.overhangLength > 0;
                const isBowNorth = entry.orientation === 'BOW_NORTH_STERN_SOUTH';

                return (
                  <div
                    key={entry.id}
                    onClick={() => !isReadOnly && onEntryClick(entry)}
                    onMouseEnter={(e) => {
                      setHoveredEntry(entry);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ x: rect.right + 10, y: rect.top });
                    }}
                    onMouseLeave={() => {
                      setHoveredEntry(null);
                      setTooltipPos(null);
                    }}
                    className={`absolute rounded-md ${isReadOnly ? 'cursor-default' : 'cursor-pointer'} transition-all shadow-sm hover:shadow-lg hover:z-30 group overflow-hidden border ${
                      hasConflict
                        ? 'ring-2 ring-rose-500 ring-offset-1 border-rose-600 bg-rose-700 text-white animate-pulse'
                        : `${typeStyle.bg} ${typeStyle.border} ${typeStyle.text}`
                    }`}
                    style={{
                      left: `${leftPx}px`,
                      width: `${widthPx}px`,
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                    }}
                  >
                    {/* Visual pattern for overhang part (if applicable) */}
                    {hasOverhang && (
                      <div
                        className={`absolute left-0 right-0 h-3.5 bg-amber-400/30 border-dashed border-amber-300 z-10 flex items-center justify-center text-[8px] font-bold text-amber-100 ${
                          entry.overhangPosition === 'BOW'
                            ? isBowNorth ? 'bottom-0 border-t' : 'top-0 border-b'
                            : isBowNorth ? 'top-0 border-b' : 'bottom-0 border-t'
                        }`}
                        title={`Bagian menggantung (Overhang): ${entry.overhangLength} meter`}
                      >
                        <span className="truncate px-1">OVERHANG {entry.overhangLength}m</span>
                      </div>
                    )}

                    {/* Block Content */}
                    <div className="h-full w-full p-1.5 flex flex-col justify-between text-white relative z-20">
                      {/* Vessel Header */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          {/* Direction Indicator */}
                          <span
                            className="p-0.5 bg-black/30 rounded text-[9px] flex-shrink-0"
                            title={
                              isBowNorth
                                ? 'Haluan Menghadap Utara (Meter 366), Buritan Selatan (Meter 0)'
                                : 'Haluan Menghadap Selatan (Meter 0), Buritan Utara (Meter 366)'
                            }
                          >
                            {isBowNorth ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          </span>
                          <span className="font-bold text-[11px] tracking-tight truncate drop-shadow-xs">
                            {entry.vessel.name}
                          </span>
                        </div>

                        {hasConflict && (
                          <span className="p-0.5 bg-rose-900 rounded text-amber-300 flex-shrink-0 animate-bounce">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* LOA & Meter Range */}
                      <div className="flex items-center justify-between text-[9px] text-white/90 font-mono font-medium">
                        <span>LOA {entry.vessel.loa}m</span>
                        <span>
                          {minMeter.toFixed(0)}–{maxMeter.toFixed(0)}m
                        </span>
                      </div>

                      {/* Time Bar */}
                      <div className="text-[8px] text-white/80 font-mono truncate">
                        {formatWitaTimeOnly(entry.eta)} - {formatWitaTimeOnly(entry.etd)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Card / Tooltip with Vessel Photo on Top */}
      {hoveredEntry && tooltipPos && (
        <div
          className="fixed z-50 bg-[#0B2545] text-white rounded-xl shadow-2xl border border-slate-700 w-72 text-xs pointer-events-none transition-opacity overflow-hidden"
          style={{
            top: `${Math.min(window.innerHeight - 380, tooltipPos.y)}px`,
            left: `${Math.min(window.innerWidth - 310, tooltipPos.x)}px`,
          }}
        >
          {/* Top Vessel Photo (Seukuran Kolom Card) */}
          <div className="relative w-full h-32 bg-slate-900 border-b border-slate-700/80">
            <Image
              src={hoveredEntry.vessel.imageUrl || '/images/vessels/sample-ship.svg'}
              alt={hoveredEntry.vessel.name}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-bold px-2 py-0.5 bg-[#005BAC] text-white rounded shadow-sm">
                {hoveredEntry.vessel.vesselType}
              </span>
            </div>
          </div>

          <div className="p-3.5 space-y-2.5">
            <div>
              <div className="font-extrabold text-sm text-sky-300">{hoveredEntry.vessel.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{hoveredEntry.vessel.code}</div>
            </div>

            <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-700/50">
              <div className="flex justify-between">
                <span className="text-slate-400">ETA (Tiba):</span>
                <span className="font-semibold text-emerald-300 font-mono">
                  {formatWitaDateTime(hoveredEntry.eta)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ETD (Berangkat):</span>
                <span className="font-semibold text-amber-300 font-mono">
                  {formatWitaDateTime(hoveredEntry.etd)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Posisi Dermaga:</span>
                <span className="font-bold text-slate-100">
                  {hoveredEntry.startMeter} m s/d {hoveredEntry.endMeter} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensi LOA / Lebar:</span>
                <span className="font-medium text-slate-200">
                  {hoveredEntry.vessel.loa} m / {hoveredEntry.vessel.beam} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orientasi Sandar:</span>
                <span className="font-medium text-sky-200">
                  {hoveredEntry.orientation === 'BOW_NORTH_STERN_SOUTH'
                    ? 'Haluan Utara, Buritan Selatan'
                    : 'Haluan Selatan, Buritan Utara'}
                </span>
              </div>
              {hoveredEntry.overhangLength > 0 && (
                <div className="flex justify-between text-amber-300 font-semibold">
                  <span>Overhang (Menggantung):</span>
                  <span>{hoveredEntry.overhangLength} meter ({hoveredEntry.overhangPosition})</span>
                </div>
              )}
              {hoveredEntry.notes && (
                <div className="pt-1.5 text-[10px] text-slate-300 italic border-t border-slate-700/50">
                  "{hoveredEntry.notes}"
                </div>
              )}
            </div>

            {collisionsMap[hoveredEntry.id] && (
              <div className="p-2 bg-rose-950/80 border border-rose-700 rounded-lg text-rose-300 text-[10px] space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-3 h-3" /> Peringatan Benturan:
                </div>
                {collisionsMap[hoveredEntry.id].map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
