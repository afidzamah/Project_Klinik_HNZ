'use client';

import { API_URL } from '@/lib/api';
import React, { useState, useEffect, useRef } from 'react';

type ScreenState = 
  | 'home' 
  | 'pasien-baru' 
  | 'pasien-lama' 
  | 'pasien-lama-profil' 
  | 'pasien-lama-poli' 
  | 'pasien-lama-dokter' 
  | 'pasien-lama-bayar' 
  | 'pasien-lama-konfirmasi' 
  | 'sukses';

export default function KioskPage() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('home');
  const [nikInput, setNikInput] = useState('');
  const [nomorAntrean, setNomorAntrean] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Master Data Lists for Touch Wizard (Doctors will have computed queue stats)
  const [polikliniks, setPolikliniks] = useState<any[]>([]);
  const [dokters, setDokters] = useState<any[]>([]);
  const [caraBayars, setCaraBayars] = useState<any[]>([]);

  // Active Patient States (Loaded by NIK lookup)
  const [patientData, setPatientData] = useState<any>(null);

  // Selected Values for Registration Wizard
  const [selectedPoli, setSelectedPoli] = useState('');
  const [selectedPoliName, setSelectedPoliName] = useState('');
  const [selectedDokter, setSelectedDokter] = useState('');
  const [selectedDokterName, setSelectedDokterName] = useState('');
  const [selectedCaraBayar, setSelectedCaraBayar] = useState('');
  const [selectedCaraBayarName, setSelectedCaraBayarName] = useState('');

  // Input Ref for auto-focus NIK
  const nikInputRef = useRef<HTMLInputElement>(null);

  // 7 Presets Clinical Theme Engine
  const themesList = [
    { id: 'warm-white', label: 'Warm White', color: '#F8F5F0', icon: '☀️', isDark: false },
    { id: 'dark-slate', label: 'Dark Slate', color: '#4A5568', icon: '🌙', isDark: true },
    { id: 'pale-fern', label: 'Pale Fern', color: '#C4DDD0', icon: '🌿', isDark: false },
    { id: 'mint-mist', label: 'Mint Mist', color: '#B8EDF0', icon: '🍃', isDark: false },
    { id: 'lilac-soft', label: 'Lilac Morning', color: '#784FBE', icon: '🪻', isDark: false },
    { id: 'ocean-deep', label: 'Ocean Deep', color: '#1A78C8', icon: '🌊', isDark: true },
    { id: 'blush-cloud', label: 'Blush Cloud', color: '#FFE4EF', icon: '🌸', isDark: false },
    { id: 'pink-soft', label: 'Pink Soft', color: '#F9A8D4', icon: '💗', isDark: false },
    { id: 'sunny-accent', label: 'Citrus Burst', color: '#E87818', icon: '🍊', isDark: false },
    { id: 'blood-moon', label: 'Blood Moon', color: '#B82858', icon: '🌑', isDark: true },
    { id: 'terracotta', label: 'Terracotta Dusk', color: '#C05A30', icon: '🏺', isDark: true },
    { id: 'cozy-lavender', label: 'Cozy Lavender', color: '#8B6BBE', icon: '💜', isDark: false },
    { id: 'deep-bark', label: 'Deep Bark', color: '#5A9A72', icon: '🌲', isDark: true },
    { id: 'cosmic-nebula', label: 'Cosmic Nebula', color: '#6820C0', icon: '🔮', isDark: true },
    { id: 'sky-minimal', label: 'Sky Minimal', color: '#2A7FD4', icon: '☁️', isDark: false },
  ];

  const [activeTheme, setActiveTheme] = useState<string>('dark-slate'); // Kiosk defaults to dark-slate for touch screen comfort
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  // Apply theme preset class to html root
  const applyThemePreset = (presetId: string) => {
    const root = document.documentElement;
    
    // Remove all previous theme classes
    themesList.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.remove('dark');

    // Add new preset class
    root.classList.add(`theme-${presetId}`);
    
    // If dark slate, add .dark class for general utility support
    const preset = themesList.find(t => t.id === presetId);
    if (preset?.isDark) {
      root.classList.add('dark');
    }

    setActiveTheme(presetId);
    localStorage.setItem('hnz_theme_preset', presetId);
  };

  // Load theme preset on mount
  useEffect(() => {
    const savedPreset = localStorage.getItem('hnz_theme_preset') || 'dark-slate';
    applyThemePreset(savedPreset);
  }, []);

  // Clock & Date Realtime Updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setCurrentTime(timeStr + ' WIB');

      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Master Data on Mount & Whenever CurrentScreen changes to fetch fresh real-time doctor queue stats
  const fetchMasterDataForKiosk = async () => {
    try {
      const [resPoli, resDokter, resBayar] = await Promise.all([
        fetch(`${API_URL}/master-poliklinik`),
        fetch(`${API_URL}/master-dokter`),
        fetch(`${API_URL}/master-cara-bayar`),
      ]);

      if (resPoli.ok) {
        const polis = await resPoli.json();
        setPolikliniks(polis);
      }
      if (resDokter.ok) {
        const docs = await resDokter.json();
        setDokters(docs);
      }
      if (resBayar.ok) {
        const pays = await resBayar.json();
        setCaraBayars(pays);
      }
    } catch (err) {
      console.error('Gagal memuat data master kiosk:', err);
    }
  };

  useEffect(() => {
    fetchMasterDataForKiosk();
  }, [currentScreen]);

  // Auto-focus NIK input when entering Pasien Lama screen
  useEffect(() => {
    if (currentScreen === 'pasien-lama') {
      setTimeout(() => {
        nikInputRef.current?.focus();
      }, 300); // 300ms transition time
    }
  }, [currentScreen]);

  // Success screen auto-reset timer (10 seconds)
  useEffect(() => {
    if (currentScreen === 'sukses') {
      const timer = setTimeout(() => {
        handleResetWizard();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Reset all registration wizard states
  const handleResetWizard = () => {
    setCurrentScreen('home');
    setNikInput('');
    setNomorAntrean('');
    setPatientData(null);
    setSelectedPoli('');
    setSelectedPoliName('');
    setSelectedDokter('');
    setSelectedDokterName('');
    setSelectedCaraBayar('');
    setSelectedCaraBayarName('');
  };

  // Kiosk Pendaftaran Pasien Baru (Ke Loket Pendaftaran)
  const handleCetakAntreanPasienBaru = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/antrean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: null,
          tipe_antrean: 'Loket',
        }),
      });

      if (!response.ok) throw new Error('Gagal mencetak nomor antrean.');
      const data = await response.json();
      
      setNomorAntrean(data.no_antrean);
      setCurrentScreen('sukses');
    } catch (error: any) {
      alert(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Virtual Keyboard Input Handlers
  const handleNikInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleaned = val.replace(/\D/g, ''); // numerical values only
    setNikInput(cleaned);
  };

  const handleNumpadClick = (num: string) => {
    if (nikInput.length < 16) {
      setNikInput(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setNikInput(prev => prev.slice(0, -1));
  };

  // Verify Patient Profile & Load last 5 visits
  const handleVerifyPatientByNik = async () => {
    if (nikInput.length < 16) {
      alert('⚠️ Peringatan: NIK KTP wajib berupa 16 digit angka lengkap!');
      nikInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/pasien/nik/${nikInput}`);
      if (!response.ok) throw new Error('Gagal mencari data pasien.');
      
      const data = await response.json();
      if (!data) {
        alert('❌ Data Pasien tidak ditemukan!\nSilakan pastikan NIK Anda benar atau silakan ambil antrean "Pasien Baru" di loket pendaftaran.');
        nikInputRef.current?.focus();
        return;
      }

      setPatientData(data);
      setCurrentScreen('pasien-lama-profil');
    } catch (error) {
      console.error(error);
      alert('Koneksi Gagal: Gagal menghubungi server basis data.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Action "Daftar Lagi" (1-Click Re-registration)
  const handleDaftarLagi = (visit: any) => {
    setSelectedPoli(visit.id_poli || '');
    setSelectedPoliName(visit.nama_poli || 'Poliklinik');
    setSelectedDokter(visit.id_dokter || '');
    setSelectedDokterName(visit.nama_dokter || 'Dokter');
    setSelectedCaraBayar(visit.id_cara_bayar || '');
    setSelectedCaraBayarName(visit.cara_bayar?.nama_cara_bayar || 'Umum Pribadi');
    
    setCurrentScreen('pasien-lama-konfirmasi');
  };

  // Submit Registration and Create queue directly to Nurse Station
  const handleKonfirmasiPendaftaran = async () => {
    setLoading(true);
    try {
      // 1. Simpan Kunjungan Baru
      const resKunjungan = await fetch(`${API_URL}/kunjungan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pasien: patientData.id_pasien,
          id_poli: selectedPoli,
          id_dokter: selectedDokter,
          tgl_kunjungan: new Date().toISOString(),
          id_cara_bayar: selectedCaraBayar || null,
          id_penjamin: null,
          id_asal_rujukan: null,
          detail_asal_rujukan: null,
        }),
      });

      if (!resKunjungan.ok) throw new Error('Gagal memproses pendaftaran kunjungan.');
      const dataKunjungan = await resKunjungan.json();

      // 2. Alirkan nomor antrean langsung ke Nurse Station
      const resAntrean = await fetch(`${API_URL}/antrean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: dataKunjungan.id_kunjungan,
          tipe_antrean: 'Nurse',
        }),
      });

      if (!resAntrean.ok) throw new Error('Gagal menjadwalkan antrean perawat.');
      const dataAntrean = await resAntrean.json();

      setNomorAntrean(dataAntrean.no_antrean);
      setCurrentScreen('sukses');
    } catch (err: any) {
      alert(`Gagal Mendaftar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] font-sans select-none z-50 transition-colors duration-500">
      
      {/* ======================== BACKGROUND LUXURY GLOWING BALLS ======================== */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-white/10 dark:bg-white/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-amber-200/20 dark:bg-slate-900/40 rounded-full blur-[140px] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute top-[35%] right-[10%] w-[300px] h-[300px] bg-amber-100/10 dark:bg-white/3 rounded-full blur-[90px] pointer-events-none transition-colors duration-500"></div>

      {/* ======================== LUXURY CLINIC HEADER ======================== */}
      <header className="relative z-20 bg-white dark:bg-[#2D3748] px-6 py-4.5 flex justify-between items-center border-b border-slate-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/10 transition-colors duration-300">
        
        {/* Left Side: Brand Logo and Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10.5 h-10.5 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-xl shadow-lg shadow-black/15">
            🏥
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              KLINIK UTAMA <span className="bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">HNZ</span>
            </h1>
            <span className="block text-[8px] font-black text-slate-500 dark:text-slate-355 uppercase tracking-widest mt-1">
              SELF-REGISTRATION TERMINAL &bull; PREMIUM EDITION
            </span>
          </div>
        </div>

        {/* Right Side: 7-Preset Theme Dropdown & Time Clock, Date */}
        <div className="flex items-center gap-5">
          
          {/* 7-Preset Clinical Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
              title="Pilih Preset Tema Klinik"
              className="flex h-10 px-3 items-center gap-2 rounded-xl bg-slate-100 dark:bg-[#1A202C] border border-slate-200 dark:border-white/10 hover:border-red-200 hover:bg-red-50 text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer active:scale-95 duration-200 select-none"
            >
              <span>{themesList.find(t => t.id === activeTheme)?.icon}</span>
              <span className="hidden sm:inline">{themesList.find(t => t.id === activeTheme)?.label}</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </button>

            {isThemePickerOpen && (
              <>
                {/* Invisible overlay to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsThemePickerOpen(false)}
                />
                {/* Floating Menu */}
                <div className="absolute right-0 mt-2.5 w-52 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A202C] p-2.5 shadow-2xl z-50 animate-scale-up">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-2.5 mb-2 text-left">Preset Tema Klinik</span>
                  <div className="space-y-1">
                    {themesList.map((preset) => {
                      const isActive = activeTheme === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            applyThemePreset(preset.id);
                            setIsThemePickerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-red-50 dark:bg-slate-800 text-red-600 dark:text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{preset.icon}</span>
                            <span>{preset.label}</span>
                          </div>
                          {/* Color Pill */}
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-slate-200/80 dark:border-white/10 shadow-3xs" 
                            style={{ backgroundColor: preset.color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Dynamic Clock & Date */}
          <div className="flex flex-col text-right font-mono">
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-300 tracking-wider uppercase">{currentDate}</span>
            <span className="text-sm font-black text-amber-500 dark:text-amber-400 tracking-wider mt-0.5">{currentTime}</span>
          </div>
        </div>
      </header>

      {/* ======================== MAIN WIZARD CONTAINER ======================== */}
      <main className="kiosk-main flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-5xl mx-auto overflow-hidden">
        
        {/* ================= SCREEN 1: BERANDA / HOME ================= */}
        {currentScreen === 'home' && (
          <div className="w-full text-center space-y-10 animate-fade-in">
            <div className="space-y-3">
              <span className="inline-block text-[10px] font-black tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-full border border-amber-500/20">
                Pusat Registrasi Mandiri
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Selamat Datang di Klinik Utama HNZ
              </h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-205 font-bold max-w-md mx-auto leading-relaxed">
                Silakan sentuh layar sesuai dengan status riwayat kedatangan Anda sebelumnya.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mt-4">
              
              {/* PASIEN BARU CARD */}
              <button 
                onClick={() => setCurrentScreen('pasien-baru')}
                className="group flex h-64 flex-col items-center justify-center rounded-[32px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-600 transition-all duration-355 active:scale-[0.97] cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-red-700"></div>
                <div className="w-18 h-18 rounded-3xl bg-slate-100 dark:bg-red-950/30 flex items-center justify-center text-4xl mb-5 shadow-inner group-hover:scale-108 transition-all duration-350 border border-slate-200 dark:border-red-900/10">
                  🆕
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                  PASIEN BARU
                </h3>
                <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-300 font-bold max-w-xs leading-relaxed">
                  Belum memiliki Nomor Rekam Medis (RM) & baru pertama kali berkunjung.
                </p>
              </button>

              {/* PASIEN LAMA CARD */}
              <button 
                onClick={() => setCurrentScreen('pasien-lama')}
                className="group flex h-64 flex-col items-center justify-center rounded-[32px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-600 transition-all duration-355 active:scale-[0.97] cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 to-amber-700"></div>
                <div className="w-18 h-18 rounded-3xl bg-slate-100 dark:bg-amber-950/30 flex items-center justify-center text-4xl mb-5 shadow-inner group-hover:scale-108 transition-all duration-350 border border-slate-200 dark:border-amber-900/10">
                  📇
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  PASIEN LAMA
                </h3>
                <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-300 font-bold max-w-xs leading-relaxed">
                  Sudah terdaftar / Memiliki Rekam Medis (RM) di Klinik HNZ.
                </p>
              </button>

            </div>
          </div>
        )}

        {/* ================= SCREEN 2: PASIEN BARU ================= */}
        {currentScreen === 'pasien-baru' && (
          <div className="w-full max-w-lg rounded-[40px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-8 md:p-10 text-center shadow-xl border border-slate-200/80 dark:border-white/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-red-700"></div>
            
            <span className="text-5xl mb-4 block filter drop-shadow">🎫</span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cetak Tiket Loket</h2>
            <p className="mt-3 text-xs md:text-sm text-slate-600 dark:text-slate-300 font-bold max-w-md mx-auto leading-relaxed">
              Silakan ambil tiket antrean. Nomor Anda akan dipanggil oleh petugas loket di meja depan untuk pembuatan Rekam Medis baru.
            </p>
            
            <div className="my-7 rounded-[24px] bg-[#FAF8F5] dark:bg-[#2D3748] border border-slate-200 dark:border-[#1A202C] p-6 shadow-inner">
              <span className="text-[9px] font-black text-red-500 dark:text-red-400 tracking-widest block uppercase">LOKASI ANTREAN</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-red-450 block mt-1 tracking-tight">LOKET PENDAFTARAN BARU</span>
            </div>

            <div className="flex flex-col gap-3.5 max-w-xs mx-auto">
              <button 
                disabled={loading}
                onClick={handleCetakAntreanPasienBaru}
                className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-xs font-black tracking-widest text-white py-4.5 shadow-lg shadow-red-600/20 active:scale-98 transition-all cursor-pointer"
              >
                {loading ? '⏳ MEMPROSES TIKET...' : '🖨️ CETAK TIKET LOKET'}
              </button>
              <button 
                disabled={loading}
                onClick={() => setCurrentScreen('home')}
                className="w-full rounded-2xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] py-3.5 text-xs font-black text-slate-600 dark:text-slate-355 transition-all cursor-pointer border border-slate-200/80 dark:border-[#1A202C]"
              >
                KEMBALI KE BERANDA
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 3: PASIEN LAMA (INPUT NIK KTP) ================= */}
        {currentScreen === 'pasien-lama' && (
          <div className="w-full max-w-md rounded-[36px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-6 md:p-7 shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 to-amber-500"></div>

            <h2 className="text-xl.5 font-black text-center text-slate-900 dark:text-white tracking-tight">Self-Registrasi Kunjungan</h2>
            <p className="text-[9px] text-center text-slate-500 dark:text-slate-355 font-black uppercase tracking-widest mt-1 mb-5">
              Masukkan 16 Digit NIK KTP Anda
            </p>
            
            {/* DISPLAY INPUT PANEL FOR NIK */}
            <div 
              onClick={() => nikInputRef.current?.focus()}
              className="mb-5 rounded-[22px] bg-[#FAF8F5] dark:bg-[#2D3748] p-4.5 text-center border-2 border-slate-200 dark:border-[#1A202C] focus-within:border-amber-500 dark:focus-within:border-amber-550 focus-within:ring-4 focus-within:ring-amber-500/10 dark:focus-within:ring-amber-550/5 transition-all duration-300 cursor-text relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/2 to-transparent pointer-events-none h-full w-full"></div>

              <input
                ref={nikInputRef}
                type="text"
                maxLength={16}
                value={nikInput}
                onChange={handleNikInputChange}
                className="w-full bg-transparent text-center text-3.5xl font-mono font-black tracking-widest text-amber-600 dark:text-amber-400 outline-none border-none p-0 focus:ring-0 focus:outline-none placeholder-slate-300 dark:placeholder-slate-500"
                placeholder="________________"
              />
              <div className="flex justify-between items-center text-[9px] mt-2.5 text-slate-500 dark:text-slate-350 font-black uppercase tracking-widest pl-1">
                <span>⌨️ Ketik NIK atau Sentuh Tombol</span>
                <span className={nikInput.length === 16 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>
                  {nikInput.length} / 16 DIGIT
                </span>
              </div>
            </div>

            {/* NUMPAD VIRTUAL KEYS */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button 
                  key={num} 
                  type="button"
                  onClick={() => handleNumpadClick(num)} 
                  className="h-13.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] hover:bg-slate-100 dark:hover:bg-[#3A4556] text-xl font-mono font-black text-slate-800 dark:text-white border border-slate-200 dark:border-[#1A202C] active:scale-95 shadow-xs transition-all duration-150 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button"
                onClick={handleBackspace} 
                className="h-13.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-xs font-black text-amber-600 dark:text-amber-400 border border-amber-500/25 dark:border-amber-500/30 active:scale-95 shadow-xs transition-all cursor-pointer"
              >
                ⌫ HAPUS
              </button>
              
              <button 
                type="button"
                onClick={() => handleNumpadClick('0')} 
                className="h-13.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] hover:bg-slate-100 dark:hover:bg-[#3A4556] text-xl font-mono font-black text-slate-800 dark:text-white border border-slate-200 dark:border-[#1A202C] active:scale-95 shadow-xs transition-all cursor-pointer"
              >
                0
              </button>

              <button 
                type="button"
                onClick={() => setNikInput('')} 
                className="h-13.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-xs font-black text-rose-600 dark:text-rose-400 border border-rose-500/25 dark:border-rose-500/30 active:scale-95 shadow-xs transition-all cursor-pointer"
              >
                ❌ RESET
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2.5">
              <button 
                type="button"
                disabled={loading}
                onClick={handleVerifyPatientByNik}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-600 dark:to-amber-555 text-xs font-black tracking-widest text-white py-4 shadow-lg shadow-amber-600/20 active:scale-98 transition-all cursor-pointer"
              >
                {loading ? '⏳ MENCARI DATA...' : '🔍 CARI DATA REKAM MEDIS'}
              </button>

              <button 
                type="button"
                onClick={() => { handleResetWizard(); }} 
                className="w-full rounded-2xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] py-3 text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-355 transition-all text-center cursor-pointer border border-slate-200/80 dark:border-[#1A202C]"
              >
                BATALKAN & KEMBALI
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 4: PATIENT PROFILE & VISIT HISTORY ================= */}
        {currentScreen === 'pasien-lama-profil' && patientData && (
          <div className="w-full max-w-4xl rounded-[36px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-6.5 shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in flex flex-col gap-5 overflow-hidden max-h-[80vh]">
            
            {/* Header Profil */}
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/5 pb-3">
              <div>
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase block">PROFIL REKAM MEDIS TERDAFTAR</span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 mt-0.5 font-sans">
                  👋 Halo, <span className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent">{patientData.nama_lengkap}</span>
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">NO REKAM MEDIS</span>
                <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{patientData.no_rm}</span>
              </div>
            </div>

            {/* Content: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-stretch min-h-0 overflow-hidden">
              
              {/* Kolom Kiri: Detail Profil */}
              <div className="md:col-span-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] p-5 border border-slate-200/80 dark:border-[#1A202C] flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Identitas Pasien</h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">NIK (Nomor Induk Kependudukan)</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-205 font-mono tracking-wider">{patientData.nik}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Tanggal Lahir</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-205">
                        {new Date(patientData.tgl_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Nomor Kontak</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-205 font-mono">{patientData.no_kontak || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Alamat Lengkap</span>
                      <span className="font-semibold text-slate-750 dark:text-slate-250 leading-relaxed block text-[11px] mt-0.5">
                        {patientData.alamat_lengkap || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-bold border-t border-slate-200/50 dark:border-white/5 pt-3 mt-4">
                  *Silakan hubungi petugas loket pendaftaran jika ingin melakukan perubahan data identitas.
                </div>
              </div>

              {/* Kolom Kanan: Riwayat Kunjungan */}
              <div className="md:col-span-3 flex flex-col gap-3 min-h-0">
                <h3 className="text-xs font-black text-slate-650 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Riwayat Kunjungan Medis</span>
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Maks 5 Kunjungan
                  </span>
                </h3>

                {/* Visit List scrollable box */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[36vh]">
                  {(!patientData.kunjungan || patientData.kunjungan.length === 0) ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-[#2D3748] rounded-2xl border border-slate-200 dark:border-[#1A202C]">
                      📭 Belum ada riwayat kunjungan pelayanan medis.
                    </div>
                  ) : (
                    patientData.kunjungan.map((visit: any) => (
                      <div 
                        key={visit.id_kunjungan}
                        className="rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] p-4 border border-slate-200/80 dark:border-[#1A202C] shadow-xs flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all duration-200"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono tracking-wider">{visit.no_kunjungan}</span>
                            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-[#4A5568] rounded-full"></span>
                            <span className="text-[9px] text-slate-400 font-bold">
                              {new Date(visit.tgl_kunjungan).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mt-1.5 truncate">
                            {visit.nama_poli}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                            👨‍⚕️ {visit.nama_dokter}
                          </p>
                          <span className="inline-block text-[8px] font-extrabold uppercase bg-slate-150 dark:bg-[#1A202C] text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/5 mt-2">
                            💵 {visit.cara_bayar?.nama_cara_bayar || 'Umum Pribadi'}
                          </span>
                        </div>

                        {/* 1-Click Quick Action Re-register */}
                        <button
                          type="button"
                          onClick={() => handleDaftarLagi(visit)}
                          className="px-4.5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-[10px] font-black tracking-widest text-white shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                          🔁 DAFTAR LAGI
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="grid grid-cols-2 gap-3.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleResetWizard()}
                    className="rounded-2xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] py-3.5 text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-355 transition-all text-center cursor-pointer border border-slate-200 dark:border-[#1A202C]"
                  >
                    ⬅️ KEMBALI KE BERANDA
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentScreen('pasien-lama-poli')}
                    className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-600 dark:to-amber-550 text-[10px] font-black tracking-widest text-white py-3.5 shadow-md active:scale-98 transition-all text-center cursor-pointer"
                  >
                    🚀 DAFTAR KLINIK / POLI BARU ➡️
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================= SCREEN 5: CHOOSE POLIKLINIK ================= */}
        {currentScreen === 'pasien-lama-poli' && (
          <div className="w-full max-w-4xl rounded-[36px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-6.5 shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in flex flex-col gap-6 overflow-hidden max-h-[80vh]">
            
            <div className="text-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase">SELEKSI LAYANAN MEDIS</span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Silakan Pilih Layanan Poliklinik</h2>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-bold mt-1">Pilih Poliklinik tujuan pemeriksaan yang Anda kehendaki.</p>
            </div>

            {/* Grid of Polikliniks */}
            <div className="flex-1 overflow-y-auto pr-1">
              {polikliniks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-[#2D3748] rounded-2xl border border-slate-200 dark:border-[#1A202C]">
                  📭 Belum ada Poliklinik aktif terdaftar di database.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5.5 py-1">
                  {polikliniks.map((poli) => {
                    // Emoji mapping based on name
                    let emoji = '🩺';
                    if (poli.nama_poli.toLowerCase().includes('gigi')) emoji = '🦷';
                    else if (poli.nama_poli.toLowerCase().includes('anak')) emoji = '👶';
                    else if (poli.nama_poli.toLowerCase().includes('mata')) emoji = '👁️';
                    else if (poli.nama_poli.toLowerCase().includes('kandungan') || poli.nama_poli.toLowerCase().includes('obgyn')) emoji = '🤰';
                    else if (poli.nama_poli.toLowerCase().includes('kulit')) emoji = '🧴';
                    else if (poli.nama_poli.toLowerCase().includes('jantung')) emoji = '❤️';
                    
                    return (
                      <button
                        key={poli.id_poli}
                        onClick={() => {
                          setSelectedPoli(poli.id_poli);
                          setSelectedPoliName(poli.nama_poli);
                          setCurrentScreen('pasien-lama-dokter');
                        }}
                        className="group flex flex-col items-center justify-center p-6 h-36 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] hover:bg-slate-100 dark:hover:bg-[#3A4556] border border-slate-200 dark:border-[#1A202C] hover:border-amber-500 dark:hover:border-amber-500 shadow-sm active:scale-96 transition-all duration-200 text-center cursor-pointer relative overflow-hidden"
                      >
                        <span className="text-3xl mb-3.5 group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                          {poli.nama_poli}
                        </h3>
                        <span className="block text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">
                          📍 {poli.lokasi_gedung || 'Lt. 1 Gedung Utama'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Back button */}
            <div className="flex justify-start border-t border-slate-200/60 dark:border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('pasien-lama-profil')}
                className="rounded-xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] px-8 py-3 text-xs font-black tracking-widest text-slate-600 dark:text-slate-355 transition-all cursor-pointer border border-slate-200/80 dark:border-[#1A202C]"
              >
                ⬅️ KEMBALI
              </button>
            </div>

          </div>
        )}

        {/* ================= SCREEN 6: CHOOSE DOKTER ================= */}
        {currentScreen === 'pasien-lama-dokter' && (
          <div className="w-full max-w-4xl rounded-[36px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-6.5 shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in flex flex-col gap-6 overflow-hidden max-h-[80vh]">
            
            <div className="text-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase">{selectedPoliName}</span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Pilih Dokter Spesialis</h2>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-bold mt-1">Tentukan Dokter Spesialis bertugas yang akan melakukan pemeriksaan medis.</p>
            </div>

            {/* Grid of Doctors with computed Slots & Queue statistics */}
            <div className="flex-1 overflow-y-auto pr-1">
              {dokters.filter(d => d.id_poli === selectedPoli).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-[#2D3748] rounded-2xl border border-slate-200 dark:border-[#1A202C]">
                  📭 Maaf, belum ada Dokter aktif yang bertugas di {selectedPoliName} hari ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-1">
                  {dokters.filter(d => d.id_poli === selectedPoli).map((doc) => (
                    <button
                      key={doc.id_dokter}
                      onClick={() => {
                        setSelectedDokter(doc.id_dokter);
                        setSelectedDokterName(doc.nama_dokter);
                        setCurrentScreen('pasien-lama-bayar');
                      }}
                      className="group flex flex-col p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] hover:bg-slate-100 dark:hover:bg-[#3A4556] border border-slate-200 dark:border-[#1A202C] hover:border-amber-500 dark:hover:border-amber-500 shadow-md active:scale-97 transition-all duration-200 cursor-pointer text-left relative overflow-hidden"
                    >
                      {/* Doctor Profile Info */}
                      <div className="flex items-center w-full mb-3.5">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl shadow-inner shrink-0 mr-4 group-hover:scale-105 transition-transform">
                          👨‍⚕️
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white truncate">
                            {doc.nama_dokter}
                          </h3>
                          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5 truncate">
                            SIP: {doc.sip_dokter || 'SIP/HNZ/ACTIVE/009'}
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-full border-t border-slate-200 dark:border-white/5 my-0.5"></div>

                      {/* Touchscreen Real-time Slot & Queue Badges */}
                      <div className="grid grid-cols-3 gap-2 w-full mt-3 text-[9px] font-black uppercase text-center tracking-wider">
                        <div className={`rounded-xl py-1.5 px-1 border ${
                          doc.sisa_slot > 0 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 dark:bg-rose-500/15'
                        }`}>
                          <span className="block text-[7px] text-slate-500 dark:text-slate-400 font-bold leading-none mb-0.5">Sisa Slot</span>
                          <span className="text-xs font-mono font-black">{doc.sisa_slot}</span>
                        </div>
                        <div className="rounded-xl py-1.5 px-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15">
                          <span className="block text-[7px] text-slate-500 dark:text-slate-400 font-bold leading-none mb-0.5">Terdaftar</span>
                          <span className="text-xs font-mono font-black">{doc.terdaftar}</span>
                        </div>
                        <div className="rounded-xl py-1.5 px-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 dark:bg-amber-500/15">
                          <span className="block text-[7px] text-slate-500 dark:text-slate-400 font-bold leading-none mb-0.5">Menunggu</span>
                          <span className="text-xs font-mono font-black">{doc.belum_dilayani}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Back button */}
            <div className="flex justify-start border-t border-slate-200/60 dark:border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('pasien-lama-poli')}
                className="rounded-xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] px-8 py-3 text-xs font-black tracking-widest text-slate-600 dark:text-slate-355 transition-all cursor-pointer border border-slate-200/80 dark:border-[#1A202C]"
              >
                ⬅️ KEMBALI
              </button>
            </div>

          </div>
        )}

        {/* ================= SCREEN 7: CHOOSE CARA BAYAR ================= */}
        {currentScreen === 'pasien-lama-bayar' && (
          <div className="w-full max-w-4xl rounded-[36px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-6.5 shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in flex flex-col gap-6 overflow-hidden max-h-[80vh]">
            
            <div className="text-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase">PROSES VERIFIKASI BIAYA</span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Pilih Metode Penjaminan Biaya</h2>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-bold mt-1">Tentukan metode cara bayar penjamin yang akan digunakan untuk proses klaim administrasi.</p>
            </div>

            {/* Grid of Payment Methods */}
            <div className="flex-1 overflow-y-auto pr-1">
              {caraBayars.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-[#2D3748] rounded-2xl border border-slate-200 dark:border-[#1A202C]">
                  📭 Belum ada data Metode Penjaminan aktif.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5.5 py-1">
                  {caraBayars.map((cb) => {
                    // Icon and color glow selection based on method name
                    let emoji = '💳';
                    let glowBorder = 'hover:border-amber-500';
                    if (cb.nama_cara_bayar.toLowerCase().includes('bpjs')) {
                      emoji = '🏥';
                      glowBorder = 'hover:border-emerald-500';
                    } else if (cb.nama_cara_bayar.toLowerCase().includes('asuransi') || cb.nama_cara_bayar.toLowerCase().includes('perusahaan')) {
                      emoji = '🛡️';
                      glowBorder = 'hover:border-blue-500';
                    }
                    
                    return (
                      <button
                        key={cb.id_cara_bayar}
                        onClick={() => {
                          setSelectedCaraBayar(cb.id_cara_bayar);
                          setSelectedCaraBayarName(cb.nama_cara_bayar);
                          setCurrentScreen('pasien-lama-konfirmasi');
                        }}
                        className={`group flex flex-col items-center justify-center p-6 h-36 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] hover:bg-slate-100 dark:hover:bg-[#3A4556] border border-slate-200 dark:border-[#1A202C] ${glowBorder} shadow-sm active:scale-96 transition-all duration-200 text-center cursor-pointer`}
                      >
                        <span className="text-3.5xl mb-3 group-hover:scale-108 transition-transform">{emoji}</span>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                          {cb.nama_cara_bayar}
                        </h3>
                        <span className="block text-[8px] font-black text-slate-500 dark:text-slate-355 bg-slate-100 dark:bg-[#1A202C] px-2 py-0.5 rounded border border-slate-200/50 dark:border-white/5">
                          AKSES SENTUH JEMPOL
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Back button */}
            <div className="flex justify-start border-t border-slate-200/60 dark:border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('pasien-lama-dokter')}
                className="rounded-xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] px-8 py-3 text-xs font-black tracking-widest text-slate-600 dark:text-slate-355 transition-all cursor-pointer border border-slate-200/80 dark:border-[#1A202C]"
              >
                ⬅️ KEMBALI
              </button>
            </div>

          </div>
        )}

        {/* ================= SCREEN 8: CONFIRMATION ================= */}
        {currentScreen === 'pasien-lama-konfirmasi' && patientData && (
          <div className="w-full max-w-lg rounded-[36px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-6.5 shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-500 to-teal-550"></div>

            <div className="text-center mb-5.5">
              <span className="inline-block text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1 rounded-full border border-emerald-500/15 uppercase">
                Konfirmasi Registrasi Mandiri
              </span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-2 tracking-tight">Verifikasi Pendaftaran Anda</h2>
            </div>

            {/* Digital Receipt Card */}
            <div className="mb-6 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D3748] p-5.5 border border-slate-200 dark:border-[#1A202C] relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/1 rounded-full blur-2xl pointer-events-none"></div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-start border-b border-dashed border-slate-200/60 dark:border-white/5 pb-3">
                  <div>
                    <span className="text-slate-400 text-[8.5px] font-bold uppercase tracking-wider block">NAMA PASIEN</span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-white uppercase">{patientData.nama_lengkap}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[8.5px] font-bold uppercase tracking-wider block">NO REKAM MEDIS</span>
                    <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">{patientData.no_rm}</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Poliklinik Tujuan</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-205 text-right uppercase bg-slate-100 dark:bg-[#1A202C] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/5">{selectedPoliName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Dokter Pemeriksa</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-205 text-right truncate max-w-[200px]">{selectedDokterName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Metode Penjaminan</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-205 text-right uppercase">{selectedCaraBayarName}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-slate-200/60 dark:border-white/5 pt-3.5 mt-2">
                    <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Antrean Dialirkan Ke</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-450 text-right uppercase flex items-center gap-1.5 font-sans">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Nurse Station
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed mb-5.5 px-3">
              💡 Setelah menekan tombol konfirmasi, printer akan otomatis mencetak nomor antrean pemeriksaan fisik awal di ruang perawat depan.
            </p>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button 
                type="button"
                disabled={loading}
                onClick={handleKonfirmasiPendaftaran}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-500 dark:to-teal-555 text-xs font-black tracking-widest text-white py-4.5 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer animate-pulse"
              >
                {loading ? '⏳ MENYIMPAN PENDAFTARAN...' : '✅ KONFIRMASI & AMBIL NO ANTREAN'}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setCurrentScreen('pasien-lama-profil');
                }} 
                className="w-full rounded-2xl bg-slate-100 dark:bg-[#2D3748] hover:bg-slate-200 dark:hover:bg-[#3A4556] py-3 text-[10px] font-black tracking-widest text-slate-650 dark:text-slate-355 transition-all text-center cursor-pointer border border-slate-200/80 dark:border-[#1A202C]"
              >
                UBAH DATA PENDAFTARAN
              </button>
            </div>

          </div>
        )}

        {/* ================= SCREEN 9: LAYAR SUKSES CETAK (NURSE TICKET) ================= */}
        {currentScreen === 'sukses' && (
          <div className="w-full max-w-xl rounded-[40px] bg-white dark:bg-[#1A202C]/90 backdrop-blur-2xl p-8 md:p-11 text-center shadow-2xl border border-slate-200/80 dark:border-white/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>

            <span className="text-7xl mb-4.5 block filter drop-shadow animate-bounce">🎉</span>
            <h2 className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-450 tracking-tight">
              Pendaftaran Kiosk Berhasil!
            </h2>
            <p className="mt-2.5 text-xs md:text-sm text-slate-650 dark:text-slate-300 font-bold max-w-sm mx-auto leading-relaxed">
              Silakan ambil tiket antrean fisik Anda. Transaksi billing administrasi pendaftaran telah dicatat otomatis.
            </p>
            
            {/* Glowing Neon Queue Ticket */}
            <div className="my-8 rounded-[28px] bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-2 border-dashed border-emerald-500 dark:border-emerald-555 max-w-xs mx-auto shadow-lg shadow-emerald-500/5 dark:shadow-emerald-950/20">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest block uppercase pt-3">NOMOR ANTREAN ANDA</span>
              <span className="text-5.5xl md:text-6.5xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-wider block mt-2 animate-pulse">{nomorAntrean}</span>
              <span className="block text-[8.5px] mt-4.5 mb-3 text-slate-650 dark:text-slate-350 font-black uppercase tracking-widest bg-slate-100 dark:bg-[#1A202C] py-1.5 rounded-lg border border-slate-200/60 dark:border-white/5 mx-3">
                📍 LANGSUNG MENUJU NURSE STATION
              </span>
            </div>

            <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold tracking-wider mb-6">
              Layar akan otomatis kembali ke menu utama dalam waktu 10 detik...
            </p>

            <button 
              onClick={handleResetWizard}
              className="w-full max-w-sm rounded-xl bg-slate-800 hover:bg-slate-750 py-3.5 text-xs font-black tracking-widest text-white transition-all shadow-md mx-auto block cursor-pointer active:scale-98"
            >
              KEMBALI KE BERANDA (INSTAN)
            </button>
          </div>
        )}

      </main>

      {/* ======================== LUXURY CLINIC FOOTER ======================== */}
      <footer className="relative z-20 p-4.5 bg-white dark:bg-[#2D3748] text-center text-[9px] text-slate-500 dark:text-slate-350 font-black border-t border-slate-200 dark:border-white/10 transition-colors duration-500 tracking-widest uppercase shadow-[0_-2px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.1)]">
        &copy; 2026 KLINIK UTAMA HNZ &bull; SELF-REGISTRATION SYSTEM &bull; PREMIUM HOSPITALS
      </footer>
    </div>
  );
}
