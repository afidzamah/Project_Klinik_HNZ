'use client';
import { API_URL } from '@/lib/api';

import React, { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

interface MasterRole {
  id_role: string;
  kode_role: string;
  nama_role: string;
  menu_akses: string[];
}

interface Pegawai {
  id_pegawai: string;
  nama_lengkap: string;
  username: string;
  role: string;
  status_aktif: boolean;
  status_verifikasi: string;
  created_at: string;
  master_role?: {
    nama_role: string;
  };
}

export default function SuperadminPage() {
  const [activeTab, setActiveTab] = useState<'hak-akses' | 'verifikasi' | 'pegawai'>('hak-akses');
  
  // Data States
  const [roles, setRoles] = useState<MasterRole[]>([]);
  const [pendingPegawai, setPendingPegawai] = useState<Pegawai[]>([]);
  const [activePegawai, setActivePegawai] = useState<Pegawai[]>([]);
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Available Paths list in HIS
  const availablePaths = [
    { path: '/kiosk', label: '🖥️ Kiosk Mandiri', desc: 'Registrasi mandiri & pencetakan tiket antrean lobi utama.' },
    { path: '/pendaftaran', label: '📋 Pendaftaran', desc: 'Penerimaan rekam medis pasien & pengaturan antrean loket.' },
    { path: '/pendaftaran/laporan', label: '📈 Laporan Pendaftaran', desc: 'Analisis data demografis, statistik kunjungan, & laporan log rekam jejak pasien.' },
    { path: '/nurse-station', label: '🩺 Nurse Station', desc: 'Asesmen keperawatan, pemeriksaan fisik, & triase medis.' },
    { path: '/dokter', label: '👨‍⚕️ Pemeriksaan Dokter', desc: 'Diagnosis SOAP dokter spesialis & e-prescribing resep.' },
    { path: '/farmasi', label: '💊 Farmasi & Kasir', desc: 'Dispensing obat resep farmasi & penagihan pembayaran.' },
    { path: '/monitoring', label: '🖥️ Pengawasan Sesi', desc: 'Live monitoring log login-logout & audit transaksi medis.' },
    { path: '/superadmin', label: '⚙️ Panel Superadmin', desc: 'Konfigurasi hak akses menu & verifikasi aktivasi akun.' },
    { path: '/superadmin/obat', label: '💊 Master Obat & Safety Check', desc: 'Kelola Zat Aktif, Produk Dagang, Stok Inventori, Harga, & Safety Alert Interaksi.' },
  ];


  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch Roles Matrix
      const resRoles = await fetch(`${API_URL}/auth/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resRoles.ok) throw new Error('Gagal mengambil data matriks peran.');
      const dataRoles = await resRoles.json();
      setRoles(dataRoles);

      // Fetch Pending Accounts
      const resPending = await fetch(`${API_URL}/auth/pegawai/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resPending.ok) throw new Error('Gagal mengambil antrean verifikasi.');
      const dataPending = await resPending.json();
      setPendingPegawai(dataPending);

      // Fetch Active Accounts
      const resActive = await fetch(`${API_URL}/auth/pegawai/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resActive.ok) throw new Error('Gagal mengambil kelola pegawai.');
      const dataActive = await resActive.json();
      setActivePegawai(dataActive);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Display toast / notification helper
  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setError('');
    } else {
      setError(msg);
      setSuccessMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setError('');
    }, 4000);
  };

  // Tab 1: Update Role Page Permissions
  const handleTogglePermission = (roleId: string, path: string) => {
    setRoles(prevRoles => prevRoles.map(r => {
      if (r.id_role === roleId) {
        const alreadyHas = r.menu_akses.includes(path);
        const newAkses = alreadyHas
          ? r.menu_akses.filter(p => p !== path)
          : [...r.menu_akses, path];
        return { ...r, menu_akses: newAkses };
      }
      return r;
    }));
  };

  const handleSavePermissions = async (role: MasterRole) => {
    setActionLoading(`save-${role.id_role}`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/roles/${role.id_role}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ menu_akses: role.menu_akses }),
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui izin peran di database.');
      }

      showNotification(`Hak akses peran "${role.nama_role}" berhasil diperbarui!`, 'success');
      
      // If current user modified their own role, update local menu_akses as well to trigger live layout guard updates
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        if (parsed.role === role.kode_role) {
          localStorage.setItem('menu_akses', JSON.stringify(role.menu_akses));
        }
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Tab 2: Approve / Reject Registration Request
  const handleVerifyAccount = async (id: string, status: 'DISETUJUI' | 'DITOLAK') => {
    setActionLoading(`verify-${id}`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/pegawai/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_pegawai: id, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal mengubah status verifikasi pegawai.');
      }

      showNotification(
        `Registrasi pegawai berhasil ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}!`,
        'success'
      );
      
      // Refresh Lists
      fetchData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Tab 3: Suspend / Reactivate Verified Employee
  const handleTogglePegawaiStatus = async (id: string, currentStatus: boolean, fullName: string) => {
    setActionLoading(`toggle-${id}`);
    const nextStatus = !currentStatus;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/pegawai/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_pegawai: id, status_aktif: nextStatus }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengubah status keaktifan pegawai.');
      }

      showNotification(
        `Akun pegawai "${fullName}" berhasil ${nextStatus ? 'diaktifkan kembali' : 'ditangguhkan (suspend)'}!`,
        'success'
      );
      
      // Refresh Lists
      fetchData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <MasterLayout>
      <div className="space-y-6">
        
        {/* ================= HEADER PANEL DENGAN BRANDING CRIMSON ================= */}
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/40 p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
          {/* Subtle top ambient glowing light */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/60 text-[10px] font-extrabold tracking-wide text-red-700 mb-3 shadow-2xs">
              <span>⚙️</span> SISTEM KEAMANAN HIS PREMIUM
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">Pusat Kendali Keamanan HNZ</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Portal wewenang Superadmin untuk mengatur pembatasan modul kerja pegawai, verifikasi aktivasi akun staf medis baru, dan audit penangguhan akun klinis secara real-time.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={() => window.location.href = '/superadmin/obat'}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 text-xs font-bold text-red-700 px-5 py-3 transition-all shadow-xs hover:shadow-sm cursor-pointer duration-200"
            >
              💊 Master Obat & Safety
            </button>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 px-5 py-3 transition-all shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 shrink-0 duration-200"
            >
              🔄 Sinkronkan Data
            </button>
          </div>

        </div>

        {/* ================= TOAST NOTIFICATIONS CARD ================= */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2 animate-bounce">
            <span>⚠️</span> {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-pulse">
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* ================= CONTROLLER TABS SELECTOR ================= */}
        <div className="flex bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 max-w-xl shadow-inner animate-fade-in">
          <button
            onClick={() => setActiveTab('hak-akses')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer duration-200 ${
              activeTab === 'hak-akses'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 transform scale-[1.01]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            ⚖️ Matriks Peran
          </button>
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all relative cursor-pointer duration-200 ${
              activeTab === 'verifikasi'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 transform scale-[1.01]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            ⏳ Verifikasi Akun
            {pendingPegawai.length > 0 && (
              <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black text-white duration-200 ${
                activeTab === 'verifikasi' 
                  ? 'bg-slate-900 border-red-500' 
                  : 'bg-red-500 border-slate-150 animate-pulse'
              }`}>
                {pendingPegawai.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pegawai')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer duration-200 ${
              activeTab === 'pegawai'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 transform scale-[1.01]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            👥 Kelola Pegawai
          </button>
        </div>

        {/* ================= LOADING SCREEN FOR MAIN DATA ================= */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-red-600 mb-4" />
            <p className="text-xs font-bold tracking-wider animate-pulse text-slate-400">MEMUAT KONFIGURASI KEAMANAN...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            
            {/* ================= TAB 1: MATRIKS HAK AKSES PERAN ================= */}
            {activeTab === 'hak-akses' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {roles.map(r => (
                    <div key={r.id_role} className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 to-rose-600/80" />
                      <div>
                        {/* Header Peran */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                          <div>
                            <span className="text-[9px] font-black tracking-wider text-red-600 uppercase bg-red-50/80 px-2 py-0.5 rounded-md border border-red-100">
                              KODE PERAN: @{r.kode_role}
                            </span>
                            <h3 className="text-base font-black text-slate-900 mt-2">{r.nama_role}</h3>
                          </div>
                          <span className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-base shadow-xs shrink-0 select-none">
                            {r.kode_role === 'superadmin' ? '👑' : '👤'}
                          </span>
                        </div>

                        {/* Checklist Paths */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Akses Halaman yang Diizinkan:
                          </label>
                          {availablePaths.map(p => {
                            const isAllowed = r.menu_akses.includes(p.path);
                            return (
                              <div 
                                key={p.path} 
                                onClick={() => handleTogglePermission(r.id_role, p.path)}
                                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none hover:-translate-y-0.5 hover:shadow-2xs duration-200 ${
                                  isAllowed 
                                    ? 'bg-gradient-to-br from-red-50/40 to-rose-50/20 border-red-200 shadow-2xs' 
                                    : 'bg-slate-50/30 border-slate-200/60 opacity-65 hover:opacity-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  onChange={() => {}} // Controlled by outer div click
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-red-600 focus:ring-red-500 mt-0.5 pointer-events-none cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-extrabold text-slate-800 block leading-tight">{p.label}</span>
                                  <span className="text-[10px] text-slate-500 leading-normal block mt-1">{p.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Aksi Simpan Peran */}
                      <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center">
                        <div className="text-[10px] text-slate-400">
                          Total Hak Akses: <strong className="text-slate-800 font-bold">{r.menu_akses.length}</strong> Halaman
                        </div>
                        <button
                          onClick={() => handleSavePermissions(r)}
                          disabled={actionLoading === `save-${r.id_role}`}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:brightness-50 shadow-md shadow-red-500/10 cursor-pointer"
                        >
                          {actionLoading === `save-${r.id_role}` ? (
                            <>
                              <svg className="h-3 w-3 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>MENYIMPAN...</span>
                            </>
                          ) : (
                            <span>💾 Simpan Hak Akses</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 2: ANTREAN VERIFIKASI AKUN ================= */}
            {activeTab === 'verifikasi' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">⏳ Menunggu Verifikasi Akun</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pendaftaran akun pegawai baru yang membutuhkan wewenang aktivasi dari Superadmin sebelum diizinkan masuk.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-extrabold text-slate-700">
                    {pendingPegawai.length} Pegawai PENDING
                  </span>
                </div>

                {pendingPegawai.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-xs font-bold">Semua antrean bersih! Tidak ada pegawai menunggu verifikasi.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border-spacing-0">
                      <thead>
                        <tr className="bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 border-b border-slate-700">
                          <th className="py-4 px-6 rounded-l-2xl">Nama Pegawai</th>
                          <th className="py-4 px-6">Username / ID</th>
                          <th className="py-4 px-6">Peran Kerja</th>
                          <th className="py-4 px-6">Tanggal Registrasi</th>
                          <th className="py-4 px-6 text-right rounded-r-2xl">Verifikasi Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPegawai.map(p => (
                          <tr key={p.id_pegawai} className="border-b border-slate-100 text-xs text-slate-700 hover:bg-slate-50/30 transition-all">
                            <td className="py-4 px-6">
                              <span className="font-extrabold text-slate-900 block">{p.nama_lengkap}</span>
                              <span className="text-[10px] text-slate-400">ID: {p.id_pegawai.substring(0, 8)}...</span>
                            </td>
                            <td className="py-4 px-6 font-semibold">@{p.username}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-700 uppercase">
                                {p.role}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {new Date(p.created_at).toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                              
                              {/* Setujui */}
                              <button
                                onClick={() => handleVerifyAccount(p.id_pegawai, 'DISETUJUI')}
                                disabled={actionLoading !== null}
                                className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-500/10"
                              >
                                {actionLoading === `verify-${p.id_pegawai}` ? '...' : '✅ Setujui'}
                              </button>

                              {/* Tolak */}
                              <button
                                onClick={() => handleVerifyAccount(p.id_pegawai, 'DITOLAK')}
                                disabled={actionLoading !== null}
                                className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shadow-red-500/10"
                              >
                                {actionLoading === `verify-${p.id_pegawai}` ? '...' : '❌ Tolak'}
                              </button>

                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: KELOLA PEGAWAI AKTIF ================= */}
            {activeTab === 'pegawai' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">👥 Kelola Anggota Pegawai Aktif</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Daftar staf medis Klinik Utama HNZ yang telah diverifikasi dan memiliki hak masuk aktif. Tangguhkan (suspend) untuk mencabut akses sementara.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-extrabold text-slate-700">
                    {activePegawai.length} Pegawai Aktif
                  </span>
                </div>

                {activePegawai.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <span className="text-3xl block mb-2">👥</span>
                    <p className="text-xs font-bold">Belum ada pegawai aktif terdaftar di database.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <th className="py-4 px-6">Nama Pegawai</th>
                          <th className="py-4 px-6">Username / ID</th>
                          <th className="py-4 px-6">Peran Stasiun Kerja</th>
                          <th className="py-4 px-6">Status Keaktifan</th>
                          <th className="py-4 px-6 text-right">Kelola Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePegawai.map(p => (
                          <tr key={p.id_pegawai} className="border-b border-slate-100 text-xs text-slate-700 hover:bg-slate-50/30 transition-all">
                            <td className="py-4 px-6">
                              <span className="font-extrabold text-slate-900 block">{p.nama_lengkap}</span>
                              <span className="text-[10px] text-slate-400">ID: {p.id_pegawai.substring(0, 8)}...</span>
                            </td>
                            <td className="py-4 px-6 font-semibold">@{p.username}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-150 border border-slate-200 text-[10px] font-black text-slate-700 uppercase">
                                {p.role}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {p.status_aktif ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-extrabold text-emerald-700 tracking-wider uppercase shadow-3xs select-none">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-xs"></span> AKTIF MASUK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-extrabold text-slate-500 tracking-wider uppercase select-none">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span> DITANGGUHKAN
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              
                              {/* Suspend / Unsuspend */}
                              <button
                                onClick={() => handleTogglePegawaiStatus(p.id_pegawai, p.status_aktif, p.nama_lengkap)}
                                disabled={actionLoading !== null}
                                className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-extrabold text-xs px-4 py-2.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs ${
                                  p.status_aktif
                                    ? 'bg-slate-100 hover:bg-red-50 border border-slate-205 hover:border-red-200 text-slate-700 hover:text-red-600'
                                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white shadow-sm shadow-red-500/10'
                                }`}
                              >
                                {actionLoading === `toggle-${p.id_pegawai}` ? (
                                  <span className="inline-flex items-center gap-1">
                                    <svg className="h-3 w-3 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>MEMPROSES...</span>
                                  </span>
                                ) : p.status_aktif ? (
                                  <span>⛔ Tangguhkan Akses</span>
                                ) : (
                                  <span>🔑 Pulihkan Akses</span>
                                )}
                              </button>

                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </MasterLayout>
  );
}
