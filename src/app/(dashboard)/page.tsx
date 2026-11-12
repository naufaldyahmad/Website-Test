'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ship,
  Calendar,
  Clock,
  ArrowRight,
  Activity,
  Layers,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { formatWitaDateTime } from '@/lib/date-utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated) setCurrentUser(d.user);
      });

    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#005BAC] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-500">Memuat data operasional pelabuhan...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const activeWeek = stats.activeWeek || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner - Refined Corporate Pelindo Deep Navy */}
      <div className="bg-[#0B2545] rounded-2xl p-6 md:p-8 text-white shadow-sm relative overflow-hidden border border-[#14345B]">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-sky-200 border border-white/15 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Informasi Operasional Terpadu
          </span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Pelabuhan Nusantara Parepare
          </h1>
          <p className="mt-2 text-xs md:text-sm text-slate-200 font-normal leading-relaxed">
            Perencanaan dan visualisasi sandar armada kapal dermaga 0 s/d 366 meter secara terpadu, akurat, dan aman dari potensi benturan jadwal dengan presisi spasial dan temporal WITA.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005BAC] hover:bg-[#004E94] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Buka Diagram Sandar Mingguan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/vessels"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all"
            >
              <Ship className="w-4 h-4 text-sky-300" />
              <span>Master Kapal ({stats.totalVessels || 0})</span>
            </Link>
          </div>
        </div>

        {/* Nautical Decorative Graphic */}
        <div className="absolute right-[-10px] bottom-[-20px] opacity-5 pointer-events-none">
          <Ship className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Master Vessels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Master Data Kapal
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#005BAC] flex items-center justify-center">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalVessels || 0}</span>
            <span className="text-xs text-slate-500 font-medium">Kapal Terdaftar</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Siap dijadwalkan sandar</span>
          </div>
        </div>

        {/* Card 2: Active Scheduled Vessels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Kapal Terjadwal (Minggu Ini)
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#005BAC]">
              {activeWeek.vesselsCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">Kapal Unik</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Total <span className="font-semibold text-slate-700">{activeWeek.entriesCount || 0}</span> pergerakan sandar
          </div>
        </div>

        {/* Card 3: Earliest Vessel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Kapal Paling Awal
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-sm font-bold text-slate-900 truncate">
              {activeWeek.earliestVessel ? activeWeek.earliestVessel.name : 'Belum Ada'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate font-mono">
              {activeWeek.earliestVessel
                ? formatWitaDateTime(activeWeek.earliestVessel.eta)
                : 'Tidak ada jadwal terdaftar'}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold inline-block border border-emerald-200">
            ETA Pembuka Minggu
          </div>
        </div>

        {/* Card 4: Latest Vessel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Kapal Paling Akhir
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-sm font-bold text-slate-900 truncate">
              {activeWeek.latestVessel ? activeWeek.latestVessel.name : 'Belum Ada'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate font-mono">
              {activeWeek.latestVessel
                ? formatWitaDateTime(activeWeek.latestVessel.etd)
                : 'Tidak ada jadwal terdaftar'}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold inline-block border border-amber-200">
            ETD Penutup Minggu
          </div>
        </div>
      </div>

      {/* Grid: Riwayat Jadwal Mingguan & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Riwayat Jadwal Mingguan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Riwayat & Arsip Jadwal Mingguan
              </h2>
              <p className="text-xs text-slate-500">
                Daftar periode jadwal sandar kapal mingguan yang tersimpan permanen
              </p>
            </div>
            <Link
              href="/archives"
              className="text-xs font-bold text-[#005BAC] hover:underline flex items-center gap-1"
            >
              <span>Semua Arsip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.recentSchedules && data.recentSchedules.length > 0 ? (
              data.recentSchedules.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex flex-col items-center justify-center font-bold text-xs flex-shrink-0 font-mono">
                      <span>W{item.weekNumber}</span>
                      <span className="text-[9px] text-slate-500 font-normal">{item.year}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Minggu ke-{item.weekNumber} (Tahun {item.year})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {formatWitaDateTime(item.startDate).split(' ')[1]} s.d.{' '}
                        {formatWitaDateTime(item.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg">
                      {item._count?.entries || 0} Kapal
                    </span>
                    <Link
                      href={`/schedule?week=${item.weekNumber}&year=${item.year}`}
                      className="px-3 py-1.5 bg-[#005BAC] hover:bg-[#004E94] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Buka Jadwal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada jadwal mingguan yang tersimpan.
              </div>
            )}
          </div>
        </div>

        {/* Right (1 col): Log Aktivitas Pengelolaan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Log Aktivitas</h2>
              <p className="text-xs text-slate-500">Aktivitas pengelolaan data terbaru</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {data?.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#005BAC] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {act.action} – {act.entityType}
                    </div>
                    <div className="text-slate-500 text-[11px] truncate">
                      Oleh: {act.user?.fullName || 'Sistem'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {formatWitaDateTime(act.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada aktivitas tercatat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
