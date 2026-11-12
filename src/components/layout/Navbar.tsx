'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Calendar, Shield, ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  user?: {
    username: string;
    fullName: string;
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isVisitor = user?.role === 'VISITOR';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
            Vessel Berthing Schedule Management System
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            PT Pelabuhan Indonesia (Pelindo) – Pelabuhan Nusantara Parepare
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Link to Schedule */}
        <Link
          href="/schedule"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-[#005BAC]" />
          <span>Jadwal Sandar</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              isVisitor
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-blue-50 text-[#005BAC] border-blue-200'
            }`}
          >
            {isVisitor ? <Eye className="w-4 h-4" /> : user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-none">
              {user?.fullName || 'Pengguna'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              {isVisitor ? (
                <span className="text-amber-700 bg-amber-50 px-1 rounded font-bold">
                  VISITOR (READ-ONLY)
                </span>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-emerald-600 inline" />
                  <span>{user?.role || 'ADMINISTRATOR'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Keluar dari sistem"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
