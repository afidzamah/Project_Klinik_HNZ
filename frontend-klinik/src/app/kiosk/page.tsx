'use client';

import { useState } from 'react';

export default function KioskPage() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'pasien-baru' | 'pasien-lama' | 'sukses'>('home');
  const [nikInput, setNikInput] = useState('');
  const [nomorAntrean, setNomorAntrean] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi mensimulasikan cetak tiket pendaftaran
  // Fungsi mengoneksikan Kiosk langsung ke PostgreSQL lewat API NestJS
  const handleCetakAntreanPasienBaru = async () => {
    setLoading(true);
    try {
      // Menembak API backend untuk membuat antrean Loket baru
      const response = await fetch('http://localhost:3000/antrean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_kunjungan: null, // Pasien baru belum memiliki ID kunjungan medis
          tipe_antrean: 'Loket', // Masuk ke antrean pendaftaran depan
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal berkomunikasi dengan server backend');
      }

      const dataResult = await response.json();

      // Membaca nomor antrean dinamis asli hasil kalkulasi database (L-001, L-002, dst)
      setNomorAntrean(dataResult.no_antrean);
      setCurrentScreen('sukses');
    } catch (error) {
      console.error(error);
      alert('Koneksi Gagal: Pastikan server backend NestJS sudah dinyalakan!');
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadClick = (value: string) => {
    if (nikInput.length < 16) {
      setNikInput((prev) => prev + value);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800">
      {/* HEADER KLINIK */}
      <header className="bg-red-600 p-6 text-center text-white shadow-md">
        <h1 className="text-4xl font-extrabold tracking-wide">KLINIK UTAMA HNZ</h1>
        <p className="mt-1 text-lg text-red-100">Sistem Antrean & Self-Registrasi Mandiri</p>
      </header>

      {/* AREA UTAMA */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        
        {/* ================= SCREEN 1: BERANDA / HOME ================= */}
        {currentScreen === 'home' && (
          <div className="w-full max-w-4xl text-center animate-fade-in">
            <h2 className="mb-12 text-3xl font-bold text-slate-700">Silakan Sentuh Layar Sesuai Status Kedatangan Anda</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <button 
                onClick={() => setCurrentScreen('pasien-baru')}
                className="flex h-64 flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-xl border-2 border-transparent hover:border-red-500 transition-all active:scale-95 text-center cursor-pointer"
              >
                <span className="text-6xl mb-4">🆕</span>
                <span className="text-2xl font-bold text-red-600">PASIEN BARU</span>
                <span className="mt-2 text-sm text-slate-500">Belum pernah berobat / Belum punya No. RM</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('pasien-lama')}
                className="flex h-64 flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-xl border-2 border-transparent hover:border-red-500 transition-all active:scale-95 text-center cursor-pointer"
              >
                <span className="text-6xl mb-4">📇</span>
                <span className="text-2xl font-bold text-slate-700">PASIEN LAMA</span>
                <span className="mt-2 text-sm text-slate-500">Sudah terdaftar / Self-Registrasi Poli</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: PASIEN BARU ================= */}
        {currentScreen === 'pasien-baru' && (
          <div className="w-full max-w-2xl rounded-3xl bg-white p-10 text-center shadow-2xl animate-fade-in">
            <span className="text-6xl mb-4 block">🎫</span>
            <h2 className="text-3xl font-bold text-slate-800">Antrean Loket Pendaftaran</h2>
            <p className="mt-2 text-slate-500">Silakan ambil nomor antrean Anda dan tunggu dipanggil oleh petugas loket.</p>
            
            <div className="my-10 rounded-2xl bg-red-50 p-6 border border-red-200">
              <span className="text-sm font-semibold text-red-700 tracking-wider block mb-1">KATEGORI TUJUAN</span>
              <span className="text-4xl font-black text-red-600">LOKET PENDAFTARAN A</span>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                disabled={loading}
                onClick={handleCetakAntreanPasienBaru}
                className="w-full rounded-2xl bg-red-600 py-5 text-xl font-bold text-white shadow-lg hover:bg-red-700 active:scale-98 transition-all disabled:bg-slate-400 cursor-pointer"
              >
                {loading ? '⏳ MEMPROSES TIKET...' : '🖨️ CETAK NOMOR ANTREAN'}
              </button>
              <button 
                disabled={loading}
                onClick={() => setCurrentScreen('home')}
                className="w-full rounded-2xl bg-slate-200 py-4 text-lg font-bold text-slate-600 hover:bg-slate-300 transition-all cursor-pointer"
              >
                KEMBALI
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 3: PASIEN LAMA (NUMPAD NIK) ================= */}
        {currentScreen === 'pasien-lama' && (
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Self-Registrasi Pasien</h2>
            <p className="text-sm text-center text-slate-500 mb-6">Masukkan 16 Digit NIK KTP Anda</p>
            
            <div className="mb-6 rounded-2xl bg-slate-100 p-4 text-center border-2 border-slate-200">
              <span className="text-3xl font-mono font-bold tracking-widest text-slate-700">
                {nikInput || '________________'}
              </span>
              <span className="block text-xs mt-2 text-slate-400">Jumlah: {nikInput.length}/16 Digit</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button key={num} onClick={() => handleNumpadClick(num)} className="h-16 rounded-xl bg-slate-50 text-2xl font-bold text-slate-700 border border-slate-200 active:bg-red-500 active:text-white shadow-sm transition-all cursor-pointer">{num}</button>
              ))}
              <button onClick={() => setNikInput('')} className="h-16 rounded-xl bg-red-50 text-xl font-bold text-red-600 border border-red-200 active:bg-red-600 active:text-white shadow-sm transition-all cursor-pointer">HAPUS</button>
              <button onClick={() => handleNumpadClick('0')} className="h-16 rounded-xl bg-slate-50 text-2xl font-bold text-slate-700 border border-slate-200 active:bg-red-500 active:text-white shadow-sm transition-all cursor-pointer">0</button>
              <button 
                onClick={() => {
                  if(nikInput.length < 16) { alert('NIK harus 16 digit!'); } 
                  else { setNomorAntrean('P-001'); setCurrentScreen('sukses'); }
                }}
                className="h-16 rounded-xl bg-red-600 text-xl font-bold text-white shadow-md active:bg-red-700 transition-all cursor-pointer"
              >
                CARI
              </button>
            </div>
            <button onClick={() => { setCurrentScreen('home'); setNikInput(''); }} className="w-full rounded-2xl bg-slate-200 py-4 text-lg font-bold text-slate-600 hover:bg-slate-300 transition-all text-center cursor-pointer">KEMBALI</button>
          </div>
        )}

        {/* ================= SCREEN 4: LAYAR SUKSES CETAK ================= */}
        {currentScreen === 'sukses' && (
          <div className="w-full max-w-2xl rounded-3xl bg-white p-10 text-center shadow-2xl border-t-8 border-emerald-500 animate-fade-in">
            <span className="text-7xl mb-4 block">🎉</span>
            <h2 className="text-3xl font-bold text-emerald-600">Tiket Berhasil Dicetak!</h2>
            <p className="mt-2 text-slate-500">Silakan ambil struk fisik Anda pada printer mesin kiosk di bawah.</p>
            
            <div className="my-8 rounded-2xl bg-emerald-50 p-8 border-2 border-dashed border-emerald-300 max-w-sm mx-auto">
              <span className="text-sm font-bold text-emerald-700 tracking-widest block mb-2">NOMOR ANTREAN ANDA</span>
              <span className="text-6xl font-black text-emerald-600 font-mono tracking-wide">{nomorAntrean}</span>
              <span className="block text-xs mt-4 text-slate-400">Silakan menuju ruang tunggu pendaftaran</span>
            </div>

            <button 
              onClick={() => { setCurrentScreen('home'); setNikInput(''); setNomorAntrean(''); }}
              className="w-full max-w-sm rounded-2xl bg-slate-800 py-4 text-lg font-bold text-white hover:bg-slate-900 transition-all shadow-md mx-auto block cursor-pointer"
            >
              SELESAI (KEMBALI KE AWAL)
            </button>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="p-4 bg-slate-200 text-center text-sm text-slate-500 border-t border-slate-300">
        &copy; 2026 Klinik Utama HNZ. All Rights Reserved.
      </footer>
    </div>
  );
}
