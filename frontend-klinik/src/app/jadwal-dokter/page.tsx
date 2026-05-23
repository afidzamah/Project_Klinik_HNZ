'use client';

import { API_URL } from '@/lib/api';
import React, { useState, useEffect, useRef } from 'react';
import MasterLayout from '@/components/MasterLayout';

interface Poliklinik {
  id_poli: string;
  nama_poli: string;
  lokasi_gedung?: string;
}

interface Dokter {
  id_dokter: string;
  nama_dokter: string;
  id_poli: string | null;
  sip_dokter: string;
  status_aktif: boolean;
}

interface JadwalDokter {
  id_jadwal: string;
  hari: string;
  id_poli: string;
  id_dokter: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  master_poliklinik: Poliklinik;
  master_dokter: Dokter;
}

interface SearchOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  emptyMessage = 'Data tidak ditemukan',
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs text-left focus:ring-2 focus:ring-red-500 transition-all ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:bg-red-50/20'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-red-600 transition-transform duration-200 ml-2 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-56 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-red-500 transition-all font-medium text-slate-800"
            />
          </div>

          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-red-50 hover:text-red-700 font-semibold ${
                    opt.value === value ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div>{opt.label}</div>
                  {opt.sublabel && (
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.sublabel}</div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center font-semibold italic">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JadwalDokterPage() {
  // Form State
  const [hari, setHari] = useState('Senin');
  const [idPoli, setIdPoli] = useState('');
  const [idDokter, setIdDokter] = useState('');
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('12:00');
  const [kuota, setKuota] = useState(30);

  // Master Data State
  const [polikliniks, setPolikliniks] = useState<Poliklinik[]>([]);
  const [doctors, setDoctors] = useState<Dokter[]>([]);
  const [schedules, setSchedules] = useState<JadwalDokter[]>([]);

  // UI Interactive States
  const [activeTabHari, setActiveTabHari] = useState('Senin');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Notification State
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Load master data & schedules
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [resPoli, resDokter, resSchedules] = await Promise.all([
        fetch(`${API_URL}/master-poliklinik`),
        fetch(`${API_URL}/master-dokter`),
        fetch(`${API_URL}/jadwal-dokter`),
      ]);

      if (!resPoli.ok || !resDokter.ok || !resSchedules.ok) {
        throw new Error('Gagal mengambil data dari server.');
      }

      setPolikliniks(await resPoli.json());
      setDoctors(await resDokter.json());
      setSchedules(await resSchedules.json());
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDoctors = doctors.filter((doc) => doc.id_poli === idPoli);

  useEffect(() => {
    setIdDokter('');
  }, [idPoli]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4000);
  };

  const handleSimpanJadwal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hari || !idPoli || !idDokter || !jamMulai || !jamSelesai || !kuota) {
      showNotification('error', 'Semua field wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/jadwal-dokter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hari,
          id_poli: idPoli,
          id_dokter: idDokter,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
          kuota: Number(kuota),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal menyimpan jadwal praktek.');
      }

      showNotification('success', 'Jadwal dokter berhasil disimpan!');
      setIdDokter('');
      setJamMulai('08:00');
      setJamSelesai('12:00');
      setKuota(30);
      
      // Auto-set the active view tab to the day they just added, for excellent UX
      setActiveTabHari(hari);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat memproses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHapusJadwal = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API_URL}/jadwal-dokter/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal menghapus jadwal dari server.');

      showNotification('success', 'Jadwal dokter berhasil dihapus.');
      setConfirmDeleteId(null);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat menghapus.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered schedules for Active Day Tab
  const tabSchedules = schedules.filter((s) => s.hari === activeTabHari);

  // Group schedules of the active day by Poliklinik Name
  const groupedSchedules = tabSchedules.reduce((acc, curr) => {
    const poliName = curr.master_poliklinik?.nama_poli || 'Lainnya';
    if (!acc[poliName]) {
      acc[poliName] = {
        poliName,
        lokasi: curr.master_poliklinik?.lokasi_gedung || '',
        items: []
      };
    }
    acc[poliName].items.push(curr);
    return acc;
  }, {} as Record<string, { poliName: string; lokasi: string; items: JadwalDokter[] }>);

  // Colors for poliklinik left borders
  const getPoliIndicatorColor = (namaPoli: string) => {
    const colors: Record<string, string> = {
      'Poli Umum': 'border-slate-400 bg-slate-100 text-slate-800',
      'Poli Anak (Pediatri)': 'border-emerald-500 bg-emerald-50 text-emerald-800',
      'Poli Gigi & Mulut': 'border-sky-500 bg-sky-50 text-sky-800',
      'Poli Penyakit Dalam': 'border-violet-500 bg-violet-50 text-violet-800',
      'Poli Kandungan (Obgyn)': 'border-rose-500 bg-rose-50 text-rose-800',
    };
    return colors[namaPoli] || 'border-slate-400 bg-slate-100 text-slate-800';
  };

  return (
    <MasterLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* ======================== HEADER SECTION ======================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              📅 Input & Manajemen Jadwal Dokter
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Atur waktu praktek, pilih poliklinik, tetapkan dokter, serta kuota pelayanan pasien harian secara rapi.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-red-50 text-red-650 border border-red-100 shadow-sm animate-pulse">
              🟢 Penjadwalan Terintegrasi
            </span>
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

        {/* ======================== MAIN LAYOUT GRID ======================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================== LEFT COLUMN: INPUT FORM ======================== */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-xl p-5 md:p-6 space-y-6 sticky top-20">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <span className="text-xl">📝</span>
              <div>
                <h2 className="text-sm font-black text-slate-800">Form Jadwal Praktek</h2>
                <p className="text-[10px] text-slate-400 font-semibold">Lengkapi data jadwal praktek baru</p>
              </div>
            </div>

            <form onSubmit={handleSimpanJadwal} className="space-y-4">
              
              {/* INPUT HARI */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Hari Praktek
                </label>
                <select
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  className="w-full rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs cursor-pointer focus:ring-2 focus:ring-red-500 transition-all hover:bg-red-50/20"
                >
                  {days.map((day) => (
                    <option key={day} value={day} className="text-slate-800 font-semibold">
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECT POLIKLINIK */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nama Poliklinik
                </label>
                <SearchableSelect
                  placeholder="-- Pilih Poliklinik --"
                  value={idPoli}
                  onChange={(val) => setIdPoli(val)}
                  options={polikliniks.map((p) => ({
                    value: p.id_poli,
                    label: p.nama_poli,
                    sublabel: p.lokasi_gedung || 'Lokasi belum diset',
                  }))}
                />
              </div>

              {/* SELECT DOKTER */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nama Dokter
                </label>
                <SearchableSelect
                  placeholder={
                    !idPoli
                      ? 'Silakan Pilih Poliklinik Dahulu'
                      : filteredDoctors.length === 0
                      ? 'Tidak ada dokter di poli ini'
                      : '-- Pilih Dokter --'
                  }
                  disabled={!idPoli || filteredDoctors.length === 0}
                  value={idDokter}
                  onChange={(val) => setIdDokter(val)}
                  options={filteredDoctors.map((d) => ({
                    value: d.id_dokter,
                    label: d.nama_dokter,
                    sublabel: `SIP: ${d.sip_dokter}`,
                  }))}
                />
              </div>

              {/* JAM MULAI & JAM SELESAI */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    required
                    className="w-full rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs cursor-pointer focus:ring-2 focus:ring-red-500 transition-all hover:bg-red-50/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    required
                    className="w-full rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs cursor-pointer focus:ring-2 focus:ring-red-500 transition-all hover:bg-red-50/20"
                  />
                </div>
              </div>

              {/* INPUT KUOTA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Kuota Pelayanan (Pasien)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={kuota}
                    onChange={(e) => setKuota(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-red-500/30 p-2.5 bg-red-50/10 text-red-900 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="Masukkan jumlah kuota"
                  />
                  <span className="absolute right-3.5 text-[10px] text-red-700 font-black uppercase">
                    Pasien
                  </span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold py-3.5 px-4 shadow-lg shadow-red-200 hover:shadow-red-300 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Simpan Jadwal Praktek</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ======================== RIGHT COLUMN: DAY TABS WITH POLIKLINIK GROUPING ======================== */}
          <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 shadow-xl p-5 md:p-6 space-y-6">
            
            {/* COLUMN HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Jadwal Praktek Terdaftar</h2>
                  <p className="text-[10px] text-slate-400 font-semibold">Total aktif: {schedules.length} jadwal di sistem</p>
                </div>
              </div>
              <button 
                onClick={loadData}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold cursor-pointer"
              >
                🔄 Refresh
              </button>
            </div>

            {/* DAY SELECTOR TABS */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-50 border border-slate-100 rounded-2xl">
              {days.map((day) => {
                const count = schedules.filter((s) => s.hari === day).length;
                const isActive = activeTabHari === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setActiveTabHari(day);
                      setConfirmDeleteId(null);
                    }}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>{day}</span>
                    <span className={`inline-flex items-center justify-center w-4 h-4 text-[9px] font-black rounded-full ${
                      isActive ? 'bg-white text-red-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* GROUPED LIST OF SCHEDULES */}
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
                <div className="text-xs text-slate-400 font-bold">Memuat jadwal praktek dokter...</div>
              </div>
            ) : Object.keys(groupedSchedules).length === 0 ? (
              <div className="py-16 border-2 border-dashed border-slate-100 rounded-2xl text-center space-y-3">
                <div className="text-3xl">☕</div>
                <div className="text-xs text-slate-400 font-bold">Tidak ada jadwal praktek pada hari {activeTabHari}.</div>
                <p className="text-[10px] text-slate-300 font-semibold">Semua dokter di poliklinik libur praktek.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(groupedSchedules).map((group) => (
                  <div 
                    key={group.poliName}
                    className={`border-l-4 border-slate-200 border rounded-r-2xl rounded-l-none bg-slate-50/15 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}
                    style={{ borderLeftColor: group.poliName === 'Poli Umum' ? '#94a3b8' : group.poliName === 'Poli Anak (Pediatri)' ? '#10b981' : group.poliName === 'Poli Gigi & Mulut' ? '#0ea5e9' : group.poliName === 'Poli Penyakit Dalam' ? '#8b5cf6' : '#f43f5e' }}
                  >
                    {/* Poliklinik Section Header */}
                    <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          group.poliName === 'Poli Umum' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          group.poliName === 'Poli Anak (Pediatri)' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          group.poliName === 'Poli Gigi & Mulut' ? 'bg-sky-50 text-sky-800 border-sky-100' :
                          group.poliName === 'Poli Penyakit Dalam' ? 'bg-violet-50 text-violet-800 border-violet-100' :
                          'bg-rose-50 text-rose-800 border-rose-100'
                        }`}>
                          🏥 {group.poliName}
                        </span>
                      </div>
                      {group.lokasi && (
                        <span className="text-[9px] text-slate-400 font-extrabold flex items-center gap-1">
                          <span>📍</span> {group.lokasi}
                        </span>
                      )}
                    </div>

                    {/* Doctors List in this Poliklinik */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {group.items.map((item) => (
                        <div 
                          key={item.id_jadwal} 
                          className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/30 transition-colors"
                        >
                          {/* Doctor Identity */}
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-slate-800">
                              {item.master_dokter?.nama_dokter}
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold italic">
                              SIP: {item.master_dokter?.sip_dokter}
                            </p>
                          </div>

                          {/* Time & Quota Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Time Badge */}
                            <span className="inline-flex items-center gap-1 bg-red-50 border border-red-100/50 text-red-950 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                              🕒 {item.jam_mulai} - {item.jam_selesai}
                            </span>

                            {/* Quota Badge */}
                            <span className="inline-flex items-center bg-slate-100 border border-slate-200/50 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                              👥 {item.kuota} Pasien
                            </span>

                            {/* Delete Action Button */}
                            <div className="pl-2">
                              {confirmDeleteId === item.id_jadwal ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleHapusJadwal(item.id_jadwal)}
                                    disabled={deletingId === item.id_jadwal}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black cursor-pointer shadow-sm active:scale-95 transition-all"
                                  >
                                    {deletingId === item.id_jadwal ? '...' : 'Ya, Hapus'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-black cursor-pointer active:scale-95 transition-all"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(item.id_jadwal)}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer shadow-sm active:scale-95"
                                  title="Hapus Jadwal"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </MasterLayout>
  );
}
