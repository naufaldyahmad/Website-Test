'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Ship,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Layers,
  Info,
} from 'lucide-react';

interface Vessel {
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
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

const VESSEL_TYPES = [
  'Semua Jenis',
  'Penumpang',
  'Roro / Penumpang',
  'Petikemas',
  'Kargo Curah',
  'Tanker',
  'Tugboat / Tongkang',
  'Kargo Umum',
];

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Semua Jenis');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isVisitor = currentUser?.role === 'VISITOR';

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    vesselType: 'Penumpang',
    loa: '',
    beam: '',
    draft: '',
    grossTonnage: '',
    agentName: '',
    remarks: '',
    imageUrl: '/images/vessels/sample-ship.svg',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchVessels = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedType !== 'Semua Jenis') params.append('type', selectedType);

      const res = await fetch(`/api/vessels?${params.toString()}`);
      const data = await res.json();
      setVessels(data.vessels || []);
    } catch (err) {
      console.error('Failed to fetch vessels:', err);
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
    fetchVessels();
  }, [selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVessels();
  };

  const openCreateModal = () => {
    setSelectedVessel(null);
    setFormData({
      code: `KAP-${String(vessels.length + 1).padStart(3, '0')}`,
      name: '',
      vesselType: 'Penumpang',
      loa: '',
      beam: '',
      draft: '',
      grossTonnage: '',
      agentName: '',
      remarks: '',
      imageUrl: '/images/vessels/sample-ship.svg',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setFormData({
      code: vessel.code,
      name: vessel.name,
      vesselType: vessel.vesselType,
      loa: vessel.loa.toString(),
      beam: vessel.beam.toString(),
      draft: vessel.draft.toString(),
      grossTonnage: vessel.grossTonnage.toString(),
      agentName: vessel.agentName || '',
      remarks: vessel.remarks || '',
      imageUrl: vessel.imageUrl || '/images/vessels/sample-ship.svg',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openDetailModal = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setIsDetailOpen(true);
  };

  const openDeleteModal = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setIsDeleteOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('Ukuran gambar maksimal 2 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nama kapal wajib diisi');
      return;
    }
    const loaNum = parseFloat(formData.loa);
    if (isNaN(loaNum) || loaNum <= 0) {
      setFormError('Panjang kapal (LOA) harus berupa angka positif');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = selectedVessel ? `/api/vessels/${selectedVessel.id}` : '/api/vessels';
      const method = selectedVessel ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data kapal');
      }

      setNotification({
        type: 'success',
        message: selectedVessel ? 'Data kapal berhasil diperbarui' : 'Kapal baru berhasil ditambahkan',
      });
      setIsFormOpen(false);
      fetchVessels();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan kapal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVessel) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/vessels/${selectedVessel.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus kapal');
      }
      setNotification({
        type: 'success',
        message: data.message || 'Data kapal berhasil dihapus',
      });
      setIsDeleteOpen(false);
      fetchVessels();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Notification */}
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

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ship className="w-6 h-6 text-pelindo-500" />
            <span>Master Data Kapal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data armada kapal yang beroperasi di Pelabuhan Nusantara Parepare
          </p>
        </div>

        {!isVisitor && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005BAC] hover:bg-[#004E94] text-white font-semibold text-xs rounded-xl shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kapal Baru</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kapal, kode, agen..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-pelindo-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-500 font-medium flex-shrink-0">Jenis:</span>
          <div className="flex gap-1.5 flex-wrap">
            {VESSEL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedType === type
                    ? 'bg-pelindo-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vessels Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-pelindo-200 border-t-pelindo-500 rounded-full animate-spin mx-auto mb-3" />
            Memuat daftar kapal...
          </div>
        ) : vessels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Tidak ada kapal yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Kapal</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">LOA (Panjang)</th>
                  <th className="py-3 px-4">Lebar (Beam)</th>
                  <th className="py-3 px-4">Draft</th>
                  <th className="py-3 px-4">GT</th>
                  <th className="py-3 px-4">Agen Pelayaran</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {vessels.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                          <Image
                            src={v.imageUrl || '/images/vessels/sample-ship.svg'}
                            alt={v.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{v.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {v.vesselType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-pelindo-700">{v.loa} m</td>
                    <td className="py-3.5 px-4">{v.beam} m</td>
                    <td className="py-3.5 px-4">{v.draft} m</td>
                    <td className="py-3.5 px-4">{v.grossTonnage ? `${v.grossTonnage.toLocaleString()} GT` : '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{v.agentName || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetailModal(v)}
                          title="Lihat Detail"
                          className="p-1.5 text-slate-500 hover:text-[#005BAC] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isVisitor && (
                          <>
                            <button
                              onClick={() => openEditModal(v)}
                              title="Ubah Data"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(v)}
                              title="Hapus Kapal"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedVessel ? 'Ubah Data Kapal' : 'Tambah Master Kapal Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Pastikan LOA dan data dimensi fisik sesuai dengan surat ukur kapal
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Kapal *</label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled={!!selectedVessel}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="Contoh: KAP-009"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kapal *</label>
                  <select
                    value={formData.vesselType}
                    onChange={(e) => setFormData({ ...formData, vesselType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    {VESSEL_TYPES.filter((t) => t !== 'Semua Jenis').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kapal *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Contoh: KM. LAMBELU"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase font-bold"
                />
              </div>

              {/* Dimensi Fisik Kapal */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Dimensi Fisik Kapal
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      LOA (Panjang) * [m]
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.loa}
                      onChange={(e) => setFormData({ ...formData, loa: e.target.value })}
                      required
                      placeholder="Contoh: 146.5"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lebar (Beam) [m]
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.beam}
                      onChange={(e) => setFormData({ ...formData, beam: e.target.value })}
                      placeholder="Contoh: 23.4"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Draft [m]
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.draft}
                      onChange={(e) => setFormData({ ...formData, draft: e.target.value })}
                      placeholder="Contoh: 5.9"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Gross Tonnage (GT)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.grossTonnage}
                      onChange={(e) => setFormData({ ...formData, grossTonnage: e.target.value })}
                      placeholder="Contoh: 14649"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agen Pelayaran</label>
                  <input
                    type="text"
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    placeholder="Contoh: PT. PELNI (Persero)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Foto / Gambar Kapal</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative flex-shrink-0">
                      <Image
                        src={formData.imageUrl || '/images/vessels/sample-ship.svg'}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <label className="flex-1 cursor-pointer py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Unggah Gambar Kapal</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Contoh: Trayek reguler Parepare - Balikpapan"
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-pelindo-500 hover:bg-pelindo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : selectedVessel ? 'Simpan Perubahan' : 'Tambahkan Kapal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedVessel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="relative h-48 bg-slate-900">
              <Image
                src={selectedVessel.imageUrl || '/images/vessels/sample-ship.svg'}
                alt={selectedVessel.name}
                fill
                className="object-cover opacity-90"
              />
              <button
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-pelindo-500 text-white rounded uppercase tracking-wider">
                  {selectedVessel.vesselType}
                </span>
                <h3 className="text-xl font-black text-white mt-1 drop-shadow">
                  {selectedVessel.name}
                </h3>
                <div className="text-xs text-sky-200 font-mono">{selectedVessel.code}</div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-500 font-medium">Panjang Kapal (LOA)</div>
                  <div className="text-base font-bold text-pelindo-700 mt-0.5">
                    {selectedVessel.loa} meter
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-500 font-medium">Lebar (Beam)</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {selectedVessel.beam} meter
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-500 font-medium">Draft Kapal</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {selectedVessel.draft} meter
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-500 font-medium">Gross Tonnage (GT)</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {selectedVessel.grossTonnage ? selectedVessel.grossTonnage.toLocaleString() : '-'}
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 font-medium">Agen Pelayaran: </span>
                  <span className="font-bold text-slate-800">{selectedVessel.agentName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Keterangan: </span>
                  <span className="text-slate-700">{selectedVessel.remarks || '-'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && selectedVessel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Kapal</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus kapal <span className="font-bold text-slate-800">{selectedVessel.name}</span>?
              Jika kapal telah memiliki riwayat jadwal sandar, data akan dinonaktifkan (soft delete) untuk menjaga integritas histori jadwal.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Ya, Hapus Kapal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

