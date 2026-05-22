'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  // Tab State: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('');
  
  // Registration Form States
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<string>('');

  const [dbRoles, setDbRoles] = useState<any[]>([]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all roles from backend to populate dropdowns
  useEffect(() => {
    fetch('http://localhost:3000/auth/roles-list')
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

  // Clear states when switching tabs
  useEffect(() => {
    setError('');
    setSuccessMsg('');
  }, [activeTab]);

  // Daftar Akun Demo untuk Kemudahan Testing
  const demoAccounts = [
    { name: 'Pendaftaran / Admission', role: 'pendaftaran', demoUser: 'pendaftaran.demo', icon: '📋', path: '/pendaftaran', desc: 'Registrasi rekam medis & kelola antrean loket.' },
    { name: 'Nurse Station', role: 'perawat', demoUser: 'nurse.demo', icon: '🩺', path: '/nurse-station', desc: 'Asesmen awal pasien & triase keperawatan.' },
    { name: 'Dokter Spesialis', role: 'dokter', demoUser: 'dokter.demo', icon: '👨‍⚕️', path: '/dokter', desc: 'Pemeriksaan SOAP medis & resep elektronik.' },
    { name: 'Farmasi / Apotek', role: 'farmasi', demoUser: 'farmasi.demo', icon: '💊', path: '/farmasi', desc: 'Validasi & penyerahan obat resep pasien.' },
    { name: 'Superadmin HNZ', role: 'superadmin', demoUser: 'superadmin.demo', icon: '⚙️', path: '/superadmin', desc: 'Kelola hak akses menu, perizinan, & verifikasi login.' },
  ];

  // Handle Real Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }
    if (!role) {
      setError('Silakan pilih salah satu peran/ruangan untuk masuk.');
      return;
    }
    
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }

      // Simpan Token dan Data User ke LocalStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('menu_akses', JSON.stringify(data.user.menu_akses || []));

      setSuccessMsg('Masuk berhasil! Mengalihkan...');
      
      // Alihkan ke Dashboard sesuai peran
      const targetPath = demoAccounts.find(acc => acc.role === role)?.path || '/';
      setTimeout(() => {
        router.push(targetPath);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal.');
      setLoading(false);
    }
  };

  // Handle Real Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNama || !regUsername || !regPassword) {
      setError('Semua bidang pendaftaran wajib diisi.');
      return;
    }
    if (!regRole) {
      setError('Silakan pilih peran kerja untuk pegawai baru.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
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
        throw new Error(data.message || 'Gagal mendaftarkan pegawai.');
      }

      setSuccessMsg('Pegawai berhasil didaftarkan! Mengalihkan ke halaman Masuk...');
      
      // Auto-populate username setelah registrasi sukses dan arahkan ke login tab
      setTimeout(() => {
        setUsername(regUsername);
        setRole(regRole);
        setActiveTab('login');
        setRegNama('');
        setRegUsername('');
        setRegPassword('');
        setRegRole('');
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal.');
      setLoading(false);
    }
  };

  // Helper to resolve role icons dynamically
  const getRoleIcon = (kode: string) => {
    switch (kode) {
      case 'pendaftaran': return '📋';
      case 'perawat': return '🩺';
      case 'dokter': return '👨‍⚕️';
      case 'farmasi': return '💊';
      case 'superadmin': return '⚙️';
      default: return '👤';
    }
  };

  const displayRoles = dbRoles.length > 0 ? dbRoles : [
    { kode_role: 'pendaftaran', nama_role: 'Pendaftaran & Loket A' },
    { kode_role: 'perawat', nama_role: 'Perawat (Nurse Station)' },
    { kode_role: 'dokter', nama_role: 'Dokter Spesialis' },
    { kode_role: 'farmasi', nama_role: 'Farmasi & Apotek' },
    { kode_role: 'superadmin', nama_role: 'Superadmin Keamanan' },
  ];

  // Quick Bypass Demo Accounts (Melakukan Login Asli Secara Transparan di Belakang Layar)
  const handleQuickLogin = async (selectedRole: string, demoUser: string, path: string) => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    setRole(selectedRole as any);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: demoUser,
          password: 'demo123',
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal login cepat.');
      }

      // Simpan Sesi Sempurna
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('menu_akses', JSON.stringify(data.user.menu_akses || []));

      setSuccessMsg(`Login Bypass Berhasil sebagai ${data.user.nama_lengkap}!`);
      setTimeout(() => {
        router.push(path);
      }, 500);
    } catch (err: any) {
      setError(`Gagal memproses login cepat: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      
      {/* 🌌 LATAR BELAKANG GLOWING GRADIENT ELEKTRIK */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-red-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="absolute top-[30%] left-[40%] h-[400px] w-[400px] rounded-full bg-red-500/5 blur-[100px]" />

      <div className="z-10 w-full max-w-5xl px-4 py-8">
        
        {/* BRAND HEADER */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-lg shadow-red-500/20 mb-4 ring-4 ring-red-500/10">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-200 via-slate-100 to-rose-200 bg-clip-text text-transparent">
            KLINIK UTAMA HNZ
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-md mx-auto">
            Hospital Information System (HIS). Masuk ke portal kerja berdasarkan stasiun pelayanan medis Anda dengan login riil & log aktivitas terintegrasi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-stretch">
          
          {/* ================= PANEL KIRI: PILIHAN CEPAT PERAN (ROLE GRID) ================= */}
          <div className="md:col-span-6 flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
            <div>
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-1">
                <span>⚡</span> Akses Cepat Stasiun Kerja
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Klik langsung pada stasiun kerja di bawah ini untuk masuk menggunakan akun demo instan (sesi login riil otomatis terbuat di database):
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => handleQuickLogin(acc.role, acc.demoUser, acc.path)}
                    disabled={loading}
                    className="group relative flex flex-col items-start rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left transition-all hover:-translate-y-1 hover:border-red-500/40 hover:bg-slate-950 hover:shadow-lg hover:shadow-red-500/5 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl transition-all group-hover:scale-110 group-hover:bg-red-500/10 group-hover:border-red-500/20">
                      {acc.icon}
                    </div>
                    <h3 className="mt-3 font-bold text-slate-200 group-hover:text-red-300 text-sm transition-all">
                      {acc.name}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 group-hover:text-slate-400 transition-all">
                      {acc.desc}
                    </p>
                    <span className="absolute bottom-3 right-4 text-xs opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 text-red-400">
                      Masuk →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* MESIN ANTRIAN MANDIRI MANDATORY */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-300">🖥️ Layar Kiosk Mandiri Antrean</h4>
                <p className="text-[11px] text-slate-500">Layar self-registrasi antrean pasien lobi utama.</p>
              </div>
              <button
                onClick={() => router.push('/kiosk')}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/10 active:scale-95 cursor-pointer"
              >
                🖥️ Buka Layar Kiosk
              </button>
            </div>
          </div>

          {/* ================= PANEL KANAN: FORM LOGIN & REGISTRASI TAB ================= */}
          <div className="md:col-span-6 flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
            
            {/* TAB SELECTOR HEADER */}
            <div className="mb-6 flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${activeTab === 'login' ? 'bg-gradient-to-r from-red-650 to-rose-650 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🔐 Masuk Sistem
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${activeTab === 'register' ? 'bg-gradient-to-r from-red-650 to-rose-650 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ✍️ Daftar Pegawai Baru
              </button>
            </div>

            {/* TAB CONTENT: LOGIN */}
            {activeTab === 'login' && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-lg font-bold text-slate-200 mb-1">🔐 Portal Keamanan HIS</h2>
                <p className="text-xs text-slate-500 mb-6">Silakan ketik akun medis Anda atau pilih peran yang sesuai:</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Username / ID Pegawai</label>
                    <input
                      type="text"
                      placeholder="Contoh: admin.hnz"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Password Medis</label>
                    <input
                      type="password"
                      placeholder="Masukkan kata sandi..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Peran / Ruang Tugas</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    >
                      <option value="">-- Pilih Stasiun Kerja --</option>
                      {displayRoles.map((r) => (
                        <option key={r.kode_role} value={r.kode_role}>
                          {getRoleIcon(r.kode_role)} {r.nama_role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[11px] font-semibold text-red-400 flex items-center gap-1.5 animate-pulse">
                      <span>⚠️</span> {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span>✅</span> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs font-bold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-red-500/10 active:scale-98 disabled:brightness-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>MEMPROSES MASUK...</span>
                      </>
                    ) : (
                      <span>MASUK KE SISTEM HIS →</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: REGISTER */}
            {activeTab === 'register' && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-lg font-bold text-slate-200 mb-1">✍️ Registrasi Keanggotaan Medis</h2>
                <p className="text-xs text-slate-500 mb-6">Daftarkan akun pegawai baru untuk akses terenkripsi Klinik HNZ:</p>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap Beserta Gelar..."
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Username Pilihan</label>
                    <input
                      type="text"
                      placeholder="Contoh: budi.perawat"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Password Baru</label>
                    <input
                      type="password"
                      placeholder="Sandi minimal 6 karakter..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Peran / Stasiun Pelayanan</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    >
                      <option value="">-- Pilih Stasiun Kerja --</option>
                      {displayRoles.map((r) => (
                        <option key={r.kode_role} value={r.kode_role}>
                          {getRoleIcon(r.kode_role)} {r.nama_role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[11px] font-semibold text-red-400 flex items-center gap-1.5 animate-pulse">
                      <span>⚠️</span> {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span>✅</span> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs font-bold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-red-500/10 active:scale-98 disabled:brightness-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>MEMPROSES PENDAFTARAN...</span>
                      </>
                    ) : (
                      <span>DAFTARKAN PEGAWAI BARU →</span>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

        {/* SYSTEM FOOTER INFO */}
        <div className="mt-16 text-center text-[10px] text-slate-600">
          <p>Sistem Informasi Rumah Sakit & HIS Klinik Utama HNZ &copy; 2026. Versi Pengembangan 2.0-Sesi Riil.</p>
        </div>
      </div>
    </div>
  );
}