'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  CalendarDays,
  Ship,
  Compass,
  Archive,
  Settings,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Berthing Schedule',
    href: '/schedule',
    icon: CalendarDays,
    badge: 'Utama',
  },
  {
    name: 'Master Data Kapal',
    href: '/vessels',
    icon: Ship,
    badge: null,
  },
  {
    name: 'Master Data Dermaga',
    href: '/berths',
    icon: Compass,
    badge: null,
  },
  {
    name: 'Arsip Jadwal',
    href: '/archives',
    icon: Archive,
    badge: null,
  },
  {
    name: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    badge: null,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0B2545] text-slate-300 min-h-screen flex flex-col flex-shrink-0 border-r border-[#081C34]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#14345B] bg-[#081C34]">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-xs inline-block">
            <Image
              src="/images/pelindo-logo.png"
              alt="Pelindo Logo"
              width={140}
              height={36}
              className="h-7 w-auto object-contain"
            />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[11px] font-bold text-white uppercase tracking-wider">
            Vessel Berthing System
          </div>
          <div className="text-[10px] text-sky-300 font-medium">
            Pelabuhan Nusantara Parepare
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Menu Operasional
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#005BAC] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#113259] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge ? (
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-sky-400/20 text-sky-200'
                }`}>
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Berth Length Quick Indicator */}
      <div className="p-3.5 m-3 bg-[#081C34] rounded-xl border border-[#14345B]">
        <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5">
          <span>Rentang Dermaga</span>
          <span className="font-bold text-sky-300">0 – 366 m</span>
        </div>
        <div className="w-full bg-[#14345B] h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#005BAC] h-full w-full" />
        </div>
        <div className="text-[10px] text-slate-400 mt-2 flex justify-between font-mono">
          <span>0m (Selatan)</span>
          <span>366m (Utara)</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-[#14345B] text-[11px] text-slate-400 text-center">
        <span>Zona Waktu: </span>
        <span className="font-semibold text-slate-200">WITA (UTC+8)</span>
      </div>
    </aside>
  );
}
