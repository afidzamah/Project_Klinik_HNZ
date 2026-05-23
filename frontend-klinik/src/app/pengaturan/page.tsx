'use client';

import { API_URL } from '@/lib/api';
import React, { useState, useEffect, useRef } from 'react';
import MasterLayout from '@/components/MasterLayout';

interface CaraBayar {
  id_cara_bayar: string;
  nama_cara_bayar: string;
}

interface SearchOption {
  value: string;
  label: string;
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
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border border-red-500/30 p-3 bg-red-50/10 text-red-950 font-bold outline-none text-xs text-left focus:ring-2 focus:ring-red-500 transition-all ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:bg-red-50/20'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-red-650 transition-transform duration-200 ml-2 shrink-0 ${
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
                  {opt.label}
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

export default function PengaturanPage() {
  const [masterCaraBayar, setMasterCaraBayar] = useState<CaraBayar[]>([]);
  const [defaultCaraBayarId, setDefaultCaraBayarId] = useState('');
  
  // Prefix states with defaults matching database seeder
  const [prefixPendaftaran, setPrefixPendaftaran] = useState('L');
  const [prefixNurse, setPrefixNurse] = useState('N');
  const [prefixDokter, setPrefixDokter] = useState('P');
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Separate loading states for tabbed submissions
  const [isSubmittingCaraBayar, setIsSubmittingCaraBayar] = useState(false);
  const [isSubmittingPrefix, setIsSubmittingPrefix] = useState(false);
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load master cara bayar
      const resCara = await fetch(`${API_URL}/master-cara-bayar`);
      if (!resCara.ok) throw new Error('Gagal memuat data cara bayar.');
      const dataCara: CaraBayar[] = await resCara.json();
      setMasterCaraBayar(dataCara);

      // Load all settings from backend pengaturan endpoint
      const resSetting = await fetch(`${API_URL}/pengaturan`);
      if (resSetting.ok) {
        const settings = await resSetting.json();
        if (Array.isArray(settings)) {
          const cb = settings.find((s) => s.kunci === 'default_cara_bayar');
          if (cb && cb.nilai) setDefaultCaraBayarId(cb.nilai);

          const prefPend = settings.find((s) => s.kunci === 'prefix_antrean_pendaftaran');
          if (prefPend && prefPend.nilai) setPrefixPendaftaran(prefPend.nilai);

          const prefNurse = settings.find((s) => s.kunci === 'prefix_antrean_nurse');
          if (prefNurse && prefNurse.nilai) setPrefixNurse(prefNurse.nilai);

          const prefDok = settings.find((s) => s.kunci === 'prefix_antrean_dokter');
          if (prefDok && prefDok.nilai) setPrefixDokter(prefDok.nilai);
        }
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat memuat konfigurasi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // HANDLER 1: SIMPAN DEFAULT CARA BAYAR (ISOLASI)
  const handleSimpanCaraBayar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!defaultCaraBayarId) {
      showNotification('error', 'Silakan pilih Default Cara Bayar terlebih dahulu.');
      return;
    }

    try {
      setIsSubmittingCaraBayar(true);
      const resCb = await fetch(`${API_URL}/pengaturan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunci: 'default_cara_bayar',
          nilai: defaultCaraBayarId,
          keterangan: 'Default Cara Bayar untuk Pendaftaran Pasien',
        }),
      });
      if (!resCb.ok) throw new Error('Gagal menyimpan Default Cara Bayar.');

      showNotification('success', 'Konfigurasi Default Cara Bayar berhasil disimpan!');
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSubmittingCaraBayar(false);
    }
  };

  // HANDLER 2: SIMPAN PREFIX ANTREAN (ISOLASI)
  const handleSimpanPrefixAntrean = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prefixPendaftaran.trim() || !prefixNurse.trim() || !prefixDokter.trim()) {
      showNotification('error', 'Semua prefix huruf depan antrean harus diisi!');
      return;
    }

    try {
      setIsSubmittingPrefix(true);

      // Save Prefix Pendaftaran
      const resPrefPend = await fetch(`${API_URL}/pengaturan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunci: 'prefix_antrean_pendaftaran',
          nilai: prefixPendaftaran.toUpperCase().trim(),
          keterangan: 'Prefix Huruf Antrean Pendaftaran (Loket)',
        }),
      });
      if (!resPrefPend.ok) throw new Error('Gagal menyimpan prefix antrean pendaftaran.');

      // Save Prefix Nurse Station
      const resPrefNurse = await fetch(`${API_URL}/pengaturan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunci: 'prefix_antrean_nurse',
          nilai: prefixNurse.toUpperCase().trim(),
          keterangan: 'Prefix Huruf Antrean Nurse Station (Perawat)',
        }),
      });
      if (!resPrefNurse.ok) throw new Error('Gagal menyimpan prefix antrean nurse station.');

      // Save Prefix Dokter
      const resPrefDokter = await fetch(`${API_URL}/pengaturan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunci: 'prefix_antrean_dokter',
          nilai: prefixDokter.toUpperCase().trim(),
          keterangan: 'Prefix Huruf Antrean Pemeriksaan Dokter',
        }),
      });
      if (!resPrefDokter.ok) throw new Error('Gagal menyimpan prefix antrean dokter.');

      showNotification('success', 'Konfigurasi Prefix Huruf Depan Antrean berhasil disimpan!');
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSubmittingPrefix(false);
    }
  };

  return (
    <MasterLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        
        {/* ======================== HEADER SECTION ======================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              ⚙️ Setting Fixed Data (Konfigurasi)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Atur nilai-nilai bawaan berulang (default) secara modular per tabulasi fungsi layanan klinik.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-red-50 text-red-650 border border-red-100 shadow-sm">
              ⚙️ Pengaturan Global
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

        {/* ======================== MAIN FORM CONTAINER ======================== */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-xl">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            <div className="text-xs text-slate-400 font-bold">Memuat konfigurasi global dari server...</div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TABULASI CARD 1: CARA BAYAR FORM */}
            <form onSubmit={handleSimpanCaraBayar} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <span className="text-2xl">💳</span>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Inisiasi Cara Bayar Otomatis</h2>
                  <p className="text-[10px] text-slate-400 font-semibold">Tentukan nilai default Cara Bayar saat loket pendaftaran pertama kali dimuat</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">
                    Default Cara Bayar
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Pilihan ini akan otomatis terpilih (pre-loaded) di halaman pendaftaran pasien baru. Petugas loket tetap dapat mengubahnya secara manual.
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <SearchableSelect
                    placeholder="-- Pilih Default Cara Bayar --"
                    value={defaultCaraBayarId}
                    onChange={(val) => setDefaultCaraBayarId(val)}
                    options={masterCaraBayar.map((c) => ({
                      value: c.id_cara_bayar,
                      label: c.nama_cara_bayar,
                    }))}
                  />
                </div>
              </div>

              {/* SAVE BUTTON FOR CARA BAYAR */}
              <div className="border-t border-slate-100 pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingCaraBayar}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-xs font-bold py-2.5 px-5 shadow-md shadow-red-100 hover:shadow-red-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCaraBayar ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Simpan Cara Bayar</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* TABULASI CARD 2: PREFIX ANTRIAN FORM */}
            <form onSubmit={handleSimpanPrefixAntrean} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <span className="text-2xl">🎫</span>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Prefix Huruf Depan Antrean</h2>
                  <p className="text-[10px] text-slate-400 font-semibold">Atur huruf depan untuk format penomoran antrean masing-masing divisi layanan</p>
                </div>
              </div>

              {/* INPUT 1: PENDAFTARAN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">
                    Antrean Pendaftaran (Loket)
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Huruf prefix yang digunakan untuk antrean registrasi awal di Kiosk & Loket. Contoh: <strong>L</strong>-001.
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <input
                    type="text"
                    maxLength={3}
                    required
                    value={prefixPendaftaran}
                    onChange={(e) => setPrefixPendaftaran(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-red-500/30 p-3 bg-red-50/10 text-red-950 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all uppercase"
                    placeholder="Contoh: L"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* INPUT 2: NURSE STATION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">
                    Antrean Nurse Station (Perawat)
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Huruf prefix yang digunakan untuk antrean pelayanan awal di Nurse Station. Contoh: <strong>N</strong>-001.
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <input
                    type="text"
                    maxLength={3}
                    required
                    value={prefixNurse}
                    onChange={(e) => setPrefixNurse(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-red-500/30 p-3 bg-red-50/10 text-red-950 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all uppercase"
                    placeholder="Contoh: N"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* INPUT 3: DOKTER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">
                    Antrean Pemeriksaan Dokter (Poli)
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Huruf prefix yang digunakan saat pasien dialirkan ke Pemeriksaan Dokter/Poli. Contoh: <strong>P</strong>-001.
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <input
                    type="text"
                    maxLength={3}
                    required
                    value={prefixDokter}
                    onChange={(e) => setPrefixDokter(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-red-500/30 p-3 bg-red-50/10 text-red-950 font-bold outline-none text-xs focus:ring-2 focus:ring-red-500 transition-all uppercase"
                    placeholder="Contoh: P"
                  />
                </div>
              </div>

              {/* SAVE BUTTON FOR PREFIX */}
              <div className="border-t border-slate-100 pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPrefix}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-750 hover:to-rose-750 text-white text-xs font-bold py-2.5 px-5 shadow-md shadow-red-100 hover:shadow-red-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPrefix ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Simpan Prefix Antrean</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        )}

      </div>
    </MasterLayout>
  );
}
