'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Compass, Clock, Database, Info, CheckCircle, Calendar, Save, Eye } from 'lucide-react';

const DAYS_OPTIONS = [
  { value: '1', label: 'Senin (Standar ISO)' },
  { value: '2', label: 'Selasa' },
  { value: '3', label: 'Rabu' },
  { value: '4', label: 'Kamis' },
  { value: '5', label: 'Jumat' },
  { value: '6', label: 'Sabtu' },
  { value: '0', label: 'Minggu' },
];

export default function SettingsPage() {
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<string>('1');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isVisitor = currentUser?.role === 'VISITOR';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated) setCurrentUser(d.user);
      });

    fetch('/api/settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.settings?.firstDayOfWeek !== undefined) {
          setFirstDayOfWeek(d.settings.firstDayOfWeek);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveFirstDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVisitor) return;

    setIsSaving(true);
    setNotification(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'firstDayOfWeek',
          value: firstDayOfWeek,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');

      setNotification('Pengaturan Hari Pertama Minggu berhasil disimpan secara permanen ke database.');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#005BAC]" />
          <span>Pengaturan Sistem</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi operasional dan parameter sistem Vessel Berthing Schedule Management System
        </p>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {isVisitor && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 font-medium">
          <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Mode Tamu / Visitor (Hanya Baca): Hanya Administrator yang berwenang mengubah konfigurasi sistem.</span>
        </div>
      )}

      <div className="space-y-6">
        {/* SETTING: HARI PERTAMA MINGGU */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-[#005BAC]" />
            <h2 className="text-sm font-bold text-slate-900">Konfigurasi Kalender Mingguan</h2>
          </div>

          <form onSubmit={handleSaveFirstDay} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Hari Pertama Minggu
              </label>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Tentukan hari yang menjadi awal periode mingguan operasional. Pengaturan ini memengaruhi:
                perhitungan rentang tanggal setiap minggu, navigasi Monthly Week Navigator, header hari pada timeline (misal: jika memilih Senin maka periode berlangsung Senin s/d Minggu; jika Minggu maka Minggu s/d Sabtu), filter jadwal, serta proses duplikasi jadwal.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DAYS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      firstDayOfWeek === opt.value
                        ? 'bg-blue-50/80 border-[#005BAC] text-[#005BAC] font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium'
                    } ${isVisitor ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="firstDayOfWeek"
                        value={opt.value}
                        checked={firstDayOfWeek === opt.value}
                        onChange={(e) => setFirstDayOfWeek(e.target.value)}
                        disabled={isVisitor}
                        className="text-[#005BAC] focus:ring-[#005BAC]"
                      />
                      <span className="text-xs">{opt.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {!isVisitor && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-[#005BAC] hover:bg-[#004E94] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* System & Port Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#005BAC]" />
            <span>Parameter Pelabuhan & Fasilitas Dermaga Parepare</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nama Pelabuhan</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                Pelabuhan Nusantara Parepare (Regional 4)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Instansi / Perusahaan</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                PT Pelabuhan Indonesia (Persero)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Rentang Panjang Dermaga</span>
              <span className="text-xs font-bold text-[#005BAC] mt-0.5 block">
                0 meter s/d 366 meter (Ujung Selatan 0m, Ujung Utara 366m)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Zona Waktu Operasional</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                Asia/Makassar – WITA (UTC+08:00)
              </span>
            </div>
          </div>

          {/* Konvensi Koordinat & Orientasi */}
          <div className="p-3.5 bg-sky-50/70 rounded-xl border border-sky-100 text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-[#0B2545] flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-[#005BAC]" />
              <span>Dokumentasi Konvensi Pengukuran Meter Dermaga:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 leading-relaxed text-[11px]">
              <li>
                <strong>Posisi 0 Meter:</strong> Berada di Ujung Selatan Dermaga Pelabuhan Nusantara Parepare.
              </li>
              <li>
                <strong>Posisi 366 Meter:</strong> Berada di Ujung Utara Dermaga Pelabuhan Nusantara Parepare.
              </li>
              <li>
                <strong>Orientasi Haluan Utara / Buritan Selatan:</strong> Haluan kapal menghadap ke arah meter 366, buritan ke arah meter 0.
              </li>
              <li>
                <strong>Orientasi Haluan Selatan / Buritan Utara:</strong> Haluan kapal menghadap ke arah meter 0, buritan ke arah meter 366.
              </li>
              <li>
                <strong>Dukungan Overhang (Menggantung):</strong> Sistem mencatat dan membedakan panjang badan kapal yang menempel pada bollard dermaga dengan bagian yang menggantung di luar dermaga.
              </li>
            </ul>
          </div>
        </div>

        {/* Database & Security Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#005BAC]" />
            <span>Database & Keamanan Akses</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Database Engine</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                SQLite (Prisma ORM Relational)
              </span>
              <span className="text-[10px] text-slate-500">Penyimpanan permanen lokal (Zero-latency on-premise)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Enkripsi Kata Sandi</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                Bcrypt Salted Hash (10 Rounds)
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Tersimpan aman (non-plaintext)</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-800">
                Pengguna Aktif: {currentUser?.fullName || 'Pengguna'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Username: <span className="font-mono font-semibold text-slate-700">{currentUser?.username || 'admin'}</span> ({currentUser?.role || 'ADMINISTRATOR'})
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
              isVisitor ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#005BAC]'
            }`}>
              {currentUser?.role || 'ADMIN'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
