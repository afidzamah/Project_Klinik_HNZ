'use client';
import { API_URL } from '@/lib/api';

import React, { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

export default function MonitoringLoginDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('SEMUA');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(10);

  // Fetch all sessions and logs
  const fetchAllLogs = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token autentikasi tidak ditemukan. Harap masuk kembali.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/all-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Gagal menarik data log pengawasan.');
      }
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server terputus.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllLogs();
  }, []);

  // Auto-refresh countdown loop
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAllLogs();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Reset countdown on manual refresh
  const handleManualRefresh = () => {
    setLoading(true);
    fetchAllLogs();
    setCountdown(10);
  };

  // Filter sessions
  const filteredSessions = sessions.filter((sess) => {
    const matchesSearch = 
      sess.pegawai?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.pegawai?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.ip_address?.includes(searchQuery);

    const matchesRole = 
      selectedRole === 'SEMUA' || 
      sess.pegawai?.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const activeOnlineCount = sessions.filter(s => !s.waktu_logout).length;
  
  const todayLoginCount = sessions.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.waktu_login).toDateString() === today;
  }).length;

  const totalActionsCount = sessions.reduce((acc, s) => acc + (s.log_aktivitas?.length || 0), 0);

  // Helper to format browser info
  const formatBrowser = (userAgent: string) => {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Apple Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    return 'Web Browser';
  };

  // Toggle row expansion
  const toggleRow = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  return (
    <MasterLayout>
      <div className="space-y-6">
        
        {/* ================= HEADER SEKTOR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>🖥️</span> Pusat Pengawasan Sesi & Audit Log Pegawai
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Memantau status login, logout, perangkat, alamat IP, serta linimasa aktivitas mendalam pegawai Klinik Utama HNZ secara real-time.
            </p>
          </div>
          
          {/* Refresh Control */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer border ${autoRefresh ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              Auto Refresh: {autoRefresh ? `Aktif (${countdown}s)` : 'Nonaktif'}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ================= STATS WIDGET CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pegawai Online */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl text-emerald-600 shadow-inner">
              🟢
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pegawai Online Aktif</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">{activeOnlineCount} Akun</span>
              <span className="text-[10px] text-slate-500">Sesi aktif tanpa catatan logout.</span>
            </div>
          </div>

          {/* Sesi Login Hari Ini */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl text-red-650 shadow-inner">
              🔑
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sesi Login Hari Ini</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">{todayLoginCount} Kali</span>
              <span className="text-[10px] text-slate-500">Total aktivitas login hari ini.</span>
            </div>
          </div>

          {/* Total Tindakan Audit */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl text-indigo-650 shadow-inner">
              🛡️
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transaksi Tindakan Logged</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalActionsCount} Tindakan</span>
              <span className="text-[10px] text-slate-500">Tindakan mutasi terekam aman.</span>
            </div>
          </div>

        </div>

        {/* ================= FILTER PANEL ================= */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari pegawai berdasarkan nama, username, atau IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 focus:bg-white"
            />
          </div>

          {/* Role Filter Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Filter Stasiun:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all focus:border-red-500/50 focus:bg-white"
            >
              <option value="SEMUA">🌐 Semua Stasiun Kerja</option>
              <option value="pendaftaran">📋 Pendaftaran</option>
              <option value="nurse-station">🩺 Nurse Station</option>
              <option value="dokter">👨‍⚕️ Dokter Spesialis</option>
              <option value="farmasi">💊 Apotek & Kasir</option>
            </select>
          </div>
        </div>

        {/* ================= UTAMA MONITORING TABLE ================= */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          
          {error && (
            <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-650 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {loading && sessions.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-xs">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-red-650 mb-3" />
              Menghubungkan ke pusat audit log...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              Tidak ada sesi log pengawasan yang cocok dengan kriteria pencarian Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="p-4 w-12 text-center">Status</th>
                    <th className="p-4">Pegawai Medis</th>
                    <th className="p-4">Waktu Login</th>
                    <th className="p-4">Waktu Logout</th>
                    <th className="p-4">Detail Perangkat & IP</th>
                    <th className="p-4 w-32 text-center">Aktivitas Sesi</th>
                    <th className="p-4 w-28 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredSessions.map((sess) => {
                    const isOnline = !sess.waktu_logout;
                    const isExpanded = expandedSession === sess.id_sesi;

                    return (
                      <React.Fragment key={sess.id_sesi}>
                        
                        {/* Session Row */}
                        <tr className={`hover:bg-slate-50/70 transition-all ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                          
                          {/* Online Indicator Badge */}
                          <td className="p-4 text-center">
                            <span className={`inline-block h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          </td>

                          {/* Profile & Role */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center font-bold text-red-650 text-xs shadow-inner">
                                {sess.pegawai?.nama_lengkap ? sess.pegawai.nama_lengkap.substring(0, 2).toUpperCase() : 'PE'}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-800 text-sm block">
                                  {sess.pegawai?.nama_lengkap || 'Pegawai Tidak Dikenal'}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  @{sess.pegawai?.username || 'unregistered'} &bull; <strong className="text-red-600 uppercase font-black tracking-wide text-[9px]">{sess.pegawai?.role}</strong>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Login Time */}
                          <td className="p-4 text-slate-700 font-medium">
                            <div>{new Date(sess.waktu_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{new Date(sess.waktu_login).toLocaleTimeString('id-ID')}</div>
                          </td>

                          {/* Logout Time */}
                          <td className="p-4 text-slate-700 font-medium">
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" /> ONLINE
                              </span>
                            ) : (
                              <>
                                <div>{new Date(sess.waktu_logout).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{new Date(sess.waktu_logout).toLocaleTimeString('id-ID')}</div>
                              </>
                            )}
                          </td>

                          {/* Hardware / IP */}
                          <td className="p-4 text-slate-600">
                            <span className="font-semibold block">{sess.ip_address || '127.0.0.1'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{formatBrowser(sess.user_agent)}</span>
                          </td>

                          {/* Actions Count */}
                          <td className="p-4 text-center">
                            <span className={`inline-block rounded-xl px-3 py-1 font-extrabold ${sess.log_aktivitas?.length > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                              {sess.log_aktivitas?.length || 0} Tindakan
                            </span>
                          </td>

                          {/* Expand Trigger Button */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleRow(sess.id_sesi)}
                              className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all cursor-pointer active:scale-95 ${isExpanded ? 'bg-red-650 hover:bg-red-700 border-red-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                            >
                              {isExpanded ? 'Tutup ▲' : 'Detail ▼'}
                            </button>
                          </td>

                        </tr>

                        {/* Nested Expanded Activity Timeline Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="bg-slate-50/50 p-6 border-b border-slate-200">
                              <div className="max-w-4xl mx-auto">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                                  <span>📜</span> Riwayat Audit Tindakan Sesi (Kronologis)
                                </h4>

                                {sess.log_aktivitas?.length === 0 ? (
                                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400 italic">
                                    Sesi login terdaftar dengan aman, namun pegawai belum melakukan tindakan mutasi database.
                                  </div>
                                ) : (
                                  <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-slate-200">
                                    {sess.log_aktivitas.map((log: any) => (
                                      <div key={log.id_log} className="relative pl-10">
                                        
                                        {/* Activity Node Dot */}
                                        <div className="absolute left-2.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-4 ring-white shadow-sm" />

                                        {/* Activity Content Box */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                                              {log.deskripsi}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400 self-start sm:self-center">
                                              {new Date(log.waktu_aksi).toLocaleTimeString('id-ID')} - {new Date(log.waktu_aksi).toLocaleDateString('id-ID')}
                                            </span>
                                          </div>
                                          <div className="mt-2 inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-red-500 border border-slate-200">
                                            {log.endpoint}
                                          </div>
                                        </div>

                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}

                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
            <span>Menampilkan hingga 50 sesi login terakhir &bull; Klinik Utama HNZ</span>
            <span>Real-time Audit Log System v2.0</span>
          </div>

        </div>

      </div>
    </MasterLayout>
  );
}
