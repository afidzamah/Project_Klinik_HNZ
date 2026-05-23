'use client';
import { API_URL } from '@/lib/api';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

const sidebarItems = [
  { path: '/kiosk', icon: '🖥️', label: 'Kiosk Mandiri' },
  { path: '/pendaftaran', icon: '📋', label: 'Pendaftaran' },
  { path: '/pendaftaran/laporan', icon: '📈', label: 'Laporan Pendaftaran' },
  { path: '/jadwal-dokter', icon: '📅', label: 'Jadwal Dokter' },
  { path: '/pengaturan', icon: '⚙️', label: 'Setting Fixed Data' },
  { path: '/tarif', icon: '💰', label: 'Input Tarif Tindakan' },
  { path: '/nurse-station', icon: '🩺', label: 'Nurse Station' },
  { path: '/dokter', icon: '👨‍⚕️', label: 'Pemeriksaan Dokter' },
  { path: '/farmasi', icon: '💊', label: 'Apotek & Farmasi' },
  { path: '/kasir', icon: '💵', label: 'Kasir & Billing Pasien' },
  { path: '/monitoring', icon: '🖥️', label: 'Pengawasan Sesi' },
  { path: '/superadmin', icon: '⚙️', label: 'Panel Superadmin' },
];

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [menuAkses, setMenuAkses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sesi Monitor state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  // Sidebar Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 7 Presets Clinical Theme Engine
  const themesList = [
    { id: 'warm-white', label: 'Warm White', color: '#F8F5F0', icon: '☀️', isDark: false },
    { id: 'dark-slate', label: 'Dark Slate', color: '#4A5568', icon: '🌙', isDark: true },
    { id: 'pale-fern', label: 'Pale Fern', color: '#C4DDD0', icon: '🌿', isDark: false },
    { id: 'mint-mist', label: 'Mint Mist', color: '#B8EDF0', icon: '🍃', isDark: false },
    { id: 'lilac-soft', label: 'Lilac Soft', color: '#B49ED8', icon: '🪻', isDark: false },
    { id: 'admin-blue', label: 'Admin Blue', color: '#2563A8', icon: '💼', isDark: false },
    { id: 'blush-cloud', label: 'Blush Cloud', color: '#FFE4EF', icon: '🌸', isDark: false },
    { id: 'pink-soft', label: 'Pink Soft', color: '#F9A8D4', icon: '💗', isDark: false },
    { id: 'sunny-accent', label: 'Sunny Accent', color: '#FBBF24', icon: '🌻', isDark: false },
    { id: 'blood-red', label: 'Blood Red', color: '#981818', icon: '🍒', isDark: false },
    { id: 'terracotta', label: 'Terracotta', color: '#C05A30', icon: '🏺', isDark: false },
    { id: 'cozy-lavender', label: 'Cozy Lavender', color: '#8B6BBE', icon: '💜', isDark: false },
    { id: 'deep-bark', label: 'Deep Bark', color: '#5A9A72', icon: '🌲', isDark: true },
  ];

  const [activeTheme, setActiveTheme] = useState<string>('warm-white');
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

  // Load theme preset & sidebar state from localStorage after mount
  useEffect(() => {
    const savedPreset = localStorage.getItem('hnz_theme_preset') || 'warm-white';
    applyThemePreset(savedPreset);

    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  // Authenticate user and load profile
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('user');
    const localMenuAkses = localStorage.getItem('menu_akses');

    if (!localToken || !localUser) {
      router.push('/');
      return;
    }

    setToken(localToken);
    const parsedUser = JSON.parse(localUser);
    setUser(parsedUser);

    let currentMenu: string[] = [];
    if (localMenuAkses) {
      currentMenu = JSON.parse(localMenuAkses);
      setMenuAkses(currentMenu);
      
      // Preliminary local route guard check to prevent flickering
      if (currentMenu.length > 0 && !currentMenu.includes(pathname)) {
        router.push(currentMenu[0]);
        return;
      }
    }

    // Verify token with backend
    fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localToken}`
      }
    })
    .then(async (res) => {
      if (!res.ok) {
        // Token invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('menu_akses');
        router.push('/');
      } else {
        const data = await res.json();
        setUser(data.user);
        const fetchedMenu = data.user.master_role?.menu_akses || [];
        setMenuAkses(fetchedMenu);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('menu_akses', JSON.stringify(fetchedMenu));
        
        // Enforce live route guard
        if (fetchedMenu.length > 0 && !fetchedMenu.includes(pathname)) {
          router.push(fetchedMenu[0]);
        } else if (fetchedMenu.length === 0) {
          // No menu access at all, sign out
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('menu_akses');
          router.push('/');
        } else {
          setLoading(false);
        }
      }
    })
    .catch(() => {
      // In case of backend connection error, fallback to local cache
      if (currentMenu.length > 0 && !currentMenu.includes(pathname)) {
        router.push(currentMenu[0]);
      } else {
        setLoading(false);
      }
    });
  }, [router, pathname]);

  // Global fetch override to inject Bearer token automatically for all clinical pages
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      const localToken = localStorage.getItem('token');
      if (localToken) {
        const urlStr = typeof input === 'string' ? input : (input as any).url || '';
        const isBackendCall = urlStr.includes('localhost:3000') || (API_URL && urlStr.includes(API_URL));
        if (isBackendCall) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${localToken}`);
          }
          init.headers = headers;
        }
      }
      return originalFetch.call(this, input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Fetch session and activity logs
  const fetchActivityLogs = async () => {
    if (!token) return;
    setFetchingLogs(true);
    try {
      const res = await fetch(`${API_URL}/auth/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionHistory(data);
      }
    } catch (err) {
      console.error('Gagal mengambil logs:', err);
    } finally {
      setFetchingLogs(false);
    }
  };

  // Trigger fetch when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchActivityLogs();
    }
  }, [isModalOpen]);

  // Handle logout
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.error('Logout backend error:', err);
      }
    }
    
    // Clear credentials
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'HZ';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Show gorgeous loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-100">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-500/20 border-t-red-600" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">🏥</div>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400 tracking-widest animate-pulse">MENGECEK SESI AMAN...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-800 antialiased">

      {/* ======================== HEADER CORE ======================== */}
      <header className="bg-white border-b border-slate-200 premium-border-b sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* SISI KIRI: Hamburger Toggle & Identitas Klinik */}
          <div className="flex items-center space-x-3 select-none">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer"
              title="Menu Navigasi"
            >
              ☰
            </button>

            {/* Logo Klinik - Selalu di paling kiri pada desktop */}
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
              <Image 
                src="/logo-hnz.png" 
                alt="Logo Klinik Utama HNZ" 
                width={48} 
                height={48} 
                className="object-contain w-full h-full drop-shadow-sm" 
                priority 
              />
            </div>
            <div className="flex flex-col justify-center mr-2">
              <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">HNZ</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 mt-0.5">Klinik Utama</span>
            </div>

            {/* Collapse Toggle Button for Desktop Sidebar - Diletakkan secara profesional setelah brand */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 duration-200 ml-1.5"
              title={isSidebarCollapsed ? "Perluas Sidebar" : "Lipat Sidebar"}
            >
              {isSidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>

          {/* SISI TENGAH: Kosong (Spacious, Modern Aesthetic) */}
          <div className="hidden lg:block font-bold text-xs uppercase tracking-widest text-slate-400">
            Sistem Informasi Klinik Utama HNZ
          </div>

          {/* SISI KANAN: Status Petugas & Riwayat Sesi */}
          <div className="flex items-center space-x-3">
            
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
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-2.5 mb-2">Preset Tema Klinik</span>
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
                                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
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

            {/* Monitor Sesi Trigger (Premium Audit Icon) */}
            <button
              onClick={() => setIsModalOpen(true)}
              title="Riwayat Aktivitas Sesi"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 shadow-sm transition-all cursor-pointer active:scale-95 select-none"
            >
              📜
            </button>

            {/* Nama & Role Pegawai */}
            <div className="text-right hidden sm:block">
              <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                {user?.nama_lengkap || 'Pegawai HNZ'}
              </span>
              <span className="text-[9px] text-red-600 font-bold uppercase tracking-wider flex items-center justify-end gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> {user?.role || 'Admin'}
              </span>
            </div>

            {/* Avatar Inisial */}
            <div className="w-10 h-10 rounded-full bg-red-600 text-white border border-red-700 flex items-center justify-center font-bold text-sm shadow-md select-none shrink-0">
              {getInitials(user?.nama_lengkap)}
            </div>

            {/* Tombol Keluar (Logout) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-xs font-bold text-slate-600 hover:text-red-600 px-4 py-2.5 transition-all hover:shadow-md cursor-pointer shadow-sm active:scale-95 duration-200"
            >
              🚪 Keluar
            </button>
          </div>

        </div>
      </header>

      {/* ======================== BODY CONTAINER WITH COLLAPSIBLE SIDEBAR ======================== */}
      <div className="flex flex-1 relative min-h-0">
        
        {/* ======================== DESKTOP SIDEBAR ======================== */}
        <aside 
          className={`hidden lg:flex flex-col border-r border-slate-200/50 bg-white sticky top-16 h-[calc(100vh-64px)] overflow-y-auto shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="flex-1 py-6 px-3 space-y-1.5">
            {sidebarItems.map((item) => {
              // Only render if permitted in menuAkses
              if (!menuAkses.includes(item.path)) return null;
              
              const isActive = pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group relative flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-250 ${
                    isActive 
                      ? 'bg-red-50 text-red-600 font-bold border-l-4 border-red-600 pl-3 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 pl-4 hover:translate-x-1'
                  }`}
                >
                  {/* Icon */}
                  <span className="text-lg shrink-0 w-6 text-center transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                  
                  {/* Label */}
                  <span 
                    className={`ml-3 transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis ${
                      isSidebarCollapsed ? 'w-0 opacity-0 invisible' : 'w-auto opacity-100 visible'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Premium CSS-based Floating Tooltip when collapsed */}
                  {isSidebarCollapsed && (
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-2xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
                      {item.label}
                      {/* Tooltip Arrow */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-950/95" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Footer Sidebar (User Info / Status) */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            {!isSidebarCollapsed ? (
              <div className="bg-white rounded-2xl p-3 text-center border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Sesi Masuk</span>
                <span className="text-xs font-black text-slate-800 block truncate mt-0.5">{user?.nama_lengkap}</span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-red-600 uppercase mt-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/60">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {user?.role}
                </span>
              </div>
            ) : (
              <div className="flex justify-center group relative cursor-pointer py-1">
                <div className="w-9 h-9 rounded-full bg-red-50 text-red-650 flex items-center justify-center font-bold text-sm border border-red-200 shadow-xs hover:bg-red-100/55 transition-colors">
                  🏥
                </div>
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-2xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
                  Klinik Utama HNZ &bull; {user?.role}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-950/95" />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ======================== MOBILE SLIDING DRAWER ======================== */}
        {/* Backdrop overlay */}
        <div 
          className={`lg:hidden fixed inset-0 z-98 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Slide-out Panel */}
        <aside 
          className={`lg:hidden fixed left-0 top-16 bottom-0 z-99 w-64 bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            <div className="mb-6 flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                {getInitials(user?.nama_lengkap)}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-extrabold text-slate-950 block truncate">{user?.nama_lengkap}</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 uppercase mt-0.5 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/50">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> {user?.role}
                </span>
              </div>
            </div>
            
            {sidebarItems.map((item) => {
              if (!menuAkses.includes(item.path)) return null;
              
              const isActive = pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-50 to-rose-50/30 text-red-600 font-bold border-l-4 border-red-600 pl-3 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 pl-4 hover:translate-x-1'
                  }`}
                >
                  <span className="text-lg shrink-0 w-6 text-center">{item.icon}</span>
                  <span className="ml-3">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Logout inside mobile drawer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-650 py-3.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              🚪 Keluar dari Aplikasi
            </button>
          </div>
        </aside>

        {/* ======================== WORKSPACE CONTENT AREA ======================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ======================== MODAL MONITOR AKTIVITAS SESI (PREMIUM) ======================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-up text-left flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📜</span> Log Transaksi & Aktivitas Sesi
                </h3>
                <p className="text-xs text-slate-500">Memantau waktu masuk-keluar dan seluruh riwayat tindakan Anda di aplikasi.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm flex items-center justify-center font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profil Sesi Aktif */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs mb-4">
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Pegawai</span>
                <span className="text-slate-800 font-extrabold text-sm">{user?.nama_lengkap}</span>
                <span className="text-slate-500 block">Username: @{user?.username} ({user?.role})</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Sesi Saat Ini</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Aktif Terbuka
                </span>
                <span className="text-slate-500 block mt-0.5">Token: {token?.slice(0, 16)}...</span>
              </div>
            </div>

            {/* List Riwayat Aktivitas */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Linimasa Tindakan (10 Sesi Terbaru)</h4>
              
              {fetchingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600 mb-3" />
                  Memuat data transaksi audit...
                </div>
              ) : sessionHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada log transaksi untuk sesi ini.
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-slate-100">
                  {sessionHistory.map((sess: any, idx: number) => (
                    <div key={sess.id_sesi} className="relative pl-10">
                      
                      {/* Timeline Node Icon */}
                      <div className={`absolute left-0 top-0.5 h-10 w-10 rounded-xl border flex items-center justify-center text-lg shadow-sm ${idx === 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {idx === 0 ? '✨' : '📅'}
                      </div>
                      
                      {/* Session Info */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-xs font-black text-slate-800">
                            Sesi {new Date(sess.waktu_login).toLocaleString('id-ID')}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${sess.waktu_logout ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                            {sess.waktu_logout ? `Logout: ${new Date(sess.waktu_logout).toLocaleTimeString('id-ID')}` : 'Sesi Aktif'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">IP: {sess.ip_address} | Browser: {sess.user_agent?.substring(0, 60)}...</p>
                        
                        {/* Nested Action Logs */}
                        <div className="mt-3 space-y-2.5">
                          {sess.log_aktivitas?.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic pl-3 border-l-2 border-slate-100">Login terdaftar, belum ada tindakan mutasi.</p>
                          ) : (
                            sess.log_aktivitas.map((log: any) => (
                              <div key={log.id_log} className="text-xs pl-3 border-l-2 border-slate-200 py-0.5">
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="font-semibold">{log.deskripsi}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0 ml-4">
                                    {new Date(log.waktu_aksi).toLocaleTimeString('id-ID')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-red-500 font-mono mt-0.5 uppercase tracking-wide">{log.endpoint}</div>
                              </div>
                            ))
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-400">
              <span>Sistem Log Keamanan Klinik HNZ &bull; Real-time Audit</span>
              <button 
                onClick={fetchActivityLogs}
                className="text-xs font-bold text-red-600 hover:text-red-500 underline cursor-pointer"
              >
                🔄 Segarkan Data
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}