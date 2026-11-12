'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Lock, User, AlertCircle, Anchor, ShieldCheck, Eye as ViewIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisitorLoading, setIsVisitorLoading] = useState(false);

  const performLogin = async (userStr: string, passStr: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userStr, password: passStr }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Autentikasi gagal. Silakan periksa kembali kredensial Anda.');
    }

    router.push('/');
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Mohon masukkan username dan password');
      return;
    }

    setIsLoading(true);
    try {
      await performLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk ke sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitorLogin = async () => {
    setError(null);
    setIsVisitorLoading(true);
    try {
      await performLogin('visitor', 'visitor123');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk sebagai Tamu Operasional');
    } finally {
      setIsVisitorLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Subtle Nautical Overlay */}
      <div className="absolute inset-0 bg-[#0B2545] opacity-95 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative z-10">
        {/* Card Header with Official Pelindo Logo */}
        <div className="bg-[#0B2545] p-7 text-center text-white border-b border-slate-700">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl shadow-sm inline-block">
              <Image
                src="/images/pelindo-logo.png"
                alt="Logo Pelindo Resmi"
                width={200}
                height={50}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">Vessel Berthing Schedule</h1>
          <p className="text-xs text-sky-200 mt-1 font-medium tracking-wider uppercase">
            Pelabuhan Nusantara Parepare – Regional 4
          </p>
        </div>

        {/* Card Body / Form */}
        <div className="p-7">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <div className="font-semibold">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau visitor"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC] transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC] transition-all font-medium placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isVisitorLoading}
              className="w-full py-2.5 px-4 bg-[#005BAC] hover:bg-[#004E94] text-white rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <Anchor className="w-4 h-4" />
                  <span>Masuk sebagai Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold text-[10px]">
                Akses Tamu / Pengamat
              </span>
            </div>
          </div>

          {/* Quick Visitor Mode Button */}
          <button
            type="button"
            onClick={handleVisitorLogin}
            disabled={isLoading || isVisitorLoading}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isVisitorLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                <span>Membuka Akses Tamu...</span>
              </>
            ) : (
              <>
                <ViewIcon className="w-4 h-4 text-slate-500" />
                <span>Lihat Jadwal sebagai Visitor (Hanya Baca)</span>
              </>
            )}
          </button>

          {/* Security Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[11px] text-slate-400">
            <span>Sistem Informasi Resmi PT Pelabuhan Indonesia (Persero)</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-5">
        &copy; {new Date().getFullYear()} PT Pelabuhan Indonesia (Pelindo) – Pelabuhan Nusantara Parepare
      </p>
    </div>
  );
}
