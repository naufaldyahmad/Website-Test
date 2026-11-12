'use client';

import { useState, useEffect } from 'react';
import { Compass, Edit, CheckCircle, AlertCircle, X, Shield, Info } from 'lucide-react';

interface Berth {
  id: string;
  code: string;
  name: string;
  lengthMeters: number;
  description?: string;
  isActive: boolean;
}

export default function BerthsPage() {
  const [berths, setBerths] = useState<Berth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBerth, setSelectedBerth] = useState<Berth | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    lengthMeters: '',
    description: '',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isVisitor = currentUser?.role === 'VISITOR';

  const fetchBerths = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/berths');
      const data = await res.json();
      setBerths(data.berths || []);
    } catch (err) {
      console.error('Failed to load berths:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated) setCurrentUser(d.user);
      });
    fetchBerths();
  }, []);

  const openEditModal = (berth: Berth) => {
    setSelectedBerth(berth);
    setFormData({
      name: berth.name,
      lengthMeters: berth.lengthMeters.toString(),
      description: berth.description || '',
    });
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBerth) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/berths', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBerth.id,
          name: formData.name,
          lengthMeters: formData.lengthMeters,
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui dermaga');

      setNotification({ type: 'success', message: 'Konfigurasi dermaga berhasil diperbarui' });
      setIsEditing(false);
      fetchBerths();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-pelindo-500" />
            <span>Master Data Dermaga</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi fasilitas tambat dermaga dan parameter panjang meter Pelabuhan Nusantara Parepare
          </p>
        </div>
      </div>

      {/* Berth Visual Representation Banner */}
      <div className="bg-gradient-to-r from-pelindo-900 via-pelindo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Visualisasi Fasilitas Dermaga Utama
            </span>
          </div>
          <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full text-slate-200">
            Rentang Tambat: 0 m s/d 366 m
          </span>
        </div>

        {/* Visual Line of Berth with Scale Marks */}
        <div className="mt-6 mb-2">
          <div className="relative h-10 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center px-4 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-500 via-pelindo-500 to-sky-400 w-full opacity-30" />
            <div className="relative z-10 w-full flex justify-between text-[11px] font-bold text-slate-200">
              <span>0 m (Ujung Selatan)</span>
              <span>100 m</span>
              <span>200 m</span>
              <span>300 m</span>
              <span>366 m (Ujung Utara)</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 px-2 mt-2 font-mono">
            <span>Bollard Tambat S-01</span>
            <span>Area Penumpang & Roro</span>
            <span>Area Kargo / Curah</span>
            <span>Bollard Tambat N-20</span>
          </div>
        </div>
      </div>

      {/* Berth List / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {berths.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-pelindo-50 text-pelindo-700 rounded border border-pelindo-200">
                  {b.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{b.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {b.description || 'Dermaga sandar operasional Pelabuhan Parepare'}
                </p>
              </div>
              {!isVisitor && (
                <button
                  onClick={() => openEditModal(b)}
                  className="p-2 text-slate-500 hover:text-[#005BAC] hover:bg-blue-50 rounded-xl transition-colors"
                  title="Edit Konfigurasi Dermaga"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block">Panjang Efektif</span>
                <span className="text-xl font-black text-pelindo-600 mt-0.5 block">
                  {b.lengthMeters} meter
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block">Status Fasilitas</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block mt-1">
                  Aktif Beroperasi
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {isEditing && selectedBerth && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Ubah Konfigurasi Dermaga</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Dermaga</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Panjang Dermaga [meter]
                </label>
                <input
                  type="number"
                  step="1"
                  min="50"
                  max="2000"
                  value={formData.lengthMeters}
                  onChange={(e) => setFormData({ ...formData, lengthMeters: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-pelindo-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standar Pelabuhan Nusantara Parepare: 366 meter (rentang 0–366 m).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-pelindo-500 hover:bg-pelindo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

