'use client';

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

interface Tindakan {
  id_tindakan: string;
  nama_tindakan: string;
  kategori_tindakan: string;
  status_aktif: boolean;
}

interface Kelas {
  id_kelas: string;
  nama_kelas: string;
  status_aktif: boolean;
}

interface Komponen {
  id_komponen: string;
  nama_komponen: string;
  keterangan?: string;
  status_aktif: boolean;
}

interface CaraBayar {
  id_cara_bayar: string;
  nama_cara_bayar: string;
}

interface HargaTindakanDetail {
  id_harga_detail: string;
  id_komponen: string;
  nilai_tarif: string | number;
  master_komponen_tarif: Komponen;
}

interface HargaTindakan {
  id_harga: string;
  id_tindakan: string;
  id_kelas: string;
  id_cara_bayar: string;
  status_aktif: boolean;
  total_tarif: string | number;
  master_tindakan: Tindakan;
  master_kelas: Kelas;
  master_cara_bayar: CaraBayar;
  master_harga_tindakan_komponen: HargaTindakanDetail[];
}

export default function TarifPage() {
  const [activeTab, setActiveTab] = useState<'tindakan' | 'master_opsi' | 'harga'>('tindakan');
  
  // Master Lists States
  const [listTindakan, setListTindakan] = useState<Tindakan[]>([]);
  const [listKelas, setListKelas] = useState<Kelas[]>([]);
  const [listKomponen, setListKomponen] = useState<Komponen[]>([]);
  const [listCaraBayar, setListCaraBayar] = useState<CaraBayar[]>([]);
  const [listHarga, setListHarga] = useState<HargaTindakan[]>([]);

  // Search/Filters States
  const [searchTindakan, setSearchTindakan] = useState('');
  const [searchHarga, setSearchHarga] = useState('');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Inputs States
  // 1. Tindakan Form
  const [formTindakan, setFormTindakan] = useState({
    nama_tindakan: '',
    kategori_tindakan: 'Medis',
    status_aktif: true,
  });

  // 2. Kelas Form (Tab 2)
  const [formKelas, setFormKelas] = useState({
    nama_kelas: '',
    status_aktif: true,
  });

  // 3. Komponen Form (Tab 2)
  const [formKomponen, setFormKomponen] = useState({
    nama_komponen: '',
    keterangan: '',
    status_aktif: true,
  });

  // 4. Harga Form (Tab 3)
  const [selectedTindakanId, setSelectedTindakanId] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedCaraBayarId, setSelectedCaraBayarId] = useState('');
  const [hargaStatusAktif, setHargaStatusAktif] = useState(true);
  
  // Dynamic inputs for each components
  // Key: id_komponen, Value: number/string
  const [komponenValues, setKomponenValues] = useState<Record<string, string>>({});

  const showNotification = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // 1. Load Tindakan
      const resTindakan = await fetch(`${API_URL}/master-tindakan`);
      if (resTindakan.ok) setListTindakan(await resTindakan.json());

      // 2. Load Kelas
      const resKelas = await fetch(`${API_URL}/master-kelas`);
      if (resKelas.ok) setListKelas(await resKelas.json());

      // 3. Load Komponen
      const resKomponen = await fetch(`${API_URL}/master-komponen`);
      if (resKomponen.ok) {
        const componentsData = await resKomponen.json();
        setListKomponen(componentsData);
        // Initialize dynamic inputs to zero
        const initialInputs: Record<string, string> = {};
        componentsData.forEach((c: Komponen) => {
          initialInputs[c.id_komponen] = '0';
        });
        setKomponenValues(initialInputs);
      }

      // 4. Load Cara Bayar
      const resCara = await fetch(`${API_URL}/master-cara-bayar`);
      if (resCara.ok) setListCaraBayar(await resCara.json());

      // 5. Load Harga Header & Component Detail
      const resHarga = await fetch(`${API_URL}/master-harga-tindakan`);
      if (resHarga.ok) setListHarga(await resHarga.json());

    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat memuat master data tarif.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // SUBMIT 1: SAVE ACTION (TINDAKAN)
  const handleSaveTindakan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTindakan.nama_tindakan.trim()) {
      showNotification('error', 'Nama tindakan harus diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/master-tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTindakan),
      });

      if (!res.ok) throw new Error('Gagal menyimpan master tindakan.');

      showNotification('success', 'Master tindakan baru berhasil disimpan!');
      setFormTindakan({ nama_tindakan: '', kategori_tindakan: 'Medis', status_aktif: true });
      
      // Reload tindakan list
      const resTindakan = await fetch(`${API_URL}/master-tindakan`);
      if (resTindakan.ok) setListTindakan(await resTindakan.json());
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TOGGLE STATUS TINDAKAN
  const handleToggleTindakan = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/master-tindakan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_aktif: !currentStatus }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui status tindakan.');

      showNotification('success', 'Status tindakan berhasil diperbarui!');
      
      // Reload tindakan list
      const resTindakan = await fetch(`${API_URL}/master-tindakan`);
      if (resTindakan.ok) setListTindakan(await resTindakan.json());
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // DELETE TINDAKAN
  const handleDeleteTindakan = async (id: string, nama: string) => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus tindakan "${nama}"?\nTindakan ini akan menghapus seluruh relasi tarif terkait!`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/master-tindakan/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal menghapus tindakan.');

      showNotification('success', 'Tindakan berhasil dihapus!');
      
      // Reload lists
      const resTindakan = await fetch(`${API_URL}/master-tindakan`);
      if (resTindakan.ok) setListTindakan(await resTindakan.json());
      const resHarga = await fetch(`${API_URL}/master-harga-tindakan`);
      if (resHarga.ok) setListHarga(await resHarga.json());
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // SUBMIT 2: SAVE KELAS (TAB 2)
  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKelas.nama_kelas.trim()) {
      showNotification('error', 'Nama kelas perawatan harus diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/master-kelas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formKelas),
      });

      if (!res.ok) throw new Error('Gagal menyimpan kelas perawatan baru.');

      showNotification('success', 'Kelas perawatan baru berhasil disimpan!');
      setFormKelas({ nama_kelas: '', status_aktif: true });
      
      const resKelas = await fetch(`${API_URL}/master-kelas`);
      if (resKelas.ok) setListKelas(await resKelas.json());
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUBMIT 3: SAVE KOMPONEN (TAB 2)
  const handleSaveKomponen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKomponen.nama_komponen.trim()) {
      showNotification('error', 'Nama komponen tarif harus diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/master-komponen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formKomponen),
      });

      if (!res.ok) throw new Error('Gagal menyimpan komponen tarif baru.');

      showNotification('success', 'Komponen tarif baru berhasil disimpan!');
      setFormKomponen({ nama_komponen: '', keterangan: '', status_aktif: true });
      
      const resKomponen = await fetch(`${API_URL}/master-komponen`);
      if (resKomponen.ok) {
        const componentsData = await resKomponen.json();
        setListKomponen(componentsData);
        // Initialize/update dynamic inputs
        const updatedInputs = { ...komponenValues };
        componentsData.forEach((c: Komponen) => {
          if (updatedInputs[c.id_komponen] === undefined) {
            updatedInputs[c.id_komponen] = '0';
          }
        });
        setKomponenValues(updatedInputs);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DYNAMIC COMPONENT VALUE CHANGE
  const handleKomponenValueChange = (id: string, val: string) => {
    // Only allow positive numbers or empty (for typing)
    if (val === '' || /^\d+$/.test(val)) {
      setKomponenValues((prev) => ({
        ...prev,
        [id]: val,
      }));
    }
  };

  // CALCULATE REAL-TIME ACCUMULATED TOTAL TARIF
  const calculateTotalTarif = () => {
    return Object.values(komponenValues).reduce((sum, val) => {
      const num = parseInt(val) || 0;
      return sum + num;
    }, 0);
  };

  // SUBMIT 4: SAVE COMPREHENSIVE TARIF BREAKDOWN (TAB 3)
  const handleSaveHargaBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTindakanId || !selectedKelasId || !selectedCaraBayarId) {
      showNotification('error', 'Harap lengkapi opsi Tindakan, Kelas Perawatan, dan Cara Bayar!');
      return;
    }

    // Map komponen values to array format expected by backend
    const mappedKomponen = Object.entries(komponenValues).map(([id_komponen, value]) => ({
      id_komponen,
      nilai_tarif: parseInt(value) || 0,
    }));

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/master-harga-tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tindakan: selectedTindakanId,
          id_kelas: selectedKelasId,
          id_cara_bayar: selectedCaraBayarId,
          status_aktif: hargaStatusAktif,
          komponen_tarif: mappedKomponen,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan tarif tindakan.');
      }

      showNotification('success', 'Rincian tarif tindakan berhasil disimpan!');
      
      // Reset inputs
      setSelectedTindakanId('');
      setSelectedKelasId('');
      setSelectedCaraBayarId('');
      setHargaStatusAktif(true);
      const resetInputs: Record<string, string> = {};
      listKomponen.forEach((c) => {
        resetInputs[c.id_komponen] = '0';
      });
      setKomponenValues(resetInputs);

      // Reload list harga
      const resHarga = await fetch(`${API_URL}/master-harga-tindakan`);
      if (resHarga.ok) setListHarga(await resHarga.json());
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE HARGA TARIF
  const handleDeleteHarga = async (id: string, tindakan: string, kelas: string, caraBayar: string) => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus seluruh tarif untuk tindakan "${tindakan}" (${kelas} - ${caraBayar})?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/master-harga-tindakan/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal menghapus tarif tindakan.');

      showNotification('success', 'Tarif tindakan berhasil dihapus!');
      
      // Reload list harga
      const resHarga = await fetch(`${API_URL}/master-harga-tindakan`);
      if (resHarga.ok) setListHarga(await resHarga.json());
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // FILTERS
  const filteredTindakan = listTindakan.filter((t) =>
    t.nama_tindakan.toLowerCase().includes(searchTindakan.toLowerCase()) ||
    t.kategori_tindakan.toLowerCase().includes(searchTindakan.toLowerCase())
  );

  const filteredHarga = listHarga.filter((h) => {
    const tindName = h.master_tindakan?.nama_tindakan || '';
    const kelName = h.master_kelas?.nama_kelas || '';
    const cbName = h.master_cara_bayar?.nama_cara_bayar || '';
    const query = searchHarga.toLowerCase();

    return (
      tindName.toLowerCase().includes(query) ||
      kelName.toLowerCase().includes(query) ||
      cbName.toLowerCase().includes(query)
    );
  });

  return (
    <MasterLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        
        {/* ======================== HEADER SECTION ======================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              💰 Master & Input Tarif Tindakan
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Kelola master tindakan, kelas perawatan, komponen biaya, dan konfigurasikan tarif breakdown secara dinamis.
            </p>
          </div>
          
          {/* TAB BUTTONS (AESTHETIC CAPSULES) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 self-start md:self-center shadow-inner border border-slate-200/50">
            <button
              onClick={() => setActiveTab('tindakan')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'tindakan'
                  ? 'bg-gradient-to-r from-red-650 to-rose-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Master Tindakan
            </button>
            <button
              onClick={() => setActiveTab('master_opsi')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'master_opsi'
                  ? 'bg-gradient-to-r from-red-650 to-rose-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🪙 Komponen & Kelas
            </button>
            <button
              onClick={() => setActiveTab('harga')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'harga'
                  ? 'bg-gradient-to-r from-red-650 to-rose-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💰 Input & Breakdown Tarif
            </button>
          </div>
        </div>

        {/* ======================== TOAST NOTIFICATION ======================== */}
        {alert && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 transform border text-xs font-bold ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{alert.message}</span>
          </div>
        )}

        {/* ======================== LOADING COVER ======================== */}
        {isLoading ? (
          <div className="py-28 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-xl">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            <div className="text-xs text-slate-400 font-black">Menghubungkan & Memuat Master Data Tarif...</div>
          </div>
        ) : (
          <div className="transition-all duration-300">
            
            {/* ==================== TAB 1: MASTER TINDAKAN ==================== */}
            {activeTab === 'tindakan' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* INSERT FORM (LEFT: 4 COLS) */}
                <form onSubmit={handleSaveTindakan} className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
                    <span className="text-xl">➕</span>
                    <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tambah Tindakan Baru</h2>
                      <p className="text-[10px] text-slate-400 font-semibold">Inisiasi data master tindakan klinis baru</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Tindakan</label>
                      <input
                        type="text"
                        required
                        value={formTindakan.nama_tindakan}
                        onChange={(e) => setFormTindakan({ ...formTindakan, nama_tindakan: e.target.value })}
                        className="w-full rounded-xl border border-red-500/30 p-3 bg-red-50/5 text-red-950 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="Contoh: Infus Intravena"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kategori Tindakan</label>
                      <select
                        value={formTindakan.kategori_tindakan}
                        onChange={(e) => setFormTindakan({ ...formTindakan, kategori_tindakan: e.target.value })}
                        className="w-full rounded-xl border border-red-500/30 p-3 bg-red-50/5 text-red-950 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all"
                      >
                        <option value="Medis">Medis (Dokter)</option>
                        <option value="Keperawatan">Keperawatan (Perawat)</option>
                        <option value="Laboratorium">Laboratorium</option>
                        <option value="Radiologi">Radiologi</option>
                        <option value="Penunjang">Penunjang</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                      <div>
                        <span className="block text-xs font-black text-slate-700">Status Aktif</span>
                        <span className="block text-[9px] text-slate-400 font-semibold">Tindakan bisa dipilih jika berstatus aktif</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormTindakan({ ...formTindakan, status_aktif: !formTindakan.status_aktif })}
                        className={`w-11 h-6 rounded-full transition-colors relative outline-none cursor-pointer ${
                          formTindakan.status_aktif ? 'bg-red-650' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            formTindakan.status_aktif ? 'right-1.5' : 'left-1.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-xs font-bold py-3.5 px-4 shadow-lg shadow-red-100 hover:shadow-red-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : '💾 Simpan Tindakan'}
                  </button>
                </form>

                {/* DATA TABLE (RIGHT: 8 COLS) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                    <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Daftar Tindakan Terdaftar</h2>
                      <p className="text-[10px] text-slate-400 font-semibold">Mencakup {listTindakan.length} master tindakan</p>
                    </div>
                    
                    {/* Search Tindakan */}
                    <input
                      type="text"
                      placeholder="Cari tindakan..."
                      value={searchTindakan}
                      onChange={(e) => setSearchTindakan(e.target.value)}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 max-w-xs font-medium"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                          <th className="p-3">Nama Tindakan</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {filteredTindakan.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-slate-400 italic">
                              Tidak ada tindakan medis yang cocok.
                            </td>
                          </tr>
                        ) : (
                          filteredTindakan.map((t) => (
                            <tr key={t.id_tindakan} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{t.nama_tindakan}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                                  t.kategori_tindakan === 'Medis' ? 'bg-red-50 text-red-700' :
                                  t.kategori_tindakan === 'Keperawatan' ? 'bg-blue-50 text-blue-700' :
                                  t.kategori_tindakan === 'Laboratorium' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {t.kategori_tindakan}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleToggleTindakan(t.id_tindakan, t.status_aktif)}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black cursor-pointer transition-all ${
                                    t.status_aktif
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  }`}
                                >
                                  {t.status_aktif ? 'AKTIF' : 'NON-AKTIF'}
                                </button>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteTindakan(t.id_tindakan, t.nama_tindakan)}
                                  className="text-[10px] bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-2 rounded-xl border border-slate-100 transition-colors cursor-pointer font-bold"
                                >
                                  🗑️ Hapus
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB 2: MASTER KELAS & KOMPONEN ==================== */}
            {activeTab === 'master_opsi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLUMN 1: MASTER KELAS */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
                    <span className="text-xl">🏢</span>
                    <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Master Kelas Perawatan</h2>
                      <p className="text-[10px] text-slate-400 font-semibold">Tentukan ruang kelas perawatan/fasilitas</p>
                    </div>
                  </div>

                  {/* Form Quick Insert Kelas */}
                  <form onSubmit={handleSaveKelas} className="flex gap-3 bg-red-50/10 p-3 rounded-2xl border border-red-500/10 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Kelas Baru</label>
                      <input
                        type="text"
                        required
                        value={formKelas.nama_kelas}
                        onChange={(e) => setFormKelas({ ...formKelas, nama_kelas: e.target.value })}
                        className="w-full rounded-xl border border-red-500/20 p-2.5 bg-white text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="Contoh: VIP"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-[11px] font-black py-2.5 px-4 shadow shadow-red-150 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      ➕ Tambah
                    </button>
                  </form>

                  {/* List Kelas */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {listKelas.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 italic font-bold">Belum ada kelas perawatan.</div>
                    ) : (
                      listKelas.map((k) => (
                        <div key={k.id_kelas} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="font-bold text-xs text-slate-800">{k.nama_kelas}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black">AKTIF</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 2: MASTER KOMPONEN TARIF */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
                    <span className="text-xl">🪙</span>
                    <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Master Komponen Tarif</h2>
                      <p className="text-[10px] text-slate-400 font-semibold">Tentukan pemecah rincian breakdown tarif medis</p>
                    </div>
                  </div>

                  {/* Form Quick Insert Komponen */}
                  <form onSubmit={handleSaveKomponen} className="space-y-3 bg-red-50/10 p-4 rounded-2xl border border-red-500/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Komponen</label>
                        <input
                          type="text"
                          required
                          value={formKomponen.nama_komponen}
                          onChange={(e) => setFormKomponen({ ...formKomponen, nama_komponen: e.target.value })}
                          className="w-full rounded-xl border border-red-500/20 p-2.5 bg-white text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all"
                          placeholder="e.g. Jasa Dokter"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Keterangan</label>
                        <input
                          type="text"
                          value={formKomponen.keterangan}
                          onChange={(e) => setFormKomponen({ ...formKomponen, keterangan: e.target.value })}
                          className="w-full rounded-xl border border-red-500/20 p-2.5 bg-white text-slate-800 font-medium outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all"
                          placeholder="Keterangan opsional"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-[11px] font-black py-2.5 px-5 shadow shadow-red-150 transition-all cursor-pointer disabled:opacity-50"
                      >
                        ➕ Tambah Komponen
                      </button>
                    </div>
                  </form>

                  {/* List Komponen */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {listKomponen.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 italic font-bold">Belum ada komponen tarif.</div>
                    ) : (
                      listKomponen.map((comp) => (
                        <div key={comp.id_komponen} className="border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800">{comp.nama_komponen}</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black">AKTIF</span>
                          </div>
                          {comp.keterangan && (
                            <p className="text-[10px] text-slate-400 font-semibold mt-1 italic">{comp.keterangan}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB 3: INPUT TARIF & BREAKDOWN ==================== */}
            {activeTab === 'harga' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* TARIF BREAKDOWN ENTRY FORM (LEFT: 5 COLS) */}
                <form onSubmit={handleSaveHargaBreakdown} className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
                  
                  <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
                    <span className="text-xl">💰</span>
                    <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Input Tarif Komponen</h2>
                      <p className="text-[10px] text-slate-400 font-semibold">Tentukan rincian nominal rupiah untuk setiap komponen</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Select Tindakan */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih Tindakan Medis</label>
                      <select
                        required
                        value={selectedTindakanId}
                        onChange={(e) => setSelectedTindakanId(e.target.value)}
                        className="w-full rounded-xl border border-red-500/20 p-2.5 bg-slate-50/50 text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Pilih Tindakan --</option>
                        {listTindakan.filter((t) => t.status_aktif).map((t) => (
                          <option key={t.id_tindakan} value={t.id_tindakan}>{t.nama_tindakan} ({t.kategori_tindakan})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Select Kelas */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Kelas Perawatan</label>
                        <select
                          required
                          value={selectedKelasId}
                          onChange={(e) => setSelectedKelasId(e.target.value)}
                          className="w-full rounded-xl border border-red-500/20 p-2.5 bg-slate-50/50 text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {listKelas.filter((k) => k.status_aktif).map((k) => (
                            <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Cara Bayar */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Cara Bayar</label>
                        <select
                          required
                          value={selectedCaraBayarId}
                          onChange={(e) => setSelectedCaraBayarId(e.target.value)}
                          className="w-full rounded-xl border border-red-500/20 p-2.5 bg-slate-50/50 text-slate-800 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                        >
                          <option value="">-- Pilih Cara Bayar --</option>
                          {listCaraBayar.map((c) => (
                            <option key={c.id_cara_bayar} value={c.id_cara_bayar}>{c.nama_cara_bayar}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* DYNAMIC COMPONENT INPUTS */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-red-650 uppercase tracking-widest pl-1">Breakdown Komponen Biaya</h4>
                      
                      {listKomponen.length === 0 ? (
                        <p className="text-[11px] text-slate-400 font-semibold italic">Harap daftarkan master komponen tarif di Tab 2 terlebih dahulu.</p>
                      ) : (
                        <div className="space-y-3.5">
                          {listKomponen.map((comp) => (
                            <div key={comp.id_komponen} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-150">
                              <div className="max-w-[60%]">
                                <span className="block text-xs font-black text-slate-800">{comp.nama_komponen}</span>
                                {comp.keterangan && (
                                  <span className="block text-[9px] text-slate-400 font-bold leading-none">{comp.keterangan}</span>
                                )}
                              </div>
                              
                              <div className="relative max-w-[40%] flex items-center">
                                <span className="absolute left-3 text-xs font-black text-slate-400">Rp</span>
                                <input
                                  type="text"
                                  value={komponenValues[comp.id_komponen] || '0'}
                                  onChange={(e) => handleKomponenValueChange(comp.id_komponen, e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-3 bg-white text-right text-xs font-black text-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ACCUMULATED TOTAL DISPLAY */}
                    <div className="bg-gradient-to-br from-red-650 to-rose-600 text-white rounded-2xl p-4 shadow-lg shadow-red-150 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] font-black text-red-100 uppercase tracking-widest">Total Akumulasi Tarif</span>
                        <span className="block text-[10px] text-red-200 font-semibold italic mt-0.5">Dihitung otomatis (real-time)</span>
                      </div>
                      <span className="text-xl font-mono font-black">
                        Rp {(calculateTotalTarif()).toLocaleString('id-ID')}
                      </span>
                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || listKomponen.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-xs font-bold py-3.5 px-4 shadow-lg shadow-red-100 hover:shadow-red-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : '💾 Simpan & Rincikan Tarif'}
                  </button>
                </form>

                {/* TARIF LISTING AND ACCORDION VIEW (RIGHT: 7 COLS) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                    <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Daftar Rincian Tarif</h2>
                      <p className="text-[10px] text-slate-400 font-semibold">Menampilkan {listHarga.length} kombinasi tarif terdaftar</p>
                    </div>
                    
                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Cari tindakan, kelas, cara bayar..."
                      value={searchHarga}
                      onChange={(e) => setSearchHarga(e.target.value)}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 max-w-xs font-medium"
                    />
                  </div>

                  {/* List Container */}
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                    {filteredHarga.length === 0 ? (
                      <p className="text-center py-12 text-xs text-slate-400 font-semibold italic">Belum ada rincian tarif yang cocok.</p>
                    ) : (
                      filteredHarga.map((h) => (
                        <div key={h.id_harga} className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-red-300 hover:shadow transition-all relative overflow-hidden">
                          
                          {/* Ribbon Status */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-650"></div>
                          
                          {/* Header Line */}
                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {h.master_tindakan?.kategori_tindakan} Tindakan
                              </span>
                              <h3 className="text-sm font-black text-slate-900 leading-tight mt-0.5">
                                {h.master_tindakan?.nama_tindakan}
                              </h3>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                  🏢 {h.master_kelas?.nama_kelas}
                                </span>
                                <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                  💳 {h.master_cara_bayar?.nama_cara_bayar}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Nominal</span>
                              <span className="text-sm font-mono font-black text-red-750">
                                Rp {parseInt(h.total_tarif as string).toLocaleString('id-ID')}
                              </span>
                              
                              <div className="mt-2.5 flex justify-end">
                                <button
                                  onClick={() => handleDeleteHarga(
                                    h.id_harga,
                                    h.master_tindakan?.nama_tindakan,
                                    h.master_kelas?.nama_kelas,
                                    h.master_cara_bayar?.nama_cara_bayar
                                  )}
                                  className="text-[9px] font-black text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  🗑️ Hapus Tarif
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Breakdown Section */}
                          <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200 pl-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Breakdown Komponen Biaya</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                              {h.master_harga_tindakan_komponen?.map((detail) => (
                                <div key={detail.id_harga_detail} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="truncate pr-2 font-bold text-slate-700">{detail.master_komponen_tarif?.nama_komponen}</span>
                                  <span className="font-mono text-slate-900 font-black">
                                    Rp {parseInt(detail.nilai_tarif as string).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </MasterLayout>
  );
}
