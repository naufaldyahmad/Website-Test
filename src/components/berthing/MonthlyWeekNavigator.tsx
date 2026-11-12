'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import {
  MONTH_NAMES_UPPER,
  MONTH_NAMES_ID,
  getWeeksForMonth,
  MonthWeekItem,
  getWitaComponents,
} from '@/lib/date-utils';

interface MonthlyWeekNavigatorProps {
  currentWeekNumber: number;
  currentYear: number;
  firstDayOfWeek?: number;
  onSelectWeek: (weekNumber: number, year: number) => void;
}

export default function MonthlyWeekNavigator({
  currentWeekNumber,
  currentYear,
  firstDayOfWeek = 1,
  onSelectWeek,
}: MonthlyWeekNavigatorProps) {
  // Active viewing month & year (0 = Januari, 11 = Desember)
  // Default to current date's month or the week's month
  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(() => {
    // default to current month
    const nowWita = getWitaComponents(new Date());
    return nowWita.month;
  });

  // Index of the first visible card (for sliding window of max 4 cards)
  const [cardOffset, setCardOffset] = useState<number>(0);

  // Compute weeks for the viewing month
  const monthWeeks = useMemo(() => {
    return getWeeksForMonth(viewYear, viewMonth, firstDayOfWeek);
  }, [viewYear, viewMonth, firstDayOfWeek]);

  // Adjust card offset if it exceeds available weeks
  useEffect(() => {
    setCardOffset(0);
  }, [viewYear, viewMonth]);

  // Ensure viewing month aligns if currentWeek is in a different month
  useEffect(() => {
    // If current selected week is not in current view, we can let user navigate freely
  }, [currentWeekNumber, currentYear]);

  // Prev / Next Month Handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Card slide pagination: exactly 4 cards visible at a time
  const maxVisibleCards = 4;
  const canSlideLeft = cardOffset > 0;
  const canSlideRight = cardOffset + maxVisibleCards < monthWeeks.length;

  const handleSlideLeft = () => {
    setCardOffset((prev) => Math.max(0, prev - 1));
  };

  const handleSlideRight = () => {
    setCardOffset((prev) => Math.min(monthWeeks.length - maxVisibleCards, prev + 1));
  };

  const visibleWeeks = monthWeeks.slice(cardOffset, cardOffset + maxVisibleCards);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* 1. Monthly Navigator Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#005BAC]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Navigasi Kalender Operasional
          </span>
        </div>

        {/* [ ← ] BULAN TAHUN [ → ] */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-sm font-black text-slate-900 tracking-wider min-w-[170px] text-center select-none font-mono">
            {MONTH_NAMES_UPPER[viewMonth]} {viewYear}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Total weeks info */}
        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          {monthWeeks.length} Minggu pada {MONTH_NAMES_ID[viewMonth]}
        </div>
      </div>

      {/* 2. Horizontal Week Selector (Max 4 Cards Visible) */}
      <div className="relative flex items-center gap-2">
        {/* Horizontal Navigation Left Arrow (if > 4 weeks) */}
        {monthWeeks.length > maxVisibleCards && (
          <button
            onClick={handleSlideLeft}
            disabled={!canSlideLeft}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-xs"
            title="Geser minggu sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* 4 Week Cards Grid / Flex */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {visibleWeeks.map((weekItem) => {
            const isSelected =
              weekItem.weekNumber === currentWeekNumber && weekItem.year === currentYear;

            return (
              <button
                key={`${weekItem.year}-${weekItem.weekNumber}`}
                onClick={() => onSelectWeek(weekItem.weekNumber, weekItem.year)}
                className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between h-20 ${
                  isSelected
                    ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-md ring-2 ring-sky-300 ring-offset-1'
                    : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[11px] font-black tracking-wider uppercase ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {weekItem.label.toUpperCase()}
                  </span>
                  {weekItem.isCrossingMonth && (
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-white/20 text-sky-100'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                      title="Minggu melintasi pergantian bulan"
                    >
                      Lintas Bulan
                    </span>
                  )}
                </div>

                <div
                  className={`text-[11px] font-mono font-medium truncate ${
                    isSelected ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {weekItem.rangeLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Horizontal Navigation Right Arrow (if > 4 weeks) */}
        {monthWeeks.length > maxVisibleCards && (
          <button
            onClick={handleSlideRight}
            disabled={!canSlideRight}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-xs"
            title="Geser minggu berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

