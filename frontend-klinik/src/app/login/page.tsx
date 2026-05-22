'use client';
import { API_URL } from '@/lib/api';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RealLoginPage() {
  const router = useRouter();
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle Theme Function
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Tab State: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form Input States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>('');
  
  // Registration Form States
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch roles from backend
  useEffect(() => {
    fetch(`${API_URL}/auth/roles-list`)
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDbRoles(data);
        }
      })
      .catch(err => console.error('Gagal memuat peran:', err));
  }, []);

  // Reset notifications on tab change
  useEffect(() => {
    setError('');
    setSuccessMsg('');
  }, [activeTab]);

  // Handle Real Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Silakan masukkan Username dan Password Anda.');
      return;
    }
    if (!role) {
      setError('Silakan pilih stasiun kerja/peran pelayanan.');
      return;
    }
    
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }

      // Save credentials in local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('menu_akses', JSON.stringify(data.user.menu_akses || []));

      setSuccessMsg('Autentikasi berhasil! Mengalihkan ke stasiun pelayanan...');
      
      // Determine redirection path based on role
      const rolePaths: Record<string, string> = {
        pendaftaran: '/pendaftaran',
        perawat: '/nurse-station',
        dokter: '/dokter',
        farmasi: '/farmasi',
        superadmin: '/superadmin'
      };
      
      const targetPath = rolePaths[role] || '/';
      setTimeout(() => {
        router.push(targetPath);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server medis.');
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNama || !regUsername || !regPassword) {
      setError('Mohon lengkapi semua data pendaftaran.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password harus memiliki panjang minimal 6 karakter.');
      return;
    }
    if (!regRole) {
      setError('Silakan pilih stasiun kerja/peran untuk pendaftaran.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: regNama,
          username: regUsername,
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mendaftarkan akun pegawai baru.');
      }

      // Format Success Message with Superadmin Pending Alert
      setSuccessMsg('Pendaftaran Berhasil! Akun Anda sedang menunggu verifikasi/persetujuan dari Superadmin HNZ sebelum dapat digunakan.');
      
      // Clear forms and switch to login tab with populated credentials
      setTimeout(() => {
        setUsername(regUsername);
        setRole(regRole);
        setActiveTab('login');
        setRegNama('');
        setRegUsername('');
        setRegPassword('');
        setRegRole('');
        setLoading(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Koneksi terputus. Gagal mendaftarkan pegawai.');
      setLoading(false);
    }
  };

  const displayRoles = dbRoles.length > 0 ? dbRoles : [
    { kode_role: 'pendaftaran', nama_role: 'Pendaftaran & Admisi' },
    { kode_role: 'perawat', nama_role: 'Perawat (Nurse Station)' },
    { kode_role: 'dokter', nama_role: 'Dokter Spesialis' },
    { kode_role: 'farmasi', nama_role: 'Farmasi & Apotek' },
    { kode_role: 'superadmin', nama_role: 'Superadmin HNZ' },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 px-4 py-12 font-sans text-slate-800 dark:text-slate-100 antialiased transition-colors duration-300">
      
      {/* 🌌 PREMIUM GLOWING MED-AMBIENT BACKLIGHT */}
      <div className="absolute top-[-30%] left-[-20%] h-[700px] w-[700px] rounded-full bg-rose-600/5 dark:bg-rose-600/10 blur-[130px] animate-pulse duration-10000" />
      <div className="absolute bottom-[-30%] right-[-20%] h-[700px] w-[700px] rounded-full bg-red-650/5 dark:bg-red-650/10 blur-[130px] animate-pulse duration-7000" />
      <div className="absolute top-[20%] left-[30%] h-[500px] w-[500px] rounded-full bg-red-500/3 dark:bg-red-500/5 blur-[120px]" />

      {/* Floating Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 shadow-md transition-all cursor-pointer active:scale-95 duration-200 text-base"
        title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl shadow-2xl dark:shadow-black/60 transition-all">
        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* ================= PANEL KIRI: VISUAL BRANDING MEDIS (5-COLS) ================= */}
          <div className="relative overflow-hidden md:col-span-5 bg-gradient-to-br from-red-700 via-red-600 to-rose-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 text-white dark:text-slate-100 transition-all duration-300">
            {/* Background pattern grid */}
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            {/* Left Top: Hospital Brand Identity */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-gradient-to-tr dark:from-red-605 dark:to-rose-605 shadow-md shadow-white/5 dark:shadow-red-500/20 ring-2 ring-white/20 dark:ring-red-500/20">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9.5m14 0V9a2 2 0 0 0-2-2h-3.5M5 10.5V9a2 2 0 0 1 2-2h3.5m7.5 3.5V5a2 2 0 0 0-2-2h-3.5M5 10.5V5a2 2 0 0 1 2-2h3.5m0 0V9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V3" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wider text-white dark:text-slate-100">KLINIK HNZ</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-red-200 dark:text-red-500">HIS Portal</p>
                </div>
              </div>
            </div>

            {/* Left Middle: Beautiful Heartbeat ECG Pulse wave animation */}
            <div className="relative z-10 my-12 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-[260px] h-20 mb-6 flex items-center justify-center">
                <svg className="w-full h-full text-red-500" viewBox="0 0 300 100" fill="none">
                  {/* Background ECG heartbeat path - lighter stroke in light mode red bg */}
                  <path d="M 0 50 L 80 50 L 90 35 L 100 65 L 110 50 L 130 50 L 140 10 L 155 90 L 170 50 L 200 50 L 210 40 L 220 50 L 300 50" 
                        stroke={theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.15)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Glowing Animated Heartbeat Path */}
                  <path d="M 0 50 L 80 50 L 90 35 L 100 65 L 110 50 L 130 50 L 140 10 L 155 90 L 170 50 L 200 50 L 210 40 L 220 50 L 300 50" 
                        stroke={theme === 'light' ? '#ffffff' : 'url(#pulse-grad)'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="600" strokeDashoffset="600"
                        className="animate-draw-ecg" />
                  <defs>
                    <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00e5ff" />
                      <stop offset="50%" stopColor="#29b6f6" />
                      <stop offset="100%" stopColor="#80deea" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h3 className="text-md font-bold text-white dark:text-slate-200">Sistem Informasi Rumah Sakit</h3>
              <p className="mt-2 text-xs leading-relaxed text-red-100 dark:text-slate-400 max-w-[260px]">
                Akses terenkripsi ke modul Rekam Medis Elektronik, E-Resep, Triase, Keuangan, dan Manajemen Klinik Utama HNZ.
              </p>
            </div>

            {/* Left Bottom: Security & HIPAA Badges */}
            <div className="relative z-10 pt-6 border-t border-red-500/20 dark:border-slate-800/60 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-red-100/90 dark:text-slate-300">
                <svg className="h-4.5 w-4.5 text-white dark:text-red-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] tracking-wide uppercase font-bold text-red-100 dark:text-slate-450">HIPAA Compliant Datacenter</span>
              </div>
              <div className="flex items-center gap-2.5 text-red-100/90 dark:text-slate-300">
                <svg className="h-4.5 w-4.5 text-white dark:text-rose-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                </svg>
                <span className="text-[10px] tracking-wide uppercase font-bold text-red-100 dark:text-slate-450">256-Bit SSL Encryption</span>
              </div>
            </div>

            {/* Custom ECG Draw CSS Animation in styled-tag */}
            <style jsx global>{`
              @keyframes draw-ecg {
                to {
                  stroke-dashoffset: 0;
                }
              }
              .animate-draw-ecg {
                animation: draw-ecg 2.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
              }
            `}</style>
          </div>

          {/* ================= PANEL KANAN: FORM SECURE PORTAL (7-COLS) ================= */}
          <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-slate-100/30 dark:bg-slate-900/20">
            
            {/* Header Form */}
            <div className="mb-8">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔐</span> Medis Secure Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gunakan ID akun terdaftar medis Anda untuk mengakses stasiun pelayanan Anda.
              </p>
            </div>

            {/* Tab Selector: Login vs Register */}
            <div className="mb-8 flex rounded-xl bg-slate-200 dark:bg-slate-950 p-1 border border-slate-300 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 rounded-lg py-3 text-center text-xs font-black tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-650/15'
                    : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sign In / Masuk
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 rounded-lg py-3 text-center text-xs font-black tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-650/15'
                    : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Register / Daftar
              </button>
            </div>

            {/* Form Content Block */}
            {activeTab === 'login' ? (
              /* TAB SIGN IN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username / ID Pegawai
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username Anda..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                      </svg>
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan password rahasia..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3.5 pr-11 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Role / Station Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                    </svg>
                    Stasiun Kerja / Peran
                  </label>
                  <select
                    value={role}
                    required
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3.5 text-xs text-slate-700 dark:text-slate-300 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300">-- Pilih Stasiun Kerja --</option>
                    {displayRoles.map((r) => (
                      <option key={r.kode_role} value={r.kode_role} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300">
                        {r.nama_role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-[11px] font-semibold text-red-400 flex items-start gap-2.5 animate-pulse">
                    <span className="text-sm mt-0.5">⚠️</span> 
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-[11px] font-semibold text-emerald-400 flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">✅</span> 
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-red-600 via-red-650 to-rose-600 py-4 text-xs font-black tracking-widest uppercase text-white shadow-xl shadow-red-600/10 hover:brightness-110 active:scale-98 disabled:brightness-50 flex items-center justify-center gap-2.5 cursor-pointer mt-6"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sedang Autentikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In Ke Portal Medis</span>
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

              </form>
            ) : (
              /* TAB REGISTER / DAFTAR FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                
                {/* Nama Lengkap Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-5m-4 0V5a2 2 0 1 1 4 0v1m-4 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
                    </svg>
                    Nama Lengkap Beserta Gelar
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: dr. Budi Santoso, Sp.A"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950"
                  />
                </div>

                {/* Username Registrasi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username Pegawai Pilihan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: budi.spesialis"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950"
                  />
                </div>

                {/* Password Registrasi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                    </svg>
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Sandi minimal 6 karakter..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 pr-11 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showRegPassword ? (
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stasiun Kerja / Peran Registrasi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-slate-505 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                    </svg>
                    Pilihan Peran Layanan
                  </label>
                  <select
                    value={regRole}
                    required
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 text-xs text-slate-700 dark:text-slate-300 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 focus:bg-white dark:focus:bg-slate-950 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300">-- Pilih Stasiun Kerja --</option>
                    {displayRoles.map((r) => (
                      <option key={r.kode_role} value={r.kode_role} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300">
                        {r.nama_role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] font-semibold text-red-400 flex items-start gap-2 animate-pulse">
                    <span className="text-sm mt-0.5">⚠️</span> 
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-[11px] font-semibold text-emerald-400 flex items-start gap-2">
                    <span className="text-sm mt-0.5">🚨</span> 
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-red-600 via-red-650 to-rose-600 py-3.5 text-xs font-black tracking-widest uppercase text-white shadow-xl shadow-red-600/10 hover:brightness-110 active:scale-98 disabled:brightness-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Mendaftarkan Pegawai...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftarkan Akun Medis</span>
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </>
                  )}
                </button>

              </form>
            )}

            {/* Link back to dev portal */}
            <div className="mt-8 text-center border-t border-slate-800/40 pt-6">
              <button
                onClick={() => router.push('/')}
                className="text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
              >
                ⚙️ Buka Portal Pengembang (Akses Demo Cepat)
              </button>
            </div>

          </div>

        </div>
      </div>
      
      {/* Footer copyright */}
      <div className="absolute bottom-4 text-center text-[10px] text-slate-500 dark:text-slate-600">
        <p>Sistem Informasi Rumah Sakit & HIS Klinik Utama HNZ &copy; 2026. Semua Hak Dilindungi.</p>
      </div>

    </div>
  );
}
